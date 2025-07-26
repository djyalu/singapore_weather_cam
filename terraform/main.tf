# Singapore Weather Cam Infrastructure
# Main Terraform configuration

terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket = "singapore-weather-cam-terraform-state"
    key    = "infrastructure/terraform.tfstate"
    region = "ap-southeast-1"
    
    dynamodb_table = "terraform-state-lock"
    encrypt        = true
  }
}

# Provider configuration
provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "singapore-weather-cam"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# Variables
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "ap-southeast-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = ""
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# S3 bucket for static assets
resource "aws_s3_bucket" "assets" {
  bucket = "singapore-weather-cam-assets-${var.environment}"
}

resource "aws_s3_bucket_versioning" "assets" {
  bucket = aws_s3_bucket.assets.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "assets" {
  bucket = aws_s3_bucket.assets.id
  
  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# CloudFront distribution
resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "Singapore Weather Cam CDN"
  default_root_object = "index.html"
  
  origin {
    domain_name = aws_s3_bucket.assets.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.assets.id}"
    
    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.main.cloudfront_access_identity_path
    }
  }
  
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.assets.id}"
    
    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
    
    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    compress               = true
  }
  
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
  
  viewer_certificate {
    cloudfront_default_certificate = true
  }
}

resource "aws_cloudfront_origin_access_identity" "main" {
  comment = "OAI for Singapore Weather Cam"
}

# DynamoDB tables
module "dynamodb" {
  source = "./modules/dynamodb"
  
  environment = var.environment
  
  tables = {
    weather_data = {
      hash_key  = "PK"
      range_key = "SK"
      
      attributes = [
        {
          name = "PK"
          type = "S"
        },
        {
          name = "SK"
          type = "S"
        },
        {
          name = "GSI1PK"
          type = "S"
        },
        {
          name = "GSI1SK"
          type = "S"
        }
      ]
      
      global_secondary_indexes = [
        {
          name            = "GSI1"
          hash_key        = "GSI1PK"
          range_key       = "GSI1SK"
          projection_type = "ALL"
        }
      ]
      
      ttl = {
        enabled        = true
        attribute_name = "ttl"
      }
      
      stream_enabled   = true
      stream_view_type = "NEW_AND_OLD_IMAGES"
    }
    
    webcam_captures = {
      hash_key  = "PK"
      range_key = "SK"
      
      attributes = [
        {
          name = "PK"
          type = "S"
        },
        {
          name = "SK"
          type = "S"
        }
      ]
      
      ttl = {
        enabled        = true
        attribute_name = "ttl"
      }
    }
  }
}

# Lambda functions
module "lambda_functions" {
  source = "./modules/lambda"
  
  environment     = var.environment
  s3_bucket_name  = aws_s3_bucket.assets.id
  
  functions = {
    weather_collector = {
      description = "Collects weather data from APIs"
      handler     = "index.handler"
      runtime     = "nodejs18.x"
      memory_size = 256
      timeout     = 30
      
      environment_variables = {
        WEATHER_TABLE_NAME = module.dynamodb.table_names["weather_data"]
        WEATHER_API_URL    = "https://api.data.gov.sg/v1/environment/air-temperature"
      }
      
      schedule_expression = "rate(1 minute)"
    }
    
    webcam_processor = {
      description = "Processes webcam images"
      handler     = "index.handler"
      runtime     = "nodejs18.x"
      memory_size = 1024
      timeout     = 300
      
      environment_variables = {
        WEBCAM_TABLE_NAME = module.dynamodb.table_names["webcam_captures"]
        S3_BUCKET_NAME    = aws_s3_bucket.assets.id
      }
      
      schedule_expression = "rate(30 minutes)"
    }
    
    api_handler = {
      description = "Handles API requests"
      handler     = "index.handler"
      runtime     = "nodejs18.x"
      memory_size = 512
      timeout     = 29
      
      environment_variables = {
        WEATHER_TABLE_NAME = module.dynamodb.table_names["weather_data"]
        WEBCAM_TABLE_NAME  = module.dynamodb.table_names["webcam_captures"]
      }
    }
  }
}

# API Gateway
module "api_gateway" {
  source = "./modules/api-gateway"
  
  environment       = var.environment
  lambda_invoke_arn = module.lambda_functions.function_arns["api_handler"]
  lambda_name       = module.lambda_functions.function_names["api_handler"]
}

# EventBridge rules
resource "aws_cloudwatch_event_rule" "weather_schedule" {
  name                = "weather-collector-schedule-${var.environment}"
  description         = "Trigger weather data collection"
  schedule_expression = "rate(1 minute)"
}

resource "aws_cloudwatch_event_target" "weather_lambda" {
  rule      = aws_cloudwatch_event_rule.weather_schedule.name
  target_id = "WeatherCollectorLambda"
  arn       = module.lambda_functions.function_arns["weather_collector"]
}

resource "aws_lambda_permission" "weather_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = module.lambda_functions.function_names["weather_collector"]
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.weather_schedule.arn
}

# Outputs
output "cloudfront_url" {
  description = "CloudFront distribution URL"
  value       = "https://${aws_cloudfront_distribution.main.domain_name}"
}

output "api_gateway_url" {
  description = "API Gateway URL"
  value       = module.api_gateway.api_url
}

output "s3_bucket_name" {
  description = "S3 bucket name for assets"
  value       = aws_s3_bucket.assets.id
}