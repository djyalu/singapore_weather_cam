# Singapore Weather Cam - Modern Cloud-Native Architecture v2.0

## Executive Summary

현재 JAMstack 기반 아키텍처에서 확장 가능한 클라우드 네이티브 아키텍처로의 진화 전략을 제시합니다.

## 아키텍처 원칙

### 1. Cloud-Native First
- 서버리스 우선 접근
- 컨테이너 기반 배포
- 마이크로서비스 아키텍처
- 이벤트 드리븐 설계

### 2. Scalability by Design
- 수평적 확장 가능
- 자동 스케일링
- 글로벌 배포 지원
- 캐싱 전략 내재화

### 3. Observability Built-in
- 분산 추적
- 메트릭 수집
- 중앙화된 로깅
- 실시간 모니터링

## 시스템 아키텍처

### Layer 1: Edge Computing
```
┌─────────────────────────────────────────────────┐
│              Global Edge Network                 │
├─────────────────┬─────────────────┬─────────────┤
│ CloudFlare      │ Vercel Edge     │ AWS         │
│ Workers         │ Functions       │ CloudFront  │
│                 │                 │ Lambda@Edge │
└─────────────────┴─────────────────┴─────────────┘
```

**책임**:
- 지역별 캐싱
- 요청 라우팅
- DDoS 보호
- 이미지 최적화

### Layer 2: API Gateway
```
┌─────────────────────────────────────────────────┐
│              Unified API Layer                   │
├─────────────────┬─────────────────┬─────────────┤
│ REST API        │ GraphQL         │ WebSocket   │
│ (Legacy)        │ (Modern)        │ (Real-time) │
└─────────────────┴─────────────────┴─────────────┘
```

**기술 스택**:
- AWS API Gateway (REST)
- AWS AppSync (GraphQL)
- AWS IoT Core (WebSocket)

### Layer 3: Compute Services
```
┌─────────────────────────────────────────────────┐
│             Serverless Compute                   │
├──────────────┬──────────────┬──────────────────┤
│ AWS Lambda   │ Step Functions│ ECS Fargate     │
│ (Functions)  │ (Workflows)   │ (Containers)    │
└──────────────┴──────────────┴──────────────────┘
```

### Layer 4: Event Processing
```
┌─────────────────────────────────────────────────┐
│            Event-Driven Architecture             │
├──────────────┬──────────────┬──────────────────┤
│ EventBridge  │ Kinesis      │ SQS/SNS         │
│ (Orchestrate)│ (Stream)     │ (Queue)         │
└──────────────┴──────────────┴──────────────────┘
```

### Layer 5: Data Persistence
```
┌─────────────────────────────────────────────────┐
│              Multi-Model Database                │
├──────────────┬──────────────┬──────────────────┤
│ DynamoDB     │ TimeStream   │ Aurora          │
│ (NoSQL)      │ (Time-series)│ (Analytics)     │
├──────────────┼──────────────┼──────────────────┤
│ ElastiCache  │ S3           │ OpenSearch      │
│ (Cache)      │ (Storage)    │ (Search)        │
└──────────────┴──────────────┴──────────────────┘
```

## 마이크로서비스 설계

### 1. Weather Collector Service
```yaml
service: weather-collector
runtime: Lambda Node.js 18.x
memory: 256MB
timeout: 30s
triggers:
  - EventBridge Schedule (1분)
  - API Gateway (manual refresh)
dependencies:
  - Weather.gov.sg API
  - OpenWeatherMap API
outputs:
  - DynamoDB (실시간 데이터)
  - Kinesis (스트리밍)
  - S3 (아카이브)
```

### 2. Webcam Processor Service
```yaml
service: webcam-processor
runtime: Lambda + Fargate
memory: 1024MB
timeout: 300s
triggers:
  - EventBridge Schedule (30분)
  - S3 Event (이미지 업로드)
dependencies:
  - Puppeteer
  - Sharp (이미지 처리)
  - Claude API
outputs:
  - S3 (이미지 저장)
  - DynamoDB (메타데이터)
  - EventBridge (완료 이벤트)
```

### 3. AI Analysis Service
```yaml
service: ai-analyzer
runtime: Lambda Python 3.11
memory: 512MB
timeout: 60s
triggers:
  - SQS Queue (배치 처리)
  - Direct invocation
dependencies:
  - Claude API
  - Custom ML models
outputs:
  - DynamoDB (분석 결과)
  - SNS (알림)
```

### 4. API Service
```yaml
service: api-gateway
runtime: Lambda + AppSync
endpoints:
  REST:
    - GET /weather/current
    - GET /weather/history
    - GET /webcam/latest
  GraphQL:
    - Query: weather, webcam, insights
    - Mutation: refresh, subscribe
    - Subscription: weatherUpdate, webcamUpdate
```

## 데이터 모델

### DynamoDB Schema
```javascript
// Weather Table
{
  PK: "WEATHER#2024-01-01",
  SK: "TIMESTAMP#1704067200",
  temperature: 28.5,
  humidity: 85,
  rainfall: 0,
  conditions: "partly_cloudy",
  location: {
    lat: 1.3521,
    lon: 103.8198
  },
  ttl: 1704672000 // 7일 후 자동 삭제
}

// Webcam Table
{
  PK: "WEBCAM#2024-01-01",
  SK: "CAPTURE#1704067200",
  imageUrl: "s3://bucket/images/2024/01/01/capture.jpg",
  thumbnailUrl: "s3://bucket/thumbs/2024/01/01/capture.jpg",
  analysis: {
    visibility: "good",
    weather: "clear",
    aiDescription: "Clear morning sky..."
  }
}
```

### GraphQL Schema
```graphql
type Query {
  currentWeather: Weather!
  weatherHistory(hours: Int = 24): [Weather!]!
  webcamLatest: WebcamCapture!
  weatherInsights: AIAnalysis!
}

type Subscription {
  weatherUpdated: Weather! @aws_subscribe(mutations: ["updateWeather"])
  webcamCaptured: WebcamCapture! @aws_subscribe(mutations: ["captureWebcam"])
}

type Weather {
  id: ID!
  timestamp: AWSDateTime!
  temperature: Float!
  humidity: Float!
  rainfall: Float!
  conditions: WeatherCondition!
  location: Location!
}

type WebcamCapture {
  id: ID!
  timestamp: AWSDateTime!
  imageUrl: AWSURL!
  thumbnailUrl: AWSURL!
  analysis: ImageAnalysis!
}
```

## 배포 전략

### Phase 1: MVP (월 $0-10)
```yaml
infrastructure:
  frontend: Vercel (무료)
  api: Vercel Functions
  database: Supabase (무료)
  storage: Cloudinary (무료)
  monitoring: Vercel Analytics

features:
  - 기본 날씨 표시
  - 정적 웹캠 이미지
  - 일일 업데이트
```

### Phase 2: Growth (월 $50-200)
```yaml
infrastructure:
  frontend: Vercel Pro
  api: AWS Lambda + API Gateway
  database: DynamoDB + Aurora Serverless
  storage: S3 + CloudFront
  event: EventBridge
  monitoring: CloudWatch + X-Ray

features:
  - 실시간 업데이트
  - 웹캠 스트리밍
  - AI 분석
  - 알림 시스템
```

### Phase 3: Scale (월 $500+)
```yaml
infrastructure:
  frontend: Multi-CDN
  compute: EKS + Fargate
  database: Global Tables
  streaming: Kinesis
  analytics: Redshift
  ml: SageMaker

features:
  - 다중 지역 지원
  - 예측 모델
  - 고급 분석
  - API 제공
```

## 모니터링 및 관찰성

### Metrics
```yaml
business_metrics:
  - 활성 사용자 수
  - API 호출 횟수
  - 페이지 로드 시간
  
technical_metrics:
  - Lambda 실행 시간
  - DynamoDB 읽기/쓰기 용량
  - S3 대역폭 사용량
  - 에러율
```

### Alerts
```yaml
critical:
  - API 응답 시간 > 1초
  - 에러율 > 1%
  - DynamoDB 스로틀링
  
warning:
  - Lambda 동시 실행 > 80%
  - 비용 예상치 초과
  - 캐시 히트율 < 80%
```

## 보안 고려사항

### 1. Authentication & Authorization
- AWS Cognito (사용자 인증)
- API Key (rate limiting)
- IAM Roles (서비스 간 통신)

### 2. Data Protection
- 전송 중 암호화 (TLS 1.3)
- 저장 시 암호화 (KMS)
- 민감 데이터 마스킹

### 3. Network Security
- VPC isolation
- Security Groups
- WAF rules

## 비용 최적화

### 1. Compute
- Lambda Reserved Concurrency
- Spot instances for batch jobs
- Right-sizing functions

### 2. Storage
- S3 Lifecycle policies
- Intelligent-Tiering
- CloudFront caching

### 3. Database
- DynamoDB On-Demand
- Aurora Serverless auto-pause
- ElastiCache eviction policies

## 마이그레이션 로드맵

### Week 1-2: Foundation
- [ ] AWS 계정 설정
- [ ] Terraform 기본 구성
- [ ] CI/CD 파이프라인

### Week 3-4: Core Services
- [ ] Weather Collector Lambda
- [ ] DynamoDB 테이블 생성
- [ ] API Gateway 설정

### Week 5-6: Frontend Migration
- [ ] Vercel 배포 설정
- [ ] GraphQL 클라이언트
- [ ] 실시간 업데이트

### Week 7-8: Advanced Features
- [ ] AI 분석 통합
- [ ] 알림 시스템
- [ ] 모니터링 대시보드

## 성공 지표

### Technical KPIs
- API 응답 시간 < 200ms (P99)
- 가용성 > 99.9%
- 배포 빈도 > 일 2회

### Business KPIs
- 월간 활성 사용자 > 10,000
- 페이지 로드 시간 < 2초
- 운영 비용 < $200/월 (성장 단계)

## 결론

이 아키텍처는 현재의 정적 사이트 한계를 극복하고, 실시간 처리와 글로벌 확장이 가능한 현대적인 클라우드 네이티브 솔루션을 제공합니다. 단계별 마이그레이션 전략을 통해 리스크를 최소화하면서 점진적으로 발전시킬 수 있습니다.