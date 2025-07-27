# Security Headers Configuration for Singapore Weather Cam

## Overview

This document explains the security header configuration for the Singapore Weather Cam application hosted on GitHub Pages.

## GitHub Pages Security Header Limitations

GitHub Pages has specific limitations regarding HTTP security headers:

### ✅ Supported via Meta Tags
- **Content-Security-Policy (CSP)**: Can be set via `<meta http-equiv="Content-Security-Policy">`
- **Referrer-Policy**: Can be set via `<meta http-equiv="Referrer-Policy">`
- **Permissions-Policy**: Can be set via `<meta http-equiv="Permissions-Policy">`

### ❌ HTTP Header Only (Cannot use Meta Tags)
- **X-Frame-Options**: Must be set via HTTP response headers
- **X-Content-Type-Options**: Must be set via HTTP response headers  
- **X-XSS-Protection**: Must be set via HTTP response headers
- **Strict-Transport-Security (HSTS)**: Must be set via HTTP response headers

## Current Security Configuration

### Implemented via Meta Tags

```html
<!-- Content Security Policy -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com;
  style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com;
  img-src 'self' data: blob: https://*.data.gov.sg https://*.lta.gov.sg https://res.cloudinary.com;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://api.data.gov.sg https://datamall2.mytransport.sg https://*.openweathermap.org;
  frame-src 'none';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  upgrade-insecure-requests;
" />

<!-- Referrer Policy -->
<meta http-equiv="Referrer-Policy" content="strict-origin-when-cross-origin" />

<!-- Permissions Policy -->
<meta http-equiv="Permissions-Policy" content="
  camera=(),
  microphone=(),
  geolocation=(self),
  interest-cohort=()
" />
```

### GitHub Pages Default HTTP Headers

GitHub Pages automatically provides some security headers:

1. **X-Frame-Options**: GitHub typically sets `X-Frame-Options: DENY` by default
2. **X-Content-Type-Options**: Usually set to `nosniff`
3. **HTTPS Enforcement**: All GitHub Pages sites are served over HTTPS

## Security Analysis

### ✅ Properly Configured
- **CSP**: Comprehensive policy allowing necessary external resources while blocking unauthorized scripts
- **Referrer Policy**: Strict cross-origin referrer policy for privacy
- **Permissions Policy**: Restricts access to sensitive browser APIs
- **HTTPS**: Enforced by GitHub Pages infrastructure

### ⚠️ Platform Limitations
- **X-Frame-Options**: Cannot be explicitly controlled via meta tags (relies on GitHub Pages defaults)
- **X-Content-Type-Options**: Cannot be explicitly controlled via meta tags
- **X-XSS-Protection**: Cannot be set (modern browsers rely on CSP instead)
- **HSTS**: Cannot be explicitly controlled (relies on GitHub Pages infrastructure)

## Security Recommendations

### Immediate (Already Implemented)
1. ✅ Remove invalid meta tag security headers that must be HTTP headers only
2. ✅ Maintain comprehensive CSP policy
3. ✅ Keep Referrer-Policy and Permissions-Policy meta tags
4. ✅ Document GitHub Pages limitations

### Future Enhancements (If Moving to Custom Server)
1. Set proper HTTP security headers:
   ```
   X-Frame-Options: DENY
   X-Content-Type-Options: nosniff
   X-XSS-Protection: 1; mode=block
   Strict-Transport-Security: max-age=31536000; includeSubDomains
   ```

2. Implement CSP reporting for policy violations
3. Add HSTS with preload directive

## CSP Policy Breakdown

### Core Directives
- **default-src 'self'**: Only allow resources from same origin by default
- **script-src**: Allow scripts from self and trusted CDNs (jsdelivr, unpkg)
- **style-src**: Allow styles from self and font/style CDNs  
- **img-src**: Allow images from self, data URIs, and Singapore government APIs
- **connect-src**: Allow API connections to Singapore government services
- **frame-src 'none'**: Block all iframe embedding
- **object-src 'none'**: Block plugins and embedded objects

### Security Features
- **upgrade-insecure-requests**: Automatically upgrade HTTP to HTTPS
- **base-uri 'self'**: Prevent base tag hijacking
- **form-action 'self'**: Restrict form submission targets

## Testing Security Headers

Use browser developer tools or online tools to verify security headers:

1. **Browser DevTools**:
   - Network tab → Response Headers
   - Console for CSP violations

2. **Online Tools**:
   - SecurityHeaders.com
   - Mozilla Observatory
   - CSP Evaluator

## Error Resolution

### Fixed Issues
1. **X-Frame-Options meta tag error**: Removed invalid meta tag usage
2. **Security header conflicts**: Clarified which headers can be set via meta tags
3. **CSP violations**: Configured comprehensive policy for all required resources

### Current Status
- ✅ No invalid security meta tags
- ✅ Proper CSP implementation
- ✅ GitHub Pages compatible configuration
- ✅ Documented platform limitations

## Monitoring

Monitor browser console for:
- CSP violation reports
- Mixed content warnings
- Security header warnings

Regular security audits should be performed using:
- Lighthouse Security audit
- Mozilla Observatory
- OWASP ZAP security scanner