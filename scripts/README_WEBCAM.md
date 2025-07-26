# Singapore Weather Cam - Webcam Capture Script

## Overview

The `capture-webcam.js` script captures real-time images from Singapore's traffic cameras and public webcams, with optional AI-powered image analysis using Claude API.

## Features

- ✅ **Real-time Traffic Cameras**: Direct integration with Singapore's LTA (Land Transport Authority) API
- ✅ **AI Image Analysis**: Optional Claude API integration for weather and scene analysis
- ✅ **Comprehensive Error Handling**: Retry logic with exponential backoff
- ✅ **Structured Metadata**: JSON metadata generation with coordinates and analysis
- ✅ **Batch Processing**: Rate-limited batch processing to avoid API limits
- ✅ **Automatic Cleanup**: Configurable cleanup of old image files
- ✅ **Browser Fallback**: Optional Puppeteer integration for complex webcam sources

## Successfully Captured Sources

### Traffic Cameras (LTA API)
- **Marina Bay**: Real-time traffic and city skyline
- **Orchard Road**: Shopping district traffic monitoring
- **Sentosa Gateway**: Island access traffic
- **Changi Airport**: Airport vicinity traffic
- **Tuas Checkpoint**: Border checkpoint traffic

All traffic cameras use live data from Singapore's official LTA API with 1-5 minute update frequency.

## Usage

### Basic Usage
```bash
# Run with browser capture disabled (recommended)
DISABLE_BROWSER_CAPTURE=true node scripts/capture-webcam.js

# Run with all features enabled
node scripts/capture-webcam.js
```

### With AI Analysis
```bash
# Enable Claude AI image analysis
CLAUDE_API_KEY=your-api-key node scripts/capture-webcam.js
```

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `CLAUDE_API_KEY` | Enable AI image analysis | No | Not set |
| `DISABLE_BROWSER_CAPTURE` | Disable Puppeteer browser capture | No | `false` |
| `OPENWEATHER_API_KEY` | Future weather correlation | No | Not set |

## Output Structure

### Images
```
public/images/webcam/
├── marina_bay_traffic_20250726_1526.jpg
├── orchard_road_traffic_20250726_1526.jpg
├── sentosa_traffic_20250726_1526.jpg
└── ...
```

### Metadata
```
data/webcam/
├── latest.json                    # Latest capture results
├── 2025/07/26/
│   ├── 15-26.json                # Hourly capture data
│   └── summary.json              # Daily summary
```

## Example Output

### Successful Run
```
=== Capture Summary ===
Total cameras: 9
Successful captures: 5
Failed captures: 4
Skipped captures: 0
Success rate: 55.6%

Successful captures:
✓ marina_bay_traffic: 258987 bytes 
✓ orchard_road_traffic: 173615 bytes 
✓ sentosa_traffic: 189469 bytes 
✓ changi_airport_traffic: 131080 bytes 
✓ tuas_checkpoint_traffic: 147844 bytes 
```

### JSON Metadata Example
```json
{
  "timestamp": "2025-07-26T06:26:27.651Z",
  "total_cameras": 9,
  "successful_captures": 5,
  "failed_captures": 4,
  "captures": [
    {
      "id": "marina_bay_traffic",
      "name": "Marina Bay Traffic Camera",
      "location": "Marina Bay",
      "coordinates": { "lat": 1.2777, "lng": 103.8515 },
      "type": "traffic",
      "status": "success",
      "file_info": {
        "path": "images/webcam/marina_bay_traffic_20250726_1526.jpg",
        "size": 258987,
        "source_url": "https://images.data.gov.sg/api/traffic-images/..."
      },
      "ai_analysis": {
        "analysis_available": false,
        "reason": "API key not configured"
      }
    }
  ]
}
```

## Integration with GitHub Actions

The script is designed to run automatically via GitHub Actions:

```yaml
- name: Capture Webcam Images
  run: |
    DISABLE_BROWSER_CAPTURE=true npm run capture-webcam
  env:
    CLAUDE_API_KEY: ${{ secrets.CLAUDE_API_KEY }}
```

## Troubleshooting

### Common Issues

1. **Browser Dependencies Missing**
   - Set `DISABLE_BROWSER_CAPTURE=true` to use direct download only
   - Install system dependencies: `apt-get install libnss3 libatk-bridge2.0-0`

2. **API Rate Limiting**
   - Script includes automatic batch processing with delays
   - LTA API is generally unrestricted for reasonable usage

3. **Storage Space**
   - Images are automatically cleaned after 7 days
   - Average image size: 130-260KB per capture

### Performance Optimization

- **Production**: Always use `DISABLE_BROWSER_CAPTURE=true`
- **Batch Size**: Script processes 2 cameras concurrently with 3-second delays
- **Retry Logic**: 3 attempts with exponential backoff for failed downloads

## Technical Details

- **Image Format**: JPEG with 85% quality for browser captures
- **File Naming**: `{camera_id}_{YYYYMMDD}_{HHMM}.jpg`
- **Error Handling**: Comprehensive logging with structured error messages
- **Memory Usage**: Minimal memory footprint with streaming downloads
- **Dependencies**: Puppeteer (optional), Anthropic SDK (optional)

## Future Enhancements

- [ ] Thumbnail generation for faster loading
- [ ] WebP format support for better compression
- [ ] Real-time weather correlation with capture analysis
- [ ] Additional public webcam sources
- [ ] Image quality assessment and optimization