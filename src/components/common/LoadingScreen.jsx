const LoadingScreen = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block w-16 h-16 border-4 border-singapore-red border-t-transparent rounded-full animate-spin mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-700">Loading Singapore Weather Data...</h2>
        <p className="text-gray-500 mt-2">Please wait while we fetch the latest information</p>
      </div>
    </div>
  );
};

export default LoadingScreen;