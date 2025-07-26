import { useState, useEffect } from 'react';
import Header from './components/layout/Header';
import WeatherDashboard from './components/weather/WeatherDashboard';
import WebcamGallery from './components/webcam/WebcamGallery';
import MapView from './components/map/MapView';
import LoadingScreen from './components/common/LoadingScreen';
import ErrorBoundary from './components/common/ErrorBoundary';

function App() {
  const [loading, setLoading] = useState(true);
  const [weatherData, setWeatherData] = useState(null);
  const [webcamData, setWebcamData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch weather data (with base path for GitHub Pages)
        const basePath = import.meta.env.BASE_URL || '/';
        const weatherResponse = await fetch(`${basePath}data/weather/latest.json`);
        if (!weatherResponse.ok) {
          throw new Error(`Failed to fetch weather data: ${weatherResponse.status}`);
        }
        const weatherJson = await weatherResponse.json();
        setWeatherData(weatherJson);

        // Fetch webcam data
        const webcamResponse = await fetch(`${basePath}data/webcam/latest.json`);
        if (!webcamResponse.ok) {
          throw new Error(`Failed to fetch webcam data: ${webcamResponse.status}`);
        }
        const webcamJson = await webcamResponse.json();
        setWebcamData(webcamJson);

      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Refresh data every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Data</h1>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary mt-4"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <Header />

        <main className="container-custom py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Weather Dashboard */}
            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">Current Weather</h2>
              <WeatherDashboard data={weatherData} />
            </section>

            {/* Webcam Gallery */}
            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">Live Webcams</h2>
              <WebcamGallery data={webcamData} />
            </section>
          </div>

          {/* Map View */}
          <section className="mt-12 space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Weather Map</h2>
            <MapView weatherData={weatherData} webcamData={webcamData} />
          </section>
        </main>

        <footer className="bg-weather-dark text-white py-8 mt-16">
          <div className="container-custom text-center">
            <p className="text-sm">
              Singapore Weather Cam © {new Date().getFullYear()} |
              Data from Weather.gov.sg & Various Sources
            </p>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
}

export default App;