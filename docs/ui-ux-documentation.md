# Singapore Weather Cam - UI/UX Documentation

## Table of Contents

1. [Design System](#design-system)
2. [Component Library](#component-library)
3. [User Experience Guidelines](#user-experience-guidelines)
4. [Accessibility Documentation](#accessibility-documentation)
5. [Responsive Design](#responsive-design)
6. [Internationalization & Localization](#internationalization--localization)
7. [Performance & Optimization](#performance--optimization)

---

## Design System

### Color Palette

Our design system is built around Singapore's national colors with enhanced weather-themed palettes for optimal user experience and cultural relevance.

#### Primary Colors
```css
/* Singapore Identity Colors */
--singapore-red: #DC0032;     /* Primary brand color */
--singapore-white: #FFFFFF;   /* Clean, pure background */
--weather-blue: #0EA5E9;      /* Weather data emphasis */
--weather-gray: #64748B;      /* Secondary text */
--weather-dark: #1E293B;      /* Primary text */
```

#### Extended Palette
```css
/* Primary Scale */
primary-50:  #fef2f2  /* Light backgrounds, alerts */
primary-100: #fee2e2  /* Subtle highlights */
primary-500: #DC0032  /* Main brand actions */
primary-600: #dc2626  /* Hover states */
primary-700: #b91c1c  /* Active states */
primary-900: #7f1d1d  /* Text emphasis */

/* Secondary (Weather Blue) Scale */
secondary-50:  #f0f9ff  /* Light backgrounds */
secondary-100: #e0f2fe  /* Card backgrounds */
secondary-500: #0EA5E9  /* Data visualization */
secondary-600: #0284c7  /* Interactive elements */
secondary-700: #0369a1  /* Active states */
secondary-900: #0c4a6e  /* Text emphasis */

/* Accent (Success/Nature) Scale */
accent-50:  #f7fee7   /* Success backgrounds */
accent-100: #ecfccb   /* Positive indicators */
accent-500: #65a30d   /* Success states */
accent-600: #16a34a   /* Confirmation actions */
accent-700: #15803d   /* Active success */

/* Neutral Grayscale */
neutral-50:  #f8fafc  /* Page backgrounds */
neutral-100: #f1f5f9  /* Card backgrounds */
neutral-200: #e2e8f0  /* Borders, dividers */
neutral-300: #cbd5e1  /* Input borders */
neutral-400: #94a3b8  /* Placeholder text */
neutral-500: #64748b  /* Secondary text */
neutral-600: #475569  /* Primary text */
neutral-700: #334155  /* Headings */
neutral-800: #1e293b  /* Strong emphasis */
neutral-900: #0f172a  /* Maximum contrast */
```

#### Semantic Colors
```css
/* Status Colors */
--success: #22c55e    /* Successful operations */
--warning: #f59e0b    /* Warning states */
--error: #ef4444      /* Error states */
--info: #3b82f6       /* Information */

/* Weather Status Colors */
--weather-excellent: #22c55e  /* Clear, optimal conditions */
--weather-good: #84cc16       /* Good weather */
--weather-moderate: #f59e0b   /* Moderate conditions */
--weather-poor: #ef4444       /* Poor weather conditions */
```

### Typography System

#### Font Families
```css
/* Primary Font Stack */
font-sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif']
font-display: ['Inter', 'system-ui', 'sans-serif']
font-mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'monospace']
```

#### Font Sizes & Line Heights
```css
/* Mobile-First Typography Scale */
text-xs:   [12px, 16px]  /* Small labels, captions */
text-sm:   [14px, 20px]  /* Secondary text */
text-base: [16px, 24px]  /* Body text (mobile optimized) */
text-lg:   [18px, 28px]  /* Large body text */
text-xl:   [20px, 28px]  /* Small headings */
text-2xl:  [24px, 32px]  /* Section headings */
text-3xl:  [30px, 36px]  /* Page headings */
text-4xl:  [36px, 40px]  /* Hero headings */
text-5xl:  [48px, 1]     /* Large displays */
text-6xl:  [60px, 1]     /* Hero displays */
```

#### Font Weights
```css
font-normal:   400  /* Body text */
font-medium:   500  /* Emphasis */
font-semibold: 600  /* Headings */
font-bold:     700  /* Strong emphasis */
```

### Spacing System

Our spacing system follows a consistent 8px base unit with semantic naming for predictable layouts.

```css
/* Spacing Scale (8px base unit) */
--space-xs:  4px   /* Tight spacing */
--space-sm:  8px   /* Small gaps */
--space-md:  16px  /* Standard spacing */
--space-lg:  24px  /* Generous spacing */
--space-xl:  32px  /* Large spacing */
--space-2xl: 48px  /* Section separation */
--space-3xl: 64px  /* Major separation */
--space-4xl: 96px  /* Page-level spacing */
```

### Elevation & Shadows

```css
/* Shadow System */
shadow-sm:  0 1px 2px rgba(0, 0, 0, 0.05)         /* Subtle elevation */
shadow-md:  0 4px 6px rgba(0, 0, 0, 0.07)         /* Card elevation */
shadow-lg:  0 10px 15px rgba(0, 0, 0, 0.1)        /* Modal elevation */
shadow-xl:  0 20px 25px rgba(0, 0, 0, 0.1)        /* High elevation */

/* Interactive Shadows */
shadow-hover: 0 10px 25px rgba(0, 0, 0, 0.1)      /* Hover states */
shadow-focus: 0 0 0 3px rgba(59, 130, 246, 0.5)   /* Focus states */
```

### Border Radius System

```css
/* Border Radius Scale */
rounded-sm:  2px   /* Small elements */
rounded-md:  6px   /* Standard components */
rounded-lg:  8px   /* Cards, buttons */
rounded-xl:  12px  /* Large components */
rounded-2xl: 16px  /* Hero elements */
rounded-full: 50%  /* Circular elements */
```

---

## Component Library

### Core Components

#### Button Component

**Usage**: Primary interactive elements with consistent styling and behavior.

```jsx
import { Button } from '../components/common/DesignSystem';

// Basic usage
<Button variant="primary" size="md">
  Click me
</Button>

// With loading state
<Button variant="primary" loading={true}>
  Processing...
</Button>

// Full width
<Button variant="secondary" fullWidth={true}>
  Full Width Button
</Button>
```

**Variants**:
- `primary`: Main call-to-action buttons
- `secondary`: Secondary actions
- `outline`: Low-emphasis actions
- `ghost`: Minimal styling
- `success`: Positive confirmations
- `warning`: Caution actions
- `error`: Destructive actions

**Sizes**:
- `sm`: 36px height (compact interfaces)
- `md`: 44px height (standard)
- `lg`: 48px height (prominent actions)
- `xl`: 56px height (hero actions)
- `icon`: 44x44px (icon-only buttons)

**Accessibility Features**:
- Keyboard navigation support
- Focus indicators with 3px outline
- Touch-friendly minimum 44px targets
- Loading state announcements
- Disabled state handling

#### Card Component

**Usage**: Content containers with consistent elevation and spacing.

```jsx
import { Card } from '../components/common/DesignSystem';

// Basic card
<Card variant="default" padding="md">
  <h3>Card Title</h3>
  <p>Card content goes here.</p>
</Card>

// Interactive card
<Card variant="elevated" interactive={true} onClick={handleClick}>
  <h3>Clickable Card</h3>
</Card>
```

**Variants**:
- `default`: Standard card with subtle shadow
- `elevated`: Enhanced shadow for prominence
- `outlined`: Border-only styling
- `ghost`: Minimal styling

**Interactive Features**:
- Hover animations (scale and shadow)
- Touch feedback for mobile
- Keyboard navigation support
- Active state animations

#### Input Component

**Usage**: Form inputs with validation and accessibility support.

```jsx
import { Input } from '../components/common/DesignSystem';

// Basic input
<Input 
  placeholder="Enter text"
  variant="default"
  size="md"
/>

// Error state
<Input 
  placeholder="Email"
  variant="error"
  aria-describedby="email-error"
/>

// Success state
<Input 
  placeholder="Username"
  variant="success"
/>
```

**Features**:
- Mobile-optimized font size (16px prevents zoom)
- Validation state styling
- Accessibility attributes
- Touch-friendly sizing

#### Badge Component

**Usage**: Status indicators and labels.

```jsx
import { Badge } from '../components/common/DesignSystem';

<Badge variant="success">Online</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="error">Offline</Badge>
```

**Variants**:
- `default`: Neutral gray
- `primary`: Brand blue
- `success`: Green success
- `warning`: Yellow warning
- `error`: Red error
- `outline`: Bordered style

### Weather-Specific Components

#### WeatherCard Component

**Purpose**: Display weather metrics with visual hierarchy and status indicators.

```jsx
import WeatherCard from '../components/weather/WeatherCard';

<WeatherCard
  title="Temperature"
  value="28.5°C"
  icon="🌡️"
  description="Feels like 31°C"
  trend="up"
  status="normal"
/>
```

**Features**:
- Animated hover effects
- Status-based color coding
- Trend indicators with arrows
- Visual hierarchy with typography
- Background gradient effects

**Status Types**:
- `normal`: Default white background
- `warning`: Amber left border and background
- `danger`: Red left border and background
- `good`: Green left border and background

#### WebcamCard Component

**Purpose**: Display live webcam feeds with real-time updates and error handling.

```jsx
import WebcamCard from '../components/webcam/WebcamCard';

<WebcamCard
  webcam={{
    name: "Bukit Timah",
    location: "Nature Reserve",
    file_info: { url: "...", size: 125000 },
    capture_time: "2024-01-15T10:30:00Z",
    type: "traffic"
  }}
  onClick={handleCardClick}
/>
```

**Features**:
- Automatic 30-second refresh
- Progressive retry logic (3 attempts)
- Loading and error states
- Real-time indicators
- Image optimization
- Touch-friendly interaction

### Layout Components

#### Container Component

**Usage**: Consistent page-level and section-level containers.

```jsx
import { Container } from '../components/common/DesignSystem';

<Container size="default">
  Page content
</Container>
```

**Sizes**:
- `sm`: max-width: 768px
- `default`: max-width: 1280px
- `lg`: max-width: 1536px
- `full`: 100% width

#### Grid Component

**Usage**: Responsive grid layouts.

```jsx
import { Grid } from '../components/common/DesignSystem';

<Grid cols={3} gap="md">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</Grid>
```

**Responsive Behavior**:
- `cols={1}`: 1 column on all screens
- `cols={2}`: 1 col mobile, 2 cols tablet+
- `cols={3}`: 1 col mobile, 2 cols tablet, 3 cols desktop
- `cols={4}`: 1 col mobile, 2 cols tablet, 4 cols desktop

#### Stack & Flex Components

**Usage**: Flexible layout components for spacing and alignment.

```jsx
import { Stack, Flex } from '../components/common/DesignSystem';

// Vertical stacking
<Stack space="md" align="center">
  <h2>Title</h2>
  <p>Description</p>
  <Button>Action</Button>
</Stack>

// Horizontal layout
<Flex justify="between" align="center">
  <h2>Title</h2>
  <Button>Action</Button>
</Flex>
```

---

## User Experience Guidelines

### User Journey Mapping

#### Primary User Journey: Weather Monitoring

1. **Entry** → User arrives at application
   - **Goal**: Get current weather information
   - **Actions**: View dashboard overview
   - **Pain Points**: Loading times, data freshness

2. **Discovery** → Explore detailed information
   - **Goal**: Understand weather patterns
   - **Actions**: Navigate between sections
   - **Success Metrics**: Time to find information

3. **Monitoring** → Track live conditions
   - **Goal**: Monitor real-time changes
   - **Actions**: Refresh data, view webcams
   - **Retention**: Auto-refresh, notifications

#### Secondary User Journey: Visual Verification

1. **Need** → Verify weather conditions visually
2. **Access** → Navigate to webcam section
3. **Selection** → Choose relevant camera location
4. **Viewing** → Full-screen webcam modal
5. **Decision** → Make informed decisions based on visual data

### Interaction Patterns

#### Progressive Disclosure

**Implementation**: Information hierarchy that reveals details on demand.

- **Level 1**: Overview cards with key metrics
- **Level 2**: Detailed station information
- **Level 3**: Historical data and trends
- **Level 4**: Raw data and technical details

```jsx
// Example: Weather Card → Detail Modal → Historical View
<WeatherCard onClick={openDetailModal} />
<Modal>
  <DetailedWeatherView />
  <Button onClick={openHistoricalView}>View History</Button>
</Modal>
```

#### Touch Gestures & Mobile Interactions

**Supported Gestures**:
- **Tap**: Primary selection action
- **Long press**: Context menus (planned)
- **Swipe**: Navigation between sections (planned)
- **Pinch-to-zoom**: Map interaction
- **Pull-to-refresh**: Data updates

**Touch Target Specifications**:
- Minimum 44x44px for all interactive elements
- 8px minimum spacing between touch targets
- Enhanced touch areas for small icons
- Visual feedback for all touch interactions

#### Micro-Animations

**Purpose**: Provide feedback and guide user attention.

**Animation Specifications**:
- **Duration**: 200-300ms for UI transitions
- **Easing**: `cubic-bezier(0.4, 0, 0.2, 1)` for natural motion
- **Reduced Motion**: Respects `prefers-reduced-motion` setting

**Examples**:
```css
/* Button press feedback */
.button-press:active {
  transform: translateY(1px) scale(0.98);
  transition: transform 0.1s ease;
}

/* Card hover effect */
.card-interactive:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Loading spinner */
.animate-spin {
  animation: spin 1s linear infinite;
}
```

### Error Handling & Feedback

#### Error States

**Progressive Error Handling**:
1. **Graceful Degradation**: Show cached data when fresh data unavailable
2. **Clear Communication**: Explain what went wrong and why
3. **Actionable Solutions**: Provide retry options and alternatives
4. **Visual Indicators**: Use color and icons for quick recognition

**Error Message Patterns**:
```jsx
// Network Error
<Alert variant="error">
  <AlertIcon>⚠️</AlertIcon>
  <AlertTitle>Connection Failed</AlertTitle>
  <AlertDescription>
    Unable to fetch latest weather data. 
    Showing last known information from 5 minutes ago.
  </AlertDescription>
  <Button variant="outline" onClick={retry}>Try Again</Button>
</Alert>

// No Data Available
<EmptyState>
  <EmptyIcon>📡</EmptyIcon>
  <EmptyTitle>No webcam data available</EmptyTitle>
  <EmptyDescription>
    The camera may be temporarily offline. 
    Please check back in a few minutes.
  </EmptyDescription>
</EmptyState>
```

#### Loading States

**Loading Hierarchy**:
1. **Immediate**: Skeleton screens for instant feedback
2. **Progressive**: Load critical content first
3. **Background**: Update non-critical data silently
4. **Lazy**: Load images and heavy content on demand

**Loading Patterns**:
```jsx
// Skeleton Loading
<div className="space-y-4">
  <Skeleton className="h-8 w-3/4" />
  <Skeleton className="h-4 w-1/2" />
  <Skeleton className="h-32 w-full" />
</div>

// Spinner with Context
<div className="flex items-center space-x-2">
  <LoadingSpinner size="sm" />
  <span>Updating weather data...</span>
</div>
```

---

## Accessibility Documentation

### WCAG 2.1 AA Compliance

Our application meets WCAG 2.1 AA standards across all components and interactions.

#### Keyboard Navigation

**Tab Order**: Logical, predictable navigation sequence
- Header navigation → Main content → Footer
- Within sections: Top to bottom, left to right
- Modal dialogs: Trapped focus within modal

**Keyboard Shortcuts**:
- `Tab`: Navigate forward
- `Shift + Tab`: Navigate backward
- `Enter`: Activate buttons and links
- `Space`: Activate buttons, toggle controls
- `Escape`: Close modals and dropdowns

**Focus Management**:
```css
/* Enhanced focus indicators */
*:focus-visible {
  outline: 3px solid #3b82f6;
  outline-offset: 2px;
  border-radius: 4px;
}

/* Skip link for screen readers */
.skip-link {
  position: absolute;
  top: 16px;
  left: 16px;
  background: #3b82f6;
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  text-decoration: none;
  transform: translateY(-100%);
  transition: transform 0.2s ease;
}

.skip-link:focus {
  transform: translateY(0);
}
```

#### Screen Reader Support

**ARIA Implementation**:
- **Landmarks**: Proper section labeling
- **Live Regions**: Dynamic content announcements
- **Labels**: Descriptive labels for all inputs
- **Descriptions**: Additional context for complex elements

**Screen Reader Patterns**:
```jsx
// Weather Card with ARIA
<div 
  role="article"
  aria-labelledby="temp-title"
  aria-describedby="temp-desc"
>
  <h3 id="temp-title">Temperature</h3>
  <div aria-live="polite" aria-atomic="true">
    <span className="sr-only">Current temperature:</span>
    28.5°C
  </div>
  <p id="temp-desc">Feels like 31 degrees Celsius</p>
</div>

// Loading state announcement
<div aria-live="polite" aria-busy="true">
  <span className="sr-only">Loading weather data</span>
  <LoadingSpinner />
</div>
```

#### Color Contrast

**Contrast Ratios**:
- **Normal text**: 4.5:1 minimum
- **Large text**: 3:1 minimum
- **UI components**: 3:1 minimum

**High Contrast Mode Support**:
```css
@media (prefers-contrast: high) {
  .text-gray-600 { color: #000000 !important; }
  .text-gray-700 { color: #000000 !important; }
  .text-gray-500 { color: #333333 !important; }
  .border-gray-200 { border-color: #000000 !important; }
}
```

#### Motion & Animation Accessibility

**Reduced Motion Support**:
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### Alternative Content

**Image Accessibility**:
- Descriptive alt text for all images
- Empty alt for decorative images
- Loading states communicated to screen readers

```jsx
// Webcam image with accessibility
<img
  src={imageUrl}
  alt={`Live view from ${webcam.name} camera at ${webcam.location}`}
  loading="lazy"
  onLoad={() => announceToScreenReader('Image loaded')}
  onError={() => announceToScreenReader('Image failed to load')}
/>

// Decorative emoji
<span aria-hidden="true">🌡️</span>
<span className="sr-only">Temperature</span>
```

---

## Responsive Design

### Breakpoint System

**Mobile-First Approach**: Design for smallest screen first, enhance for larger screens.

```css
/* Breakpoint Values */
xs:  475px   /* Large phones */
sm:  640px   /* Tablets portrait */
md:  768px   /* Tablets landscape */
lg:  1024px  /* Desktop */
xl:  1280px  /* Large desktop */
2xl: 1536px  /* Extra large desktop */
```

### Component Responsive Behavior

#### Grid Layouts

```jsx
// Responsive grid classes
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {items.map(item => <Card key={item.id}>{item}</Card>)}
</div>
```

#### Typography Scaling

```css
/* Responsive text sizes */
.heading-responsive {
  @apply text-2xl sm:text-3xl lg:text-4xl xl:text-5xl;
}

.body-responsive {
  @apply text-sm sm:text-base lg:text-lg;
}
```

#### Navigation Patterns

**Desktop**: Horizontal navigation bar
**Tablet**: Collapsible navigation
**Mobile**: Bottom tab navigation

```jsx
// Responsive navigation
<nav className="hidden md:flex space-x-6">
  {/* Desktop navigation */}
</nav>

<nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t">
  {/* Mobile bottom navigation */}
</nav>
```

### Touch Optimizations

**Touch Target Sizing**:
```css
@media (hover: none) and (pointer: coarse) {
  button,
  [role="button"],
  a {
    min-height: 44px;
    min-width: 44px;
    padding: 12px;
  }
}
```

**Touch Gesture Support**:
- **Tap**: Primary interaction
- **Touch feedback**: Visual response to touch
- **Swipe navigation**: Horizontal navigation (planned)

### Performance Optimizations

**Image Handling**:
- Responsive images with `srcset`
- Lazy loading for non-critical images
- WebP format with fallbacks
- Progressive JPEG for large images

```jsx
// Responsive image example
<img
  src="/images/webcam-480.webp"
  srcSet="/images/webcam-480.webp 480w, 
          /images/webcam-800.webp 800w,
          /images/webcam-1200.webp 1200w"
  sizes="(max-width: 640px) 480px,
         (max-width: 1024px) 800px,
         1200px"
  alt="Webcam view"
  loading="lazy"
/>
```

---

## Internationalization & Localization

### Current Implementation

**Primary Language**: Korean (ko-KR)
**Secondary Language**: English (en-SG) - Singapore English

**Example Text Patterns**:
```jsx
// Korean primary, English secondary
<h1>🌤️ Singapore Weather Cam</h1>
<p>실시간 날씨 정보 시스템 • Real-time Weather Information System</p>

// UI Elements
<button>🔄 새로고침</button> {/* Refresh */}
<span>마지막 업데이트: {lastUpdate}</span> {/* Last update */}
```

### Localization Guidelines

#### Text Content Structure

**Hierarchical Text Structure**:
1. **Primary**: Korean text for local users
2. **Secondary**: English subtitle for international users
3. **Technical**: English for technical terms and data labels

**Cultural Adaptations**:
- **Date/Time**: Local Singapore timezone (SGT)
- **Temperature**: Celsius (°C) standard
- **Distance**: Metric system (km, m)
- **Language mixing**: Natural Korean-English mixing for technical terms

#### Content Organization

**Information Architecture**:
```jsx
// Bilingual headers
<header>
  <h1>싱가포르 날씨 카메라</h1>
  <h2>Singapore Weather Camera System</h2>
</header>

// Technical data in English
<div className="weather-data">
  <span>Temperature: 28.5°C</span>
  <span>Humidity: 75%</span>
  <span>Wind Speed: 8.3km/h</span>
</div>

// Status messages in Korean
<div className="status-messages">
  <span>정상 작동</span> {/* Normal operation */}
  <span>데이터 업데이트 중</span> {/* Updating data */}
</div>
```

### Future Localization Support

**Planned Language Support**:
- English (en-SG): Singapore English
- Mandarin (zh-CN): Simplified Chinese
- Malay (ms-MY): Malaysian/Singaporean Malay
- Tamil (ta-SG): Singapore Tamil

**Implementation Strategy**:
```jsx
// Future i18n structure
const translations = {
  'ko-KR': {
    'weather.temperature': '기온',
    'weather.humidity': '습도',
    'actions.refresh': '새로고침'
  },
  'en-SG': {
    'weather.temperature': 'Temperature',
    'weather.humidity': 'Humidity',
    'actions.refresh': 'Refresh'
  }
};

// Usage with translation hook
const t = useTranslation();
<button>{t('actions.refresh')}</button>
```

### Right-to-Left (RTL) Considerations

**Current Status**: Not implemented (not required for target languages)

**Future RTL Support Structure**:
```css
/* RTL-ready CSS structure */
.container {
  /* Use logical properties */
  margin-inline-start: 16px;
  margin-inline-end: 24px;
  
  /* Instead of */
  /* margin-left: 16px; margin-right: 24px; */
}

[dir="rtl"] .icon-arrow {
  transform: scaleX(-1);
}
```

---

## Performance & Optimization

### Loading Strategy

**Critical Resource Priority**:
1. **Above-fold content**: Weather overview cards
2. **Navigation**: Tab navigation and header
3. **Core functionality**: Data refresh capabilities
4. **Enhanced features**: Webcam images, animations
5. **Non-critical**: Footer, analytics

**Implementation**:
```jsx
// Lazy loading for webcam gallery
const WebcamGallery = lazy(() => import('./WebcamGallery'));

// Preload critical data
<link rel="preload" href="/api/weather/current" as="fetch" />

// Defer non-critical resources
<script src="/analytics.js" defer />
```

### Image Optimization

**Strategy**:
- WebP format with JPEG fallback
- Responsive images with `srcset`
- Lazy loading for below-fold images
- Optimized file sizes (target: <100KB per image)

**Caching Strategy**:
```javascript
// Service worker caching for images
const CACHE_NAME = 'weather-cam-v1';
const CACHED_RESOURCES = [
  '/images/placeholder.jpg',
  '/api/weather/current',
  '/assets/main.css'
];
```

### Accessibility Performance

**Fast Load Times**:
- Target: <3 seconds on 3G networks
- Critical rendering path optimization
- Progressive enhancement

**Screen Reader Performance**:
- Minimal DOM manipulation
- Efficient ARIA live region updates
- Debounced announcements

### Mobile Optimization

**Touch Performance**:
- Hardware acceleration for animations
- Passive event listeners
- Optimized touch target sizes

```css
/* Performance optimizations */
.card-interactive {
  will-change: transform;
  transform: translateZ(0); /* Hardware acceleration */
}

.animate-fade-in {
  will-change: opacity;
}
```

**Memory Management**:
- Image cleanup on component unmount
- Event listener cleanup
- Efficient re-rendering with React.memo

```jsx
// Optimized component with cleanup
const WebcamCard = React.memo(({ webcam, onClick }) => {
  useEffect(() => {
    return () => {
      // Cleanup image resources
      URL.revokeObjectURL(imageUrl);
    };
  }, []);
  
  return <div>...</div>;
});
```

---

## Implementation Examples

### Complete Weather Card Implementation

```jsx
import React from 'react';
import { Card, Badge, Text, Heading } from '../components/common/DesignSystem';

const WeatherStationCard = ({ station, isPrimary = false }) => {
  return (
    <Card 
      variant={isPrimary ? "elevated" : "default"}
      interactive={true}
      className={isPrimary ? "ring-2 ring-blue-500" : ""}
      onClick={() => handleStationClick(station.id)}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <Heading as="h3" size="lg" className="mb-1">
            {station.name}
          </Heading>
          <Text size="sm" color="gray-600" className="mb-2">
            📍 {station.area} • {station.id}
          </Text>
          {isPrimary && (
            <Badge variant="primary" size="sm">
              PRIMARY STATION
            </Badge>
          )}
        </div>
        
        <div className="text-right">
          <Text size="3xl" weight="bold" color="blue-600">
            {station.temperature}°C
          </Text>
          <Badge variant={getStatusVariant(station.status)}>
            {station.status}
          </Badge>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <Text size="sm" color="gray-500">습도 • Humidity</Text>
          <Text weight="semibold">{station.humidity}%</Text>
        </div>
        <div>
          <Text size="sm" color="gray-500">강수량 • Rainfall</Text>
          <Text weight="semibold">{station.rainfall}mm</Text>
        </div>
        <div>
          <Text size="sm" color="gray-500">풍속 • Wind Speed</Text>
          <Text weight="semibold">{station.windSpeed}km/h</Text>
        </div>
        <div>
          <Text size="sm" color="gray-500">업데이트 • Updated</Text>
          <Text weight="semibold" size="xs">
            {formatTime(station.lastUpdate)}
          </Text>
        </div>
      </div>
    </Card>
  );
};

export default WeatherStationCard;
```

This comprehensive UI/UX documentation provides a complete reference for maintaining consistent, accessible, and user-friendly interfaces across the Singapore Weather Cam application. The documentation emphasizes mobile-first design, cultural sensitivity, and accessibility compliance while maintaining high performance standards.