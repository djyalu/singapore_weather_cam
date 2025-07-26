# 🔧 Troubleshooting Guide

Singapore Weather Cam 프로젝트의 문제 해결 가이드입니다.

## 📋 **목차**

- [Common Issues](#common-issues)
- [Development Issues](#development-issues)
- [Deployment Issues](#deployment-issues)
- [API Issues](#api-issues)
- [Performance Issues](#performance-issues)
- [Data Collection Issues](#data-collection-issues)

## 🚨 **Common Issues**

### **1. Application Won't Start**

#### **Error: "Module not found"**
```bash
# Solution: Install dependencies
npm install

# Clear cache if needed
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

#### **Error: "Port 5173 is already in use"**
```bash
# Solution: Kill process or use different port
kill -9 $(lsof -t -i:5173)
# OR
npm run dev -- --port 3000
```

### **2. Build Failures**

#### **Error: "Build failed with exit code 1"**
```bash
# Check for TypeScript/ESLint errors
npm run lint
npm run lint:fix

# Verify dependencies
npm audit fix

# Try clean build
rm -rf dist node_modules
npm install
npm run build
```

#### **Error: "Out of memory"**
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

## 💻 **Development Issues**

### **Hot Module Replacement (HMR) Not Working**

#### **Symptoms**: Changes not reflecting in browser
```bash
# Solutions:
1. Restart dev server: Ctrl+C then npm run dev
2. Clear browser cache: Ctrl+Shift+R
3. Check file watchers: 
   echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
```

### **API Development Issues**

#### **CORS Errors in Development**
```javascript
// vite.config.js - Add proxy
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'https://api.data.gov.sg',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
});
```

#### **Environment Variables Not Loading**
```bash
# Check file naming and location
.env.local              # ✅ Correct
.env                    # ✅ Correct  
env.local               # ❌ Wrong
.environment            # ❌ Wrong

# Verify variable names start with VITE_
VITE_API_KEY=xxx        # ✅ Accessible in client
API_KEY=xxx             # ❌ Not accessible
```

## 🚀 **Deployment Issues**

### **GitHub Actions Failures**

#### **"Resource not accessible by integration"**
```yaml
# Solution: Fix repository permissions
Settings > Actions > General > Workflow permissions
└── Read and write permissions ✅
```

#### **"Pages deployment failed"**
```yaml
# Solution: Check Pages configuration
Settings > Pages > Source
└── GitHub Actions ✅ (not Deploy from branch)
```

#### **Workflow timeout errors**
```yaml
# Solution: Optimize workflow timing
- name: Timeout setting
  timeout-minutes: 15    # Increase from default 5min
```

### **Build Issues on GitHub Actions**

#### **Dependencies installation fails**
```yaml
# Solution: Use npm ci for reproducible builds
- name: Install dependencies
  run: npm ci --prefer-offline --no-audit
```

#### **Build artifacts missing**
```yaml
# Solution: Verify build step
- name: Build
  run: |
    npm run build
    ls -la dist/    # Verify files exist
```

### **GitHub Pages Issues**

#### **404 Error on deployed site**
```javascript
// Solution: Check base URL in vite.config.js
export default defineConfig({
  base: '/singapore_weather_cam/',  // Must match repo name
});
```

#### **Assets not loading**
```html
<!-- Check public path in index.html -->
<link rel="icon" href="/singapore_weather_cam/favicon.ico" />
```

## 🌐 **API Issues**

### **External API Problems**

#### **NEA Singapore API Timeouts**
```javascript
// Solution: Implement retry logic
const fetchWithRetry = async (url, options = {}, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        ...options,
        timeout: 15000,
      });
      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
};
```

#### **Rate Limiting Issues**
```javascript
// Solution: Implement circuit breaker
class CircuitBreaker {
  constructor(threshold = 5, resetTime = 60000) {
    this.threshold = threshold;
    this.resetTime = resetTime;
    this.failures = 0;
    this.isOpen = false;
  }
  
  async call(fn) {
    if (this.isOpen) {
      throw new Error('Circuit breaker is open');
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
}
```

### **Data Format Issues**

#### **Unexpected API response format**
```javascript
// Solution: Add validation
const validateWeatherData = (data) => {
  const required = ['items', 'area_metadata'];
  for (const field of required) {
    if (!data[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  return data;
};
```

#### **Missing data handling**
```javascript
// Solution: Provide fallbacks
const safeGet = (obj, path, defaultValue = null) => {
  return path.split('.').reduce((acc, key) => {
    return acc && acc[key] !== undefined ? acc[key] : defaultValue;
  }, obj);
};

// Usage
const temperature = safeGet(data, 'items.0.readings.0.value', 'N/A');
```

## ⚡ **Performance Issues**

### **Slow Page Loading**

#### **Large bundle size**
```bash
# Analysis
npm run build
npx vite-bundle-analyzer dist/

# Solutions:
1. Enable code splitting
2. Lazy load components
3. Remove unused dependencies
```

#### **Optimize images**
```javascript
// Use responsive images
<picture>
  <source media="(min-width: 768px)" srcSet="large.jpg" />
  <source media="(min-width: 480px)" srcSet="medium.jpg" />
  <img src="small.jpg" alt="Description" />
</picture>
```

### **Memory Leaks**

#### **Identify memory leaks**
```javascript
// Use React DevTools Profiler
// Check for:
1. Unmounted components still in memory
2. Event listeners not cleaned up
3. Timers not cleared
4. Refs not released
```

#### **Fix memory leaks**
```javascript
// Proper cleanup
useEffect(() => {
  const timer = setInterval(updateData, 5000);
  const listener = (e) => handleResize(e);
  
  window.addEventListener('resize', listener);
  
  return () => {
    clearInterval(timer);
    window.removeEventListener('resize', listener);
  };
}, []);
```

## 📊 **Data Collection Issues**

### **Weather Data Collection Fails**

#### **Check workflow logs**
```bash
# GitHub Actions > collect-weather.yml > Latest run
# Look for error messages in logs
```

#### **Manual testing**
```bash
# Test locally
npm run collect-weather

# Check API directly
curl "https://api.data.gov.sg/v1/environment/air-temperature"
```

#### **Common fixes**
```javascript
// 1. Check API endpoint availability
const testAPI = async () => {
  try {
    const response = await fetch('https://api.data.gov.sg/v1/environment/air-temperature');
    console.log('API Status:', response.status);
  } catch (error) {
    console.error('API Error:', error);
  }
};

// 2. Verify data format
const validateResponse = (data) => {
  if (!data.items || !Array.isArray(data.items)) {
    throw new Error('Invalid API response format');
  }
};
```

### **Webcam Capture Issues**

#### **Claude AI API errors**
```javascript
// Check API key validity
const testClaudeAPI = async () => {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CLAUDE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Test' }]
      })
    });
    console.log('Claude API Status:', response.status);
  } catch (error) {
    console.error('Claude API Error:', error);
  }
};
```

#### **Image processing failures**
```javascript
// Solution: Add image validation
const validateImage = async (imageUrl) => {
  try {
    const response = await fetch(imageUrl, { method: 'HEAD' });
    const contentType = response.headers.get('content-type');
    
    if (!contentType.startsWith('image/')) {
      throw new Error('Invalid image format');
    }
    
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 5 * 1024 * 1024) {
      throw new Error('Image too large');
    }
    
    return true;
  } catch (error) {
    console.error('Image validation failed:', error);
    return false;
  }
};
```

## 🔍 **Debugging Tools**

### **Browser Developer Tools**

#### **Console errors**
```javascript
// Enable verbose logging in development
if (import.meta.env.DEV) {
  console.log('Debug info:', data);
}

// Use structured logging
const logger = {
  info: (message, data) => console.log(`[INFO] ${message}`, data),
  error: (message, error) => console.error(`[ERROR] ${message}`, error),
  warn: (message, data) => console.warn(`[WARN] ${message}`, data),
};
```

#### **Network tab inspection**
```javascript
// Check API calls in Network tab
// Look for:
1. Failed requests (red status)
2. Slow requests (timing)
3. Large payloads (size)
4. Correct headers
```

### **React Developer Tools**

#### **Component debugging**
```javascript
// Use React DevTools Profiler
// Check for:
1. Unnecessary re-renders
2. Large component trees  
3. Slow components
4. Memory usage
```

## 📞 **Getting Help**

### **Support Channels**
1. **GitHub Issues**: [Create new issue](https://github.com/djyalu/singapore_weather_cam/issues)
2. **Discussions**: [GitHub Discussions](https://github.com/djyalu/singapore_weather_cam/discussions)
3. **Documentation**: Check other docs in `/docs` folder

### **Reporting Bugs**

#### **Bug Report Template**
```markdown
## 🐛 Bug Description
Brief description of the issue

## 🔄 Steps to Reproduce
1. Go to...
2. Click on...
3. See error

## 💻 Environment
- OS: [e.g., Windows 10, macOS, Ubuntu]
- Browser: [e.g., Chrome 91, Firefox 89]
- Node.js: [e.g., 18.17.0]
- npm: [e.g., 9.6.7]

## 📷 Screenshots
(If applicable)

## 🔗 Additional Context
Any other context about the problem
```

### **Performance Issues**

#### **Performance Report Template**
```markdown
## ⚡ Performance Issue
Description of the performance problem

## 📊 Metrics
- Page load time: X seconds
- Bundle size: X MB
- Memory usage: X MB
- Lighthouse score: X

## 🔧 Environment
Same as bug report template

## 📈 Expected Performance
What performance you expected
```

---

**🤖 Generated with [Claude Code](https://claude.ai/code)**

**Co-Authored-By: Claude <noreply@anthropic.com>**