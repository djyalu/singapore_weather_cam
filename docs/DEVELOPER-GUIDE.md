# 🛠️ Developer Guide

Singapore Weather Cam 프로젝트의 개발자를 위한 종합 가이드입니다.

## 📋 **목차**

- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Component Development](#component-development)
- [API Integration](#api-integration)
- [Testing Guidelines](#testing-guidelines)
- [Performance Optimization](#performance-optimization)
- [Contributing Guidelines](#contributing-guidelines)

## 🚀 **Development Setup**

### **Prerequisites**
```bash
# Required
Node.js >= 18.x
npm >= 9.x
Git >= 2.x

# Recommended
VS Code + Extensions:
├── ES7+ React/Redux/React-Native snippets
├── Prettier - Code formatter
├── ESLint
├── Tailwind CSS IntelliSense
├── Auto Rename Tag
└── GitLens
```

### **Local Development Environment**
```bash
# 1. Clone Repository
git clone https://github.com/djyalu/singapore_weather_cam.git
cd singapore_weather_cam

# 2. Install Dependencies
npm install

# 3. Environment Setup (Optional)
cp .env.example .env.local
# Edit .env.local with your API keys

# 4. Start Development Server
npm run dev

# 5. Access Application
# http://localhost:5173
```

### **Development Scripts**
```bash
# Development
npm run dev              # Start dev server (HMR enabled)
npm run build            # Production build
npm run preview          # Preview production build

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run format           # Format with Prettier

# Data Collection (Testing)
npm run collect-weather  # Test weather collection
npm run capture-webcam   # Test webcam capture
npm run health-check     # Test system health
```

## 📁 **Project Structure**

### **Directory Overview**
```
singapore_weather_cam/
├── .github/workflows/           # GitHub Actions (5 workflows)
├── docs/                       # Documentation
├── src/                        # Source code
│   ├── components/            # React components (17 components)
│   │   ├── analysis/          # Weather analysis components
│   │   ├── common/            # Reusable UI components
│   │   ├── dashboard/         # System dashboard
│   │   ├── layout/            # Layout components
│   │   ├── map/               # Map components (Leaflet)
│   │   ├── weather/           # Weather display components
│   │   └── webcam/            # Webcam & traffic camera components
│   ├── config/               # Configuration files
│   ├── hooks/                # Custom React hooks
│   ├── services/             # API services & utilities
│   ├── utils/                # Helper functions
│   ├── App.jsx               # Main application component
│   └── main.jsx              # Application entry point
├── scripts/                   # Data collection scripts
├── data/                     # Generated data files
├── public/                   # Static assets
└── dist/                     # Build output (generated)
```

### **Component Architecture**
```
Component Hierarchy:
App.jsx
├── ErrorBoundary (HOC)
├── LiveHeader
│   └── SystemStats
├── MapView
│   ├── WeatherMarkers
│   └── CameraMarkers
├── WeatherAnalysisCard (Multiple instances)
├── WebcamGallery
│   ├── WebcamCard
│   └── WebcamModal
├── TrafficCameraGallery
│   ├── CameraFilters
│   └── CameraGrid
└── SystemFooter
```

## 📏 **Coding Standards**

### **JavaScript/React Standards**

#### **ES2021+ Features**
```javascript
// Use modern JavaScript features
const { weatherData, loading, error } = useDataLoader();

// Destructuring with defaults
const { temperature = 0, humidity = 0 } = weatherData?.current || {};

// Optional chaining & nullish coalescing
const displayTemp = weatherData?.temperature?.value ?? 'N/A';

// Dynamic imports
const HeavyComponent = lazy(() => import('./HeavyComponent'));
```

#### **React Best Practices**
```javascript
// Functional components with hooks
const WeatherCard = React.memo(({ data, isLoading }) => {
  // Custom hooks for logic separation
  const { formattedTemp, icon } = useWeatherDisplay(data);
  
  // Memoized expensive calculations
  const summary = useMemo(() => 
    generateWeatherSummary(data), [data]
  );
  
  // Callback memoization
  const handleRefresh = useCallback(() => {
    onRefresh(data.stationId);
  }, [onRefresh, data.stationId]);

  return (
    <div className="weather-card">
      {/* JSX content */}
    </div>
  );
});

// PropTypes for type checking
WeatherCard.propTypes = {
  data: PropTypes.shape({
    temperature: PropTypes.number,
    humidity: PropTypes.number,
    stationId: PropTypes.string.isRequired,
  }).isRequired,
  isLoading: PropTypes.bool,
  onRefresh: PropTypes.func.isRequired,
};
```

#### **Custom Hooks Pattern**
```javascript
// hooks/useDataLoader.js
export const useDataLoader = (refreshInterval = 5 * 60 * 1000) => {
  const [state, setState] = useState({
    weatherData: null,
    webcamData: null,
    isLoading: true,
    error: null,
  });

  const loadData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const [weather, webcam] = await Promise.all([
        fetchWeatherData(),
        fetchWebcamData(),
      ]);
      
      setState({
        weatherData: weather,
        webcamData: webcam,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message,
      }));
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, refreshInterval);
    return () => clearInterval(interval);
  }, [loadData, refreshInterval]);

  return { ...state, refresh: loadData };
};
```

### **CSS/Tailwind Standards**

#### **Responsive Design Patterns**
```javascript
// Mobile-first responsive classes
<div className="
  grid grid-cols-1      // Mobile: 1 column
  md:grid-cols-2        // Medium: 2 columns  
  lg:grid-cols-3        // Large: 3 columns
  gap-4 md:gap-6        // Responsive gaps
  p-4 md:p-6 lg:p-8     // Responsive padding
">
```

#### **Component Styling Convention**
```javascript
// Base styles + modifiers + responsive + state
const cardClasses = `
  // Base styles
  bg-white rounded-xl shadow-lg
  
  // Layout
  p-6 mb-4
  
  // Responsive
  w-full md:w-1/2 lg:w-1/3
  
  // Interactive states
  hover:shadow-xl hover:scale-105
  focus:outline-none focus:ring-2 focus:ring-blue-500
  
  // Conditional styles
  ${isLoading ? 'animate-pulse' : ''}
  ${hasError ? 'border-red-500 bg-red-50' : ''}
`;
```

#### **Custom Theme Integration**
```javascript
// tailwind.config.js integration
<div className="
  bg-singapore-red        // Custom Singapore red
  text-singapore-white    // Custom white
  border-weather-blue     // Weather theme blue
">
```

### **File Naming Conventions**
```
Naming Standards:
├── Components: PascalCase (WeatherCard.jsx)
├── Hooks: camelCase with 'use' prefix (useDataLoader.js)
├── Services: camelCase (weatherService.js)
├── Utilities: camelCase (formatters.js)
├── Constants: UPPER_SNAKE_CASE (API_ENDPOINTS.js)
├── Config: camelCase (webcamSources.js)
└── Tests: *.test.js or *.spec.js
```

## 🧩 **Component Development**

### **Component Creation Checklist**
```javascript
// 1. Component Template
import React, { memo } from 'react';
import PropTypes from 'prop-types';

const ComponentName = memo(({ prop1, prop2, onAction }) => {
  // Custom hooks
  // State management
  // Event handlers
  // Memoized values
  
  return (
    <div className="component-wrapper">
      {/* JSX structure */}
    </div>
  );
});

// 2. PropTypes
ComponentName.propTypes = {
  // Define all props with proper types
};

// 3. Default props (if needed)
ComponentName.defaultProps = {
  // Default values
};

// 4. Display name for debugging
ComponentName.displayName = 'ComponentName';

export default ComponentName;
```

### **Performance Optimization Patterns**

#### **React.memo Usage**
```javascript
// Memoize expensive components
const ExpensiveComponent = memo(({ data, config }) => {
  // Component logic
}, (prevProps, nextProps) => {
  // Custom comparison function (optional)
  return prevProps.data.id === nextProps.data.id;
});
```

#### **useMemo & useCallback**
```javascript
const OptimizedComponent = ({ items, onSelect }) => {
  // Memoize expensive calculations
  const sortedItems = useMemo(() => 
    items.sort((a, b) => a.priority - b.priority),
    [items]
  );
  
  // Memoize callbacks to prevent child re-renders
  const handleItemClick = useCallback((id) => {
    onSelect(id);
  }, [onSelect]);
  
  return (
    <div>
      {sortedItems.map(item => 
        <Item 
          key={item.id} 
          data={item} 
          onClick={handleItemClick}
        />
      )}
    </div>
  );
};
```

#### **Lazy Loading**
```javascript
// Code splitting with lazy loading
const LazyTrafficGallery = lazy(() => 
  import('./components/webcam/TrafficCameraGallery')
);

// Usage with Suspense
<Suspense fallback={<LoadingSpinner />}>
  <LazyTrafficGallery />
</Suspense>
```

### **Error Handling Patterns**

#### **Error Boundaries**
```javascript
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Send to error reporting service
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Something went wrong</h2>
          <details>
            {this.state.error?.message}
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}
```

#### **Async Error Handling**
```javascript
const useAsyncError = () => {
  const [error, setError] = useState(null);
  
  const catchError = useCallback((error) => {
    setError(error);
    console.error('Async error:', error);
  }, []);

  return { error, catchError, clearError: () => setError(null) };
};
```

## 🔌 **API Integration**

### **Service Layer Pattern**
```javascript
// services/apiClient.js
class ApiClient {
  constructor(baseURL, options = {}) {
    this.baseURL = baseURL;
    this.options = {
      timeout: 10000,
      retries: 3,
      ...options,
    };
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...this.options,
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...this.options.headers,
        ...options.headers,
      },
    };

    return this.executeWithRetry(() => fetch(url, config));
  }

  async executeWithRetry(operation) {
    let lastError;
    
    for (let i = 0; i < this.options.retries; i++) {
      try {
        const response = await operation();
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
      } catch (error) {
        lastError = error;
        if (i < this.options.retries - 1) {
          await this.delay(Math.pow(2, i) * 1000); // Exponential backoff
        }
      }
    }
    
    throw lastError;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### **Specific API Services**
```javascript
// services/weatherService.js
import { ApiClient } from './apiClient';

const neaClient = new ApiClient('https://api.data.gov.sg/v1/environment/');

export const weatherService = {
  async getTemperature() {
    return neaClient.request('/air-temperature');
  },

  async getHumidity() {
    return neaClient.request('/relative-humidity');
  },

  async getRainfall() {
    return neaClient.request('/rainfall');
  },

  async getForecast() {
    return neaClient.request('/24-hour-weather-forecast');
  },

  async getAggregatedData() {
    const [temp, humidity, rainfall, forecast] = await Promise.allSettled([
      this.getTemperature(),
      this.getHumidity(),
      this.getRainfall(),
      this.getForecast(),
    ]);

    return {
      temperature: temp.status === 'fulfilled' ? temp.value : null,
      humidity: humidity.status === 'fulfilled' ? humidity.value : null,
      rainfall: rainfall.status === 'fulfilled' ? rainfall.value : null,
      forecast: forecast.status === 'fulfilled' ? forecast.value : null,
      timestamp: new Date().toISOString(),
    };
  },
};
```

### **Circuit Breaker Pattern**
```javascript
// utils/circuitBreaker.js
class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.resetTimer = null;
  }

  async execute(operation) {
    if (this.state === 'OPEN') {
      throw new Error('Circuit breaker is OPEN');
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
    }
  }

  onFailure() {
    this.failureCount++;
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      this.resetTimer = setTimeout(() => {
        this.state = 'HALF_OPEN';
      }, this.resetTimeout);
    }
  }
}
```

## 🧪 **Testing Guidelines**

### **Testing Stack**
```bash
# Testing dependencies
npm install --save-dev
├── @testing-library/react      # React component testing
├── @testing-library/jest-dom   # Custom Jest matchers
├── @testing-library/user-event # User interaction simulation
├── msw                         # API mocking
├── vitest                      # Test runner (Vite compatible)
└── @vitest/ui                  # Test UI
```

### **Component Testing**
```javascript
// __tests__/WeatherCard.test.jsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WeatherCard } from '../components/weather/WeatherCard';

describe('WeatherCard', () => {
  const mockData = {
    temperature: 28.5,
    humidity: 75,
    location: 'Bukit Timah',
    timestamp: '2024-01-01T12:00:00Z',
  };

  it('displays weather data correctly', () => {
    render(<WeatherCard data={mockData} />);
    
    expect(screen.getByText('28.5°C')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('Bukit Timah')).toBeInTheDocument();
  });

  it('handles loading state', () => {
    render(<WeatherCard data={null} isLoading={true} />);
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('handles refresh action', async () => {
    const mockRefresh = jest.fn();
    const user = userEvent.setup();
    
    render(<WeatherCard data={mockData} onRefresh={mockRefresh} />);
    
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    await user.click(refreshButton);
    
    expect(mockRefresh).toHaveBeenCalledWith(mockData.stationId);
  });
});
```

### **Service Testing**
```javascript
// __tests__/weatherService.test.js
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { weatherService } from '../services/weatherService';

const server = setupServer(
  rest.get('https://api.data.gov.sg/v1/environment/air-temperature', (req, res, ctx) => {
    return res(ctx.json({
      items: [{
        timestamp: '2024-01-01T12:00:00+08:00',
        readings: [{ station_id: 'S121', value: 28.5 }]
      }]
    }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('weatherService', () => {
  it('fetches temperature data successfully', async () => {
    const data = await weatherService.getTemperature();
    
    expect(data.items).toHaveLength(1);
    expect(data.items[0].readings[0].value).toBe(28.5);
  });

  it('handles API errors gracefully', async () => {
    server.use(
      rest.get('*/air-temperature', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    await expect(weatherService.getTemperature()).rejects.toThrow();
  });
});
```

### **Integration Testing**
```javascript
// __tests__/integration/DataFlow.test.jsx
import { render, screen, waitFor } from '@testing-library/react';
import { App } from '../App';
import { mockWeatherAPI, mockWebcamAPI } from '../__mocks__/api';

describe('Data Flow Integration', () => {
  beforeEach(() => {
    mockWeatherAPI();
    mockWebcamAPI();
  });

  it('loads and displays data from APIs', async () => {
    render(<App />);
    
    // Initial loading state
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('28.5°C')).toBeInTheDocument();
    });
    
    // Verify all sections are rendered
    expect(screen.getByText(/real-time map/i)).toBeInTheDocument();
    expect(screen.getByText(/weather analysis/i)).toBeInTheDocument();
    expect(screen.getByText(/live webcams/i)).toBeInTheDocument();
  });
});
```

## ⚡ **Performance Optimization**

### **Bundle Analysis**
```bash
# Analyze bundle size
npm run build
npx vite-bundle-analyzer dist/

# Performance audit
npm install -g lighthouse
lighthouse http://localhost:5173 --output html --output-path ./lighthouse-report.html
```

### **Code Splitting Strategies**
```javascript
// Route-based splitting
const TrafficGallery = lazy(() => 
  import('./components/webcam/TrafficCameraGallery')
);

// Feature-based splitting
const AdvancedAnalysis = lazy(() => 
  import('./components/analysis/AdvancedAnalysis')
);

// Third-party library splitting
const ChartComponent = lazy(() => 
  import('./components/charts/ChartComponent')
);
```

### **Image Optimization**
```javascript
// Progressive image loading
const OptimizedImage = ({ src, alt, ...props }) => {
  const [loaded, setLoaded] = useState(false);
  
  return (
    <div className="relative">
      {!loaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        className={`transition-opacity ${loaded ? 'opacity-100' : 'opacity-0'}`}
        {...props}
      />
    </div>
  );
};
```

### **Memory Management**
```javascript
// Cleanup patterns
useEffect(() => {
  const cleanup = setupSubscription();
  return cleanup; // Always cleanup
}, []);

// Abort controllers for fetch requests
useEffect(() => {
  const controller = new AbortController();
  
  fetchData({ signal: controller.signal })
    .then(setData)
    .catch(error => {
      if (error.name !== 'AbortError') {
        setError(error);
      }
    });
  
  return () => controller.abort();
}, []);
```

## 🤝 **Contributing Guidelines**

### **Git Workflow**
```bash
# 1. Create feature branch
git checkout -b feature/new-weather-widget

# 2. Make changes with conventional commits
git add .
git commit -m "feat(weather): add new weather widget component"

# 3. Keep branch updated
git fetch origin
git rebase origin/main

# 4. Push and create PR
git push origin feature/new-weather-widget
```

### **Commit Message Convention**
```
Type(scope): Description

Types:
├── feat: New feature
├── fix: Bug fix
├── docs: Documentation
├── style: Code formatting
├── refactor: Code refactoring
├── test: Tests
├── chore: Build/config changes
├── perf: Performance improvements
└── ci: CI/CD changes

Examples:
feat(weather): add real-time temperature alerts
fix(api): handle timeout errors in weather service
docs(readme): update installation instructions
```

### **Pull Request Template**
```markdown
## 🎯 Purpose
Brief description of what this PR accomplishes.

## 🔄 Changes
- List of specific changes made
- New features added
- Bugs fixed

## 🧪 Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Performance impact assessed

## 📸 Screenshots
(If applicable)

## 🔗 Related Issues
Closes #123
References #456
```

### **Code Review Checklist**
```markdown
Reviewer Checklist:
├── [ ] Code follows project standards
├── [ ] Components are properly memoized
├── [ ] PropTypes are defined
├── [ ] Error handling is implemented
├── [ ] Performance considerations addressed
├── [ ] Tests are comprehensive
├── [ ] Documentation is updated
└── [ ] No console.log statements left
```

## 🔧 **Development Tools**

### **VS Code Configuration**
```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "emmet.includeLanguages": {
    "javascript": "javascriptreact"
  },
  "tailwindCSS.includeLanguages": {
    "javascript": "javascript",
    "html": "HTML"
  }
}
```

### **Debugging Setup**
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug React App",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceFolder}",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"]
    }
  ]
}
```

### **Useful Extensions**
```
Recommended VS Code Extensions:
├── ES7+ React/Redux/React-Native snippets
├── Prettier - Code formatter
├── ESLint
├── Tailwind CSS IntelliSense
├── Auto Rename Tag
├── Bracket Pair Colorizer
├── GitLens
├── Thunder Client (API testing)
└── Error Lens
```

---

**🤖 Generated with [Claude Code](https://claude.ai/code)**

**Co-Authored-By: Claude <noreply@anthropic.com>**