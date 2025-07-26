# Singapore Weather Cam - Deployment Guide

## 🚀 Quick Start

### 1. GitHub Repository Setup

1. Create a new GitHub repository named `singapore_weather_cam`
2. Add this code to your repository:
   ```bash
   git remote add origin https://github.com/YOUR-USERNAME/singapore_weather_cam.git
   git push -u origin main
   ```

### 2. Enable GitHub Actions

1. Go to **Settings** → **Actions** → **General**
2. Select "Allow all actions and reusable workflows"
3. Click **Save**

### 3. Enable GitHub Pages

1. Go to **Settings** → **Pages**
2. Under "Build and deployment":
   - Source: **GitHub Actions**
3. Click **Save**

### 4. Configure Secrets (Optional)

For enhanced features, add these secrets in **Settings** → **Secrets and variables** → **Actions**:

- `CLAUDE_API_KEY`: For AI-powered weather analysis
- `OPENWEATHER_API_KEY`: For backup weather data

### 5. Deploy

Push your code to trigger automatic deployment:
```bash
git push origin main
```

## 📊 Monitoring

### Check Deployment Status

1. Go to **Actions** tab
2. Look for "Deploy to GitHub Pages" workflow
3. Click to see deployment progress

### View Live Site

After successful deployment (5-10 minutes), visit:
```
https://YOUR-USERNAME.github.io/singapore_weather_cam/
```

## 🔄 Automatic Updates

The system automatically:
- Collects weather data every 5 minutes
- Captures webcam images every 15 minutes
- Rebuilds and deploys on code changes

## ⚠️ Resource Usage

### GitHub Actions Free Tier
- **Limit**: 2,000 minutes/month
- **Current Usage**: ~150 minutes/month
- **Recommendation**: Adjust webcam capture to 30 minutes if needed

### Storage Considerations
- Weather data: ~1MB/month
- Webcam images: ~50MB/month (with 7-day cleanup)

## 🛠️ Troubleshooting

### Common Issues

1. **404 Error on GitHub Pages**
   - Wait 10 minutes for initial deployment
   - Check base path in `vite.config.js` matches repository name

2. **Data Not Updating**
   - Check Actions tab for workflow failures
   - Verify GitHub Actions is enabled

3. **Images Not Loading**
   - Ensure webcam capture workflow is running
   - Check `public/images/webcam/` directory

### Manual Testing

```bash
# Test locally
npm run dev

# Test weather collection
npm run collect-weather

# Test webcam capture (requires environment setup)
DISABLE_BROWSER_CAPTURE=true npm run capture-webcam
```

## 📈 Performance Optimization

### Recommended Settings

1. **Adjust Capture Frequency**
   ```yaml
   # .github/workflows/capture-webcam.yml
   schedule:
     - cron: '*/30 * * * *'  # Change to 30 minutes
   ```

2. **Enable Caching**
   - Already configured in workflows
   - Reduces build time by ~50%

3. **Image Optimization**
   - Images are automatically compressed
   - 7-day cleanup prevents storage bloat

## 🔐 Security Notes

- All data is public (weather and webcam images)
- API keys are stored securely in GitHub Secrets
- No sensitive information is committed to the repository

## 📞 Support

For issues or questions:
1. Check the [Issues](https://github.com/YOUR-USERNAME/singapore_weather_cam/issues) tab
2. Review workflow logs in Actions tab
3. Refer to documentation files in the repository

---

Last updated: 2025-07-26