const Header = () => {
  return (
    <header className="bg-singapore-red text-white shadow-lg">
      <div className="container-custom py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <span className="text-singapore-red text-xl">🌤️</span>
            </div>
            <h1 className="text-2xl font-bold">Singapore Weather Cam</h1>
          </div>
          
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#weather" className="hover:text-gray-200 transition-colors">Weather</a>
            <a href="#webcams" className="hover:text-gray-200 transition-colors">Webcams</a>
            <a href="#map" className="hover:text-gray-200 transition-colors">Map</a>
          </nav>

          <div className="flex items-center space-x-2 text-sm">
            <span className="hidden sm:inline">Last Updated:</span>
            <span className="font-mono">{new Date().toLocaleTimeString('en-SG')}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;