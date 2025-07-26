# Singapore Weather Cam - System Architecture

## Overview
Singapore Weather Cam integrates real-time weather data from NEA (National Environment Agency) with live camera feeds to provide visual weather information across Singapore.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
│  ┌─────────────┐ ┌──────────────┐ ┌────────────┐ ┌──────────┐ │
│  │  Weather    │ │   Camera     │ │  History   │ │  Admin   │ │
│  │  Dashboard  │ │   Viewer     │ │  Charts    │ │  Panel   │ │
│  └─────────────┘ └──────────────┘ └────────────┘ └──────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │   WebSocket/REST API  │
                    └───────────┬───────────┘
                                │
┌─────────────────────────────────────────────────────────────────┐
│                      Backend (Node.js)                          │
│  ┌─────────────┐ ┌──────────────┐ ┌────────────┐ ┌──────────┐ │
│  │   Weather   │ │   Camera     │ │   Cache    │ │  Queue   │ │
│  │   Service   │ │   Service    │ │  Manager   │ │  Worker  │ │
│  └─────────────┘ └──────────────┘ └────────────┘ └──────────┘ │
└─────────────────────────────────────────────────────────────────┘
         │                │                │               │
    ┌────┴────┐    ┌─────┴─────┐    ┌────┴────┐    ┌────┴────┐
    │  NEA    │    │  Camera   │    │  Redis  │    │  Bull   │
    │  API    │    │  Sources  │    │  Cache  │    │  Queue  │
    └─────────┘    └───────────┘    └─────────┘    └─────────┘
                                            │
                                    ┌───────┴────────┐
                                    │   PostgreSQL   │
                                    │   + TimescaleDB│
                                    └────────────────┘
```

## Core Components

### 1. Weather Service
- Fetches real-time weather data from NEA API
- Processes and normalizes weather information
- Implements retry logic and error handling
- Caches responses to minimize API calls

### 2. Camera Service
- Manages multiple camera feeds across Singapore
- Handles image capture and optimization
- Implements failover for unavailable cameras
- Stores snapshots with weather metadata

### 3. Data Pipeline
- Queue-based processing for reliability
- Scheduled data collection (every 5-10 minutes)
- Historical data aggregation
- Data retention policies

### 4. API Layer
- RESTful endpoints for data access
- WebSocket connections for real-time updates
- Authentication and rate limiting
- API versioning support

## Data Flow

1. **Weather Data Collection**
   ```
   NEA API → Weather Service → Validation → Cache → Database
   ```

2. **Camera Feed Processing**
   ```
   Camera Source → Image Capture → Optimization → Storage → CDN
   ```

3. **Client Updates**
   ```
   Database → API → WebSocket → React Client → UI Update
   ```

## Security Considerations

- API key rotation for external services
- Rate limiting on all endpoints
- Input validation and sanitization
- HTTPS enforcement
- CORS configuration
- Environment variable management

## Scalability Strategy

1. **Horizontal Scaling**
   - Stateless backend services
   - Load balancer ready
   - Shared Redis cache

2. **Performance Optimization**
   - Image CDN integration
   - Database indexing
   - Query optimization
   - Client-side caching

3. **Monitoring**
   - Application metrics
   - API response times
   - Error tracking
   - Resource utilization