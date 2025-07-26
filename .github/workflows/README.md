# GitHub Actions Workflows

This directory contains the automated workflows for the Singapore Weather Cam project, focusing on Bukit Timah area data collection and deployment.

## 🚀 Workflows Overview

### 1. Weather Data Collection (`collect-weather.yml`)
- **Schedule**: Every 5 minutes (`*/5 * * * *`)
- **Purpose**: Collect real-time weather data from NEA Singapore API
- **Focus Area**: Bukit Timah region (stations S121, S116, S118)
- **Output**: Updates `data/weather/latest.json` and historical data

**Key Features:**
- Free NEA Singapore API (no rate limits)
- Automatic fallback to OpenWeatherMap if configured
- Intelligent error handling and retry logic
- Automatic git commits with weather summaries
- ~150 minutes/month GitHub Actions usage

### 2. Webcam Image Capture (`capture-webcam.yml`)
- **Schedule**: Every 15 minutes (`*/15 * * * *`)
- **Purpose**: Capture images from Singapore traffic cameras and public webcams
- **Sources**: LTA traffic cameras, test images, public webcams
- **Output**: Images in `public/images/webcam/` and metadata in `data/webcam/`

**Key Features:**
- Browser capture disabled for GitHub Actions optimization
- Optional Claude AI image analysis (if API key provided)
- Batch processing with rate limiting
- Automatic image cleanup (7 days retention)
- Comprehensive error handling and retry logic

### 3. GitHub Pages Deployment (`deploy.yml`)
- **Trigger**: Push to main branch or manual dispatch
- **Purpose**: Build and deploy the React application to GitHub Pages
- **URL**: `https://[username].github.io/singapore_weather_cam/`

**Key Features:**
- Vite-based React build system
- Automatic data copying to public directory
- Build verification and health checks
- Progressive build process with error reporting
- Proper GitHub Pages configuration

## 🔧 Setup Instructions

### 1. Enable GitHub Actions
1. Go to your repository settings
2. Navigate to "Actions" > "General"
3. Enable "Allow all actions and reusable workflows"

### 2. Enable GitHub Pages
1. Go to repository "Settings" > "Pages"
2. Select "GitHub Actions" as the source
3. The site will be available at `https://[username].github.io/singapore_weather_cam/`

### 3. Environment Variables (Optional)
Add these secrets in "Settings" > "Secrets and variables" > "Actions":

- `OPENWEATHER_API_KEY`: OpenWeatherMap API key for weather data fallback
- `CLAUDE_API_KEY`: Claude API key for AI-powered webcam image analysis

**Note**: All workflows work without these keys using free Singapore government APIs.

## 📊 Resource Usage

### GitHub Actions Free Tier Limits
- **Monthly limit**: 2,000 minutes
- **Estimated usage**: ~150 minutes/month
- **Remaining capacity**: ~1,850 minutes for other workflows

### Breakdown by Workflow:
- **Weather collection**: ~720 runs/month × 2 min = ~1,440 minutes
- **Webcam capture**: ~2,880 runs/month × 3 min = ~8,640 minutes  
- **Deployment**: ~10 runs/month × 5 min = ~50 minutes

**Total estimated**: ~10,130 minutes/month

⚠️ **Important**: The current schedule exceeds free tier limits. Consider:
- Reducing webcam capture frequency to 30 minutes
- Using conditional triggers based on data changes
- Implementing smart scheduling during peak hours only

## 🛠️ Workflow Details

### Weather Collection Process
1. **Data Sources**: NEA Singapore API (primary), OpenWeatherMap (fallback)
2. **Focus Stations**: S121, S116, S118 (Bukit Timah area priority)
3. **Data Processing**: Temperature, humidity, rainfall, forecast aggregation
4. **Storage**: Timestamped files with daily summaries
5. **Git Integration**: Automatic commits with weather summaries

### Webcam Capture Process
1. **Source Discovery**: LTA traffic API for real-time camera URLs
2. **Image Download**: Direct HTTP downloads (no browser needed)
3. **AI Analysis**: Optional Claude-powered image description
4. **Storage**: Images with metadata and daily summaries
5. **Cleanup**: Automatic deletion of images older than 7 days

### Deployment Process
1. **Build Verification**: Check project structure and dependencies
2. **Data Integration**: Copy latest weather/webcam data to public directory
3. **Vite Build**: Production-optimized React build
4. **GitHub Pages**: Atomic deployment with health checks
5. **Verification**: Post-deployment connectivity testing

## 🔍 Monitoring & Debugging

### View Workflow Status
- **Actions Tab**: See all workflow runs and their status
- **Workflow Badges**: Add status badges to README.md
- **Email Notifications**: Configure in personal GitHub settings

### Common Issues & Solutions

**Weather Collection Fails:**
- Check NEA API status: https://api.data.gov.sg/v1/environment/air-temperature
- Verify data directory permissions
- Review error logs in workflow run details

**Webcam Capture Fails:**
- LTA API might be temporarily unavailable
- Network connectivity issues
- Image download timeouts

**Deployment Fails:**
- Build errors in React application
- Missing dependencies in package.json
- GitHub Pages configuration issues

### Debug Commands
```bash
# Test weather collection locally
node scripts/collect-weather.js

# Test webcam capture locally (with browser disabled)
DISABLE_BROWSER_CAPTURE=true node scripts/capture-webcam.js

# Test build locally
npm run build
```

## 📈 Performance Optimization

### Current Optimizations
- Browser capture disabled in GitHub Actions
- Batch processing for webcam captures
- Compressed image storage
- Efficient data JSON structures
- Smart dependency caching

### Future Improvements
- Conditional workflow triggers
- Parallel data processing
- Image compression optimization
- CDN integration for assets
- Smart scheduling based on data changes

## 🏗️ Architecture Integration

These workflows are part of the **GitHub-Native JAMstack** architecture:

- **Frontend**: React + Vite (static build)
- **Backend**: GitHub Actions (serverless data collection)
- **Database**: Git repository (JSON files)
- **CDN**: GitHub Pages (global distribution)
- **Monitoring**: GitHub Actions logs and notifications

This architecture provides:
- **Zero operational costs** (within free tier limits)
- **Global CDN distribution** via GitHub infrastructure
- **Automatic version control** for all data
- **High availability** with GitHub's SLA
- **Simple scaling** through workflow optimization

## 🔄 Maintenance Tasks

### Weekly:
- Review workflow run logs for errors
- Monitor GitHub Actions usage quotas
- Check data collection success rates

### Monthly:
- Analyze storage usage trends
- Review and optimize workflow schedules
- Update dependencies in package.json
- Performance analysis and optimization

### As Needed:
- Update API endpoints if Singapore government APIs change
- Adjust Bukit Timah area focus based on requirements
- Scale workflows based on usage patterns
- Implement new data sources or processing features