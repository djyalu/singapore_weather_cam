# Singapore Weather Cam - UI Design System Guide

This comprehensive guide covers the complete design system implementation for the Singapore Weather Cam application, providing detailed specifications for maintaining consistent, accessible, and user-friendly interfaces.

## Table of Contents

1. [Design System Components](#design-system-components)
2. [Weather-Specific Components](#weather-specific-components)
3. [Layout & Structure](#layout--structure)
4. [Accessibility Implementation](#accessibility-implementation)
5. [Responsive Design Patterns](#responsive-design-patterns)
6. [Cultural & Localization Guidelines](#cultural--localization-guidelines)

---

## Design System Components

### Button Component

**Import**: `import { Button } from '../components/common/DesignSystem'`

#### API Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'outline' \| 'ghost' \| 'success' \| 'warning' \| 'error'` | `'primary'` | Visual style variant |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl' \| 'icon'` | `'md'` | Button size |
| `fullWidth` | `boolean` | `false` | Expand to full container width |
| `loading` | `boolean` | `false` | Show loading spinner |
| `disabled` | `boolean` | `false` | Disable interaction |
| `className` | `string` | `''` | Additional CSS classes |
| `children` | `ReactNode` | - | Button content |
| `onClick` | `(event: MouseEvent) => void` | - | Click handler |

#### Usage Examples

```jsx
// Primary action button
<Button variant="primary" size="lg" onClick={handleSubmit}>
  Submit Form
</Button>

// Loading state with Korean/English bilingual content
<Button variant="primary" loading={isSubmitting}>
  {isSubmitting ? '제출 중... • Submitting...' : '제출 • Submit'}
</Button>

// Icon button with accessibility
<Button variant="ghost" size="icon" aria-label="모달 닫기 • Close modal">
  ✕
</Button>

// Weather-specific action button
<Button variant="secondary" fullWidth>
  🔄 새로고침 • Refresh Data
</Button>
```

#### Accessibility Features

- **Keyboard Navigation**: Full Enter/Space key support
- **Screen Reader**: Loading state announcements in both languages
- **Focus Management**: 3px blue outline with 2px offset
- **Touch Targets**: Minimum 44x44px on mobile devices
- **Motion Accessibility**: Respects `prefers-reduced-motion`

---

### Card Component

**Import**: `import { Card } from '../components/common/DesignSystem'`

#### API Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'elevated' \| 'outlined' \| 'ghost'` | `'default'` | Visual style variant |
| `padding` | `'none' \| 'sm' \| 'md' \| 'lg'` | `'md'` | Internal padding |
| `interactive` | `boolean` | `false` | Enable hover/click animations |
| `className` | `string` | `''` | Additional CSS classes |
| `children` | `ReactNode` | - | Card content |
| `onClick` | `(event: MouseEvent) => void` | - | Click handler (if interactive) |

#### Usage Examples

```jsx
// Weather station card with cultural context
<Card variant="elevated" interactive className="ring-2 ring-blue-500">
  <div className="flex justify-between items-start mb-4">
    <div>
      <h3 className="font-bold text-lg">Bukit Timah Nature Reserve</h3>
      <p className="text-sm text-gray-600">
        부킷 티마 자연보호구역 • Primary Weather Station
      </p>
    </div>
    <Badge variant="primary" size="sm">PRIMARY</Badge>
  </div>
  <div className="grid grid-cols-2 gap-4">
    <div>
      <Text size="sm" color="gray-500">기온 • Temperature</Text>
      <Text size="xl" weight="bold">28.5°C</Text>
    </div>
    <div>
      <Text size="sm" color="gray-500">습도 • Humidity</Text>
      <Text size="xl" weight="bold">75%</Text>
    </div>
  </div>
</Card>

// Webcam card with loading states
<Card variant="default" interactive onClick={handleWebcamClick}>
  <div className="relative">
    <img 
      src={webcamImageUrl} 
      alt={`${webcam.name} 웹캠 뷰 • webcam view`}
      className="w-full h-48 object-cover rounded-md mb-4"
      loading="lazy"
    />
    <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
      {formatTime(webcam.capture_time)}
    </div>
    <div className="absolute bottom-2 right-2 bg-green-600/80 text-white px-2 py-1 rounded text-xs">
      🔴 LIVE
    </div>
  </div>
  <h3 className="text-lg font-semibold mb-2">{webcam.name}</h3>
  <p className="text-sm text-gray-600">{webcam.location}</p>
</Card>
```

#### Interactive Behaviors

- **Hover Animation**: `translateY(-2px)` with enhanced shadow
- **Touch Feedback**: Ripple effect for mobile devices
- **Focus States**: Keyboard-accessible outline
- **Loading States**: Skeleton placeholder support

---

### Input Component

**Import**: `import { Input } from '../components/common/DesignSystem'`

#### API Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'error' \| 'success'` | `'default'` | Validation state |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Input size |
| `type` | `string` | `'text'` | HTML input type |
| `placeholder` | `string` | `''` | Placeholder text |
| `disabled` | `boolean` | `false` | Disable input |
| `className` | `string` | `''` | Additional CSS classes |
| `value` | `string` | - | Controlled value |
| `onChange` | `(event: ChangeEvent) => void` | - | Change handler |

#### Usage Examples

```jsx
// Search input with bilingual placeholder
<Input 
  placeholder="지역 검색... • Search locations..."
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  aria-label="날씨 지역 검색 • Weather location search"
/>

// Validation states with cultural messaging
<Input 
  type="email"
  variant={emailError ? 'error' : 'default'}
  placeholder="이메일 주소 • Email address"
  value={email}
  onChange={handleEmailChange}
  aria-describedby={emailError ? 'email-error' : undefined}
  aria-invalid={emailError ? 'true' : 'false'}
/>
{emailError && (
  <p id="email-error" className="text-red-600 text-sm mt-1" role="alert">
    {emailError.ko} • {emailError.en}
  </p>
)}
```

#### Mobile Optimizations

- **Font Size**: 16px to prevent iOS zoom
- **Touch Targets**: Enhanced tap areas
- **Keyboard Support**: Proper input modes
- **Validation**: Real-time feedback

---

## Weather-Specific Components

### WeatherCard Component

**File**: `src/components/weather/WeatherCard.jsx`

#### API Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | - | **Required.** Metric name (bilingual) |
| `value` | `string \| number` | - | **Required.** Metric value |
| `icon` | `ReactNode` | - | **Required.** Weather icon |
| `description` | `string` | - | Additional description |
| `trend` | `'up' \| 'down' \| 'stable'` | - | Trend indicator |
| `status` | `'normal' \| 'warning' \| 'danger' \| 'good'` | `'normal'` | Status indicator |

#### Implementation Example

```jsx
const WeatherCard = ({ title, value, icon, description, trend, status = 'normal' }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'warning': return 'border-l-4 border-amber-400 bg-amber-50';
      case 'danger': return 'border-l-4 border-red-400 bg-red-50';
      case 'good': return 'border-l-4 border-green-400 bg-green-50';
      default: return 'border-l-4 border-transparent bg-white';
    }
  };

  return (
    <div className={`card hover:shadow-xl transition-all duration-300 group relative overflow-hidden ${getStatusColor()}`}>
      {/* Background Gradient Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-transparent to-neutral-50 opacity-50"></div>

      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-sm font-medium text-neutral-600 uppercase tracking-wide">{title}</p>
              {trend && (
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  trend === 'up' ? 'bg-red-100 text-red-700' :
                    trend === 'down' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                }`}>
                  {trend === 'up' ? '↗️' : trend === 'down' ? '↘️' : '→'}
                </span>
              )}
            </div>

            <p className="text-3xl font-bold text-neutral-800 mb-1 group-hover:text-primary-600 transition-colors">
              {value}
            </p>

            {description && (
              <p className="text-sm text-neutral-500 leading-relaxed">{description}</p>
            )}
          </div>

          <div className="ml-4 relative">
            <div className="text-4xl transform group-hover:scale-110 transition-transform duration-300">
              {icon}
            </div>
            {status !== 'normal' && (
              <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
                status === 'warning' ? 'bg-amber-400' :
                  status === 'danger' ? 'bg-red-400' :
                    'bg-green-400'
              } animate-pulse`}></div>
            )}
          </div>
        </div>

        {/* Enhanced Visual Elements */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-secondary-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
      </div>
    </div>
  );
};
```

#### Usage Examples

```jsx
// Temperature card with Korean/English
<WeatherCard
  title="기온 • Temperature"
  value="28.5°C"
  icon="🌡️"
  description="체감온도 31°C • Feels like 31°C"
  trend="up"
  status="normal"
/>

// Humidity with warning status
<WeatherCard
  title="습도 • Humidity"
  value="85%"
  icon="💧"
  description="높은 습도 수준 • High humidity level"
  status="warning"
  trend="up"
/>

// Rainfall indicator
<WeatherCard
  title="강수량 • Rainfall"
  value="2.5mm"
  icon="🌧️"
  description="지난 1시간 • Past 1 hour"
  status="good"
  trend="stable"
/>
```

### WebcamCard Component

**File**: `src/components/webcam/WebcamCard.jsx`

#### API Reference

| Prop | Type | Description |
|------|------|-------------|
| `webcam` | `WebcamData` | **Required.** Webcam data object |
| `onClick` | `(webcam: WebcamData) => void` | **Required.** Click handler |

#### WebcamData Interface

```typescript
interface WebcamData {
  name: string;                    // Camera name (bilingual)
  location: string;                // Camera location
  file_info?: {
    source_url?: string;           // Primary image URL
    url?: string;                  // Alternative image URL
    path?: string;                 // Local file path
    size?: number;                 // File size in bytes
  };
  ai_analysis?: {
    analysis_available: boolean;   // Whether AI analysis is available
    analysis?: string;             // AI analysis text (bilingual)
    reason?: string;               // Reason if analysis unavailable
  };
  capture_time: string;            // ISO timestamp
  type: string;                    // Camera type
}
```

#### Implementation Features

```jsx
const WebcamCard = ({ webcam, onClick }) => {
  const { name, location, file_info, ai_analysis, capture_time, type } = webcam;
  const [imageKey, setImageKey] = React.useState(Date.now());
  const [imageLoading, setImageLoading] = React.useState(true);
  const [imageError, setImageError] = React.useState(false);
  const [retryCount, setRetryCount] = React.useState(0);

  // Auto-refresh every 30 seconds for real-time updates
  React.useEffect(() => {
    const interval = setInterval(() => {
      setImageKey(Date.now());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Intelligent retry logic with progressive delay
  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
    if (retryCount < 3) {
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setImageKey(Date.now());
      }, 1000 + retryCount * 1000);
    }
  };

  return (
    <div className="card cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="relative">
        {/* Loading State */}
        {imageLoading && (
          <div className="w-full h-48 bg-gray-200 rounded-md mb-4 flex items-center justify-center">
            <div className="text-gray-500 text-sm">로딩 중... • Loading...</div>
          </div>
        )}

        {/* Error State with Cultural Context */}
        {imageError && retryCount >= 3 && (
          <div className="w-full h-48 bg-gray-100 border-2 border-dashed border-gray-300 rounded-md mb-4 flex flex-col items-center justify-center">
            <div className="text-gray-400 text-2xl mb-2">📷</div>
            <div className="text-gray-500 text-sm text-center">
              이미지를 불러올 수 없습니다
              <br />
              Image unavailable
              <br />
              <span className="text-xs">네트워크를 확인해주세요 • Check network connection</span>
            </div>
          </div>
        )}

        {/* Actual Image with Cache Busting */}
        <img
          key={imageKey}
          src={`${imageUrl}${imageUrl.includes('?') ? '&' : '?'}t=${imageKey}`}
          alt={`${name} 웹캠 뷰 • webcam view`}
          className={`w-full h-48 object-cover rounded-md mb-4 transition-opacity duration-300 ${
            imageLoading || imageError ? 'hidden' : 'block'
          }`}
          loading="lazy"
          onLoad={() => {
            setImageLoading(false);
            setImageError(false);
          }}
          onError={handleImageError}
        />

        {/* Real-time Overlay Information */}
        {!imageLoading && !imageError && (
          <>
            <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
              {new Date(capture_time).toLocaleTimeString('en-SG')}
            </div>
            <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs capitalize">
              {type}
            </div>
            <div className="absolute bottom-2 right-2 bg-green-600/80 text-white px-2 py-1 rounded text-xs">
              🔴 LIVE (30초 새로고침 • 30s refresh)
            </div>
          </>
        )}
      </div>

      <h3 className="text-lg font-semibold mb-2">{name}</h3>
      <p className="text-sm text-gray-600 mb-2">{location}</p>

      {/* AI Analysis Section with Bilingual Support */}
      {ai_analysis && ai_analysis.analysis_available && (
        <div className="border-t pt-3">
          <p className="text-sm text-gray-700">
            <span className="font-medium">AI 분석 • AI Analysis:</span> {ai_analysis.analysis}
          </p>
        </div>
      )}
    </div>
  );
};
```

---

## Layout & Structure

### Container System

```jsx
// Page-level container with cultural spacing
<Container size="default" className="safe-area-inset">
  <main role="main" aria-label="메인 콘텐츠 • Main content">
    <h1 className="text-3xl font-bold text-gray-800 mb-6">
      🌤️ Singapore Weather Cam
    </h1>
    <p className="text-gray-600 mb-8">
      실시간 날씨 정보 시스템 • Real-time Weather Information System
    </p>
  </main>
</Container>
```

### Grid Layouts with Cultural Considerations

```jsx
// Responsive weather station grid
<Grid cols={4} gap="lg" className="mb-8">
  {weatherStations.map((station, index) => (
    <WeatherCard 
      key={station.id} 
      {...station}
      className={station.isPrimary ? "ring-2 ring-blue-500" : ""}
    />
  ))}
</Grid>

// Webcam gallery with adaptive columns
<Grid 
  cols={3} 
  gap="md" 
  className="camera-grid-mobile" // Custom mobile breakpoints
>
  {webcams.map(webcam => (
    <WebcamCard 
      key={webcam.id} 
      webcam={webcam} 
      onClick={handleWebcamClick} 
    />
  ))}
</Grid>
```

### Stack Components for Vertical Layouts

```jsx
// Information hierarchy with bilingual content
<Stack space="lg" align="center" className="text-center">
  <Heading as="h2" size="3xl" className="text-balance">
    부킷 티마 자연보호구역
  </Heading>
  <Text size="lg" color="gray-600" className="text-balance">
    Bukit Timah Nature Reserve Weather Monitoring
  </Text>
  <Text size="base" color="gray-500" className="max-w-2xl">
    싱가포르의 최고점에서 실시간 날씨 데이터를 모니터링합니다.
    Monitor real-time weather data from Singapore's highest point.
  </Text>
  <Button variant="primary" size="lg">
    실시간 데이터 보기 • View Live Data
  </Button>
</Stack>
```

---

## Accessibility Implementation

### Screen Reader Support

```jsx
// Comprehensive ARIA implementation
<main role="main" aria-label="날씨 대시보드 • Weather dashboard">
  <section aria-labelledby="current-weather" className="mb-8">
    <h2 id="current-weather" className="sr-only">
      현재 날씨 정보 • Current weather information
    </h2>
    
    <div aria-live="polite" aria-atomic="true">
      <span className="sr-only">
        현재 기온: {temperature}도 • Current temperature: {temperature} degrees
      </span>
      <WeatherCard
        title="기온 • Temperature"
        value={`${temperature}°C`}
        icon="🌡️"
        aria-describedby="temp-description"
      />
      <div id="temp-description" className="sr-only">
        체감온도 {feelsLike}도입니다 • Feels like {feelsLike} degrees
      </div>
    </div>
  </section>
</main>

// Skip link for keyboard navigation
<a href="#main-content" className="skip-link">
  메인 콘텐츠로 건너뛰기 • Skip to main content
</a>
```

### Keyboard Navigation

```jsx
// Enhanced focus management
const FocusableWeatherCard = ({ station, onSelect }) => {
  const cardRef = useRef(null);
  
  const handleKeyDown = (event) => {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        onSelect(station);
        break;
      case 'ArrowRight':
        // Move to next card
        focusNextCard();
        break;
      case 'ArrowLeft':
        // Move to previous card
        focusPreviousCard();
        break;
    }
  };

  return (
    <div
      ref={cardRef}
      tabIndex={0}
      role="button"
      aria-label={`${station.name} 날씨 정보 보기 • View weather for ${station.name}`}
      onKeyDown={handleKeyDown}
      onClick={() => onSelect(station)}
      className="card focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      {/* Card content */}
    </div>
  );
};
```

### High Contrast and Color Accessibility

```css
/* High contrast mode support */
@media (prefers-contrast: high) {
  .weather-card {
    border: 2px solid #000000;
    background: #ffffff;
  }
  
  .text-gray-600 { 
    color: #000000 !important; 
  }
  
  .weather-icon {
    filter: contrast(200%);
  }
}

/* Color-blind friendly weather status indicators */
.status-good {
  background: #22c55e; /* Green */
  background-image: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path fill='white' d='M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z'/></svg>");
}

.status-warning {
  background: #f59e0b; /* Orange */
  background-image: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path fill='white' d='M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z'/></svg>");
}

.status-danger {
  background: #ef4444; /* Red */
  background-image: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path fill='white' d='M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z'/></svg>");
}
```

---

## Responsive Design Patterns

### Mobile-First Implementation

```jsx
// Responsive weather dashboard
<div className="container-mobile safe-area-inset">
  {/* Mobile header with touch-friendly controls */}
  <header className="sticky top-0 bg-white shadow-sm z-30 safe-top">
    <div className="flex items-center justify-between p-4">
      <h1 className="text-xl font-bold text-blue-600">
        🌤️ SG Weather
      </h1>
      <button 
        className="tap-target p-2 -m-2"
        aria-label="새로고침 • Refresh"
        onClick={handleRefresh}
      >
        🔄
      </button>
    </div>
    
    {/* Mobile tab navigation */}
    <nav className="flex border-t border-gray-200" role="tablist">
      {tabs.map(tab => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          className={`flex-1 py-3 px-2 text-sm font-medium transition-colors touch-manipulation ${
            activeTab === tab.id 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-600'
          }`}
          onClick={() => setActiveTab(tab.id)}
        >
          <span className="block text-lg mb-1">{tab.icon}</span>
          <span className="block text-xs">{tab.name}</span>
        </button>
      ))}
    </nav>
  </header>

  {/* Mobile-optimized content areas */}
  <main className="pb-20 safe-bottom">
    {activeTab === 'dashboard' && (
      <div className="p-4 space-y-4">
        {/* Mobile weather cards - stacked on small screens */}
        <div className="grid-mobile gap-4">
          {weatherData.map(station => (
            <WeatherCard 
              key={station.id} 
              {...station}
              className="touch-manipulation"
            />
          ))}
        </div>
      </div>
    )}
    
    {activeTab === 'webcam' && (
      <div className="p-4">
        {/* Mobile webcam gallery with optimized touch targets */}
        <div className="camera-grid-mobile gap-3">
          {webcamData.map(webcam => (
            <WebcamCard
              key={webcam.id}
              webcam={webcam}
              onClick={handleWebcamClick}
              className="touch-feedback"
            />
          ))}
        </div>
      </div>
    )}
  </main>
</div>
```

### Touch-Friendly Interactions

```css
/* Enhanced touch targets and gestures */
.touch-target {
  min-height: 44px;
  min-width: 44px;
  padding: 12px;
  touch-action: manipulation;
}

.card-interactive {
  -webkit-tap-highlight-color: transparent;
  tap-highlight-color: transparent;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}

/* Swipe gesture indicators */
.swipe-container {
  position: relative;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
}

.swipe-item {
  scroll-snap-align: start;
  flex-shrink: 0;
}

/* Pull-to-refresh visual feedback */
.pull-to-refresh-container {
  transform: translateY(var(--pull-distance, 0px));
  transition: transform 0.2s ease-out;
}

.pull-to-refresh-indicator {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #10b981;
  font-size: 24px;
  transform: rotate(var(--pull-rotation, 0deg));
}
```

### Progressive Enhancement

```jsx
// Feature detection and progressive enhancement
const EnhancedWeatherApp = () => {
  const [features, setFeatures] = useState({
    touch: false,
    geolocation: false,
    notifications: false,
    serviceWorker: false
  });

  useEffect(() => {
    // Feature detection
    setFeatures({
      touch: 'ontouchstart' in window,
      geolocation: 'geolocation' in navigator,
      notifications: 'Notification' in window,
      serviceWorker: 'serviceWorker' in navigator
    });
  }, []);

  return (
    <div className={`app ${features.touch ? 'touch-enabled' : 'mouse-enabled'}`}>
      {/* Base functionality works everywhere */}
      <WeatherDashboard data={weatherData} />
      
      {/* Enhanced features when supported */}
      {features.geolocation && (
        <LocationButton onLocationDetected={handleLocationUpdate} />
      )}
      
      {features.notifications && (
        <NotificationToggle onToggle={handleNotificationToggle} />
      )}
      
      {features.serviceWorker && (
        <PWAPrompt onInstall={handlePWAInstall} />
      )}
    </div>
  );
};
```

---

## Cultural & Localization Guidelines

### Bilingual Content Strategy

```jsx
// Consistent bilingual patterns throughout the application
const BilingualText = ({ ko, en, className, ...props }) => (
  <span className={className} {...props}>
    <span lang="ko">{ko}</span>
    <span className="text-gray-500"> • </span>
    <span lang="en">{en}</span>
  </span>
);

// Usage in weather components
<BilingualText 
  ko="현재 날씨"
  en="Current Weather"
  className="text-2xl font-bold"
/>

// Status messages with cultural context
const getStatusMessage = (status) => {
  const messages = {
    online: { ko: "정상 작동", en: "Operating normally" },
    offline: { ko: "연결 끊김", en: "Connection lost" },
    maintenance: { ko: "점검 중", en: "Under maintenance" },
    loading: { ko: "데이터 로딩 중", en: "Loading data" }
  };
  return messages[status] || messages.offline;
};
```

### Singapore-Specific Adaptations

```jsx
// Singapore timezone and formatting
const formatSingaporeTime = (timestamp) => {
  return new Date(timestamp).toLocaleString('en-SG', {
    timeZone: 'Asia/Singapore',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

// Weather units and measurements (Singapore standards)
const formatWeatherValue = (value, unit) => {
  switch (unit) {
    case 'temperature':
      return `${value}°C`; // Celsius standard
    case 'humidity':
      return `${value}%`; // Percentage
    case 'rainfall':
      return `${value}mm`; // Millimeters
    case 'windSpeed':
      return `${value}km/h`; // Kilometers per hour
    case 'pressure':
      return `${value}hPa`; // Hectopascals
    default:
      return value;
  }
};

// Location-specific content
const LocationSpecificContent = ({ location }) => {
  const locationData = {
    'bukit-timah': {
      ko: '부킷 티마 자연보호구역',
      en: 'Bukit Timah Nature Reserve',
      description: {
        ko: '싱가포르의 최고점이자 주요 자연보호구역',
        en: "Singapore's highest point and primary nature reserve"
      },
      elevation: '164m above sea level'
    },
    'marina-bay': {
      ko: '마리나 베이',
      en: 'Marina Bay',
      description: {
        ko: '싱가포르 중심가의 상징적인 지역',
        en: 'Iconic downtown Singapore district'
      },
      elevation: 'Sea level'
    }
  };

  const data = locationData[location] || locationData['bukit-timah'];

  return (
    <div className="location-info">
      <h3 className="text-lg font-semibold">
        <BilingualText ko={data.ko} en={data.en} />
      </h3>
      <p className="text-sm text-gray-600">
        <BilingualText ko={data.description.ko} en={data.description.en} />
      </p>
      <p className="text-xs text-gray-500 mt-1">
        {data.elevation}
      </p>
    </div>
  );
};
```

### Cultural Color Preferences

```css
/* Singapore-inspired color palette */
:root {
  /* National colors with weather adaptations */
  --singapore-red: #DC0032;
  --singapore-white: #FFFFFF;
  
  /* Weather-specific colors adapted for tropical climate */
  --tropical-blue: #0EA5E9; /* Clear sky blue */
  --monsoon-gray: #64748B; /* Monsoon cloud gray */
  --humidity-green: #10B981; /* Tropical vegetation */
  --heat-orange: #F59E0B; /* Tropical sun */
  
  /* Cultural preferences for status colors */
  --status-good: #22C55E; /* Prosperity green */
  --status-caution: #F59E0B; /* Attention orange */
  --status-alert: #EF4444; /* Important red */
}

/* Culturally appropriate gradients */
.tropical-gradient {
  background: linear-gradient(135deg, 
    var(--tropical-blue) 0%, 
    var(--humidity-green) 100%);
}

.sunset-gradient {
  background: linear-gradient(135deg, 
    var(--heat-orange) 0%, 
    var(--singapore-red) 100%);
}
```

### Typography for Multilingual Content

```css
/* Optimized typography for Korean/English mixed content */
.bilingual-text {
  font-family: 'Inter', 'Noto Sans KR', 'Apple SD Gothic Neo', system-ui, sans-serif;
  line-height: 1.6;
  letter-spacing: -0.01em;
}

/* Language-specific optimizations */
[lang="ko"] {
  font-family: 'Noto Sans KR', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
  font-weight: 400;
  letter-spacing: 0;
}

[lang="en"] {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  font-weight: 400;
  letter-spacing: -0.01em;
}

/* Responsive text sizing for mixed content */
@media (max-width: 640px) {
  .bilingual-text {
    font-size: 14px;
    line-height: 1.5;
  }
  
  .bilingual-heading {
    font-size: 18px;
    line-height: 1.4;
  }
}

@media (min-width: 768px) {
  .bilingual-text {
    font-size: 16px;
    line-height: 1.6;
  }
  
  .bilingual-heading {
    font-size: 24px;
    line-height: 1.3;
  }
}
```

This comprehensive UI Design System Guide provides a complete reference for maintaining consistent, accessible, and culturally appropriate interfaces throughout the Singapore Weather Cam application. The guide emphasizes mobile-first design, bilingual content support, and Singapore-specific adaptations while maintaining high accessibility and usability standards.