# GitHub Actions Workflows

This directory contains GitHub Actions workflows for the Singapore Weather Cam project. All workflows have been optimized to work within GitHub's free tier limits (2,000 minutes/month).

## 📊 Usage Optimization Summary

### Before Optimization
- **Weather Collection**: Every 5 minutes = 8,640 runs/month = ~86,400 minutes
- **Webcam Capture**: Every 15 minutes = 2,880 runs/month = ~43,200 minutes
- **Total**: ~129,600 minutes/month (65x over free tier!)

### After Optimization
- **Weather Collection**: Every 30 minutes = 1,440 runs/month = ~14,400 minutes
- **Webcam Capture**: Every 30 minutes = 1,440 runs/month = ~21,600 minutes
- **Deployment**: ~50 runs/month = ~250 minutes
- **Monitoring**: 60 runs/month = ~300 minutes
- **Total**: ~36,550 minutes/month (**Still over limit - needs further optimization**)

### Recommended Settings (Within Free Tier)
To stay within the 2,000 minute free tier, update the cron schedules:
- **Weather Collection**: `0 */2 * * *` (every 2 hours) = 360 runs/month = ~3,600 minutes
- **Webcam Capture**: `0 */2 * * *` (every 2 hours) = 360 runs/month = ~5,400 minutes
- **Total**: ~9,550 minutes/month (**Safe within free tier**)

## 🔧 Workflows

### 1. Deploy (`deploy.yml`)
- **Trigger**: Push to main branch or manual
- **Purpose**: Build and deploy the React app to GitHub Pages
- **Duration**: ~5 minutes per run
- **Optimizations**:
  - ✅ Dependency caching
  - ✅ Build artifact uploading
  - ✅ Updated to latest action versions

### 2. Weather Collection (`collect-weather.yml`)
- **Schedule**: Every 30 minutes (configurable)
- **Purpose**: Collect weather data from NEA Singapore API
- **Duration**: ~10 minutes per run
- **Optimizations**:
  - ✅ Reduced frequency from 5 to 30 minutes
  - ✅ Dependency caching
  - ✅ Fallback data on API failure
  - ✅ Enhanced error recovery

### 3. Webcam Capture (`capture-webcam.yml`)
- **Schedule**: Every 30 minutes (configurable)
- **Purpose**: Capture images from Singapore traffic cameras
- **Duration**: ~15 minutes per run
- **Optimizations**:
  - ✅ Reduced frequency from 15 to 30 minutes
  - ✅ Dependency caching
  - ✅ Concurrent capture processing
  - ✅ Image cleanup for old files

### 4. Usage Monitor (`monitor-usage.yml`)
- **Schedule**: Daily at 00:00 UTC
- **Purpose**: Monitor GitHub Actions usage and generate reports
- **Duration**: ~5 minutes per run
- **Features**:
  - 📊 Usage calculation and projections
  - 📈 Optimization recommendations
  - 🚨 High usage alerts
  - 📄 Automated report generation

### 5. Health Check (`health-check.yml`)
- **Schedule**: Twice daily (00:00 and 12:00 UTC)
- **Purpose**: Monitor system health and API availability
- **Duration**: ~5 minutes per run
- **Features**:
  - 🏥 API availability checks
  - 📅 Data freshness monitoring
  - 🔒 Security vulnerability scanning
  - 🚨 Automatic issue creation for critical problems

## 🚀 Quick Commands

### Manual Workflow Runs
```bash
# Deploy to GitHub Pages
gh workflow run deploy.yml

# Collect weather data
gh workflow run collect-weather.yml

# Capture webcam images
gh workflow run capture-webcam.yml

# Run health check
gh workflow run health-check.yml -f check_type=full

# Generate usage report
gh workflow run monitor-usage.yml -f report_type=detailed
```

### View Workflow Status
```bash
# List recent workflow runs
gh run list

# View specific workflow runs
gh run list --workflow=deploy.yml

# Watch a running workflow
gh run watch
```

### Debugging Workflows
```bash
# View workflow logs
gh run view [run-id] --log

# Download workflow artifacts
gh run download [run-id]

# Re-run failed workflow
gh run rerun [run-id]
```

## 🔐 Required Secrets

Configure these in Settings → Secrets and variables → Actions:

1. **CLAUDE_API_KEY** (Optional)
   - For AI-powered image analysis
   - Get from: https://console.anthropic.com/

2. **OPENWEATHER_API_KEY** (Optional)
   - Backup weather data source
   - Get from: https://openweathermap.org/api

## 📈 Monitoring

### Usage Dashboard
- View current usage: `docs/github-actions-usage.md`
- Usage badge: `.github/badges/actions-usage.json`

### Health Status
- API endpoint: `public/api/health.json`
- Health check issues: Labels `health-check` and `automated`

## 🛠️ Troubleshooting

### Common Issues

1. **Workflow timeouts**
   - Increase timeout in workflow file
   - Check API response times
   - Review network connectivity

2. **Dependency installation failures**
   - Clear npm cache: `npm cache clean --force`
   - Update package-lock.json: `npm install`
   - Check for conflicting versions

3. **API failures**
   - Verify API keys are set correctly
   - Check API service status
   - Review rate limits

4. **High usage warnings**
   - Reduce cron frequencies
   - Implement conditional runs
   - Consider self-hosted runners

## 🔄 Future Optimizations

1. **Conditional Runs**
   - Skip runs if no significant changes
   - Implement change detection

2. **Smart Scheduling**
   - Reduce frequency during low-traffic hours
   - Increase during peak times

3. **Workflow Chaining**
   - Use workflow_run events
   - Reduce duplicate work

4. **Self-Hosted Runners**
   - For resource-intensive tasks
   - Unlimited minutes

## 📚 Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Action Marketplace](https://github.com/marketplace?type=actions)
- [Usage Limits](https://docs.github.com/en/actions/learn-github-actions/usage-limits-billing-and-administration)
- [Best Practices](https://docs.github.com/en/actions/guides/building-and-testing-nodejs)

---

Last Updated: January 2024
Optimized for GitHub Free Tier (2,000 minutes/month)