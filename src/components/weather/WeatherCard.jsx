import PropTypes from 'prop-types';

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

WeatherCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.node.isRequired,
  description: PropTypes.string,
  trend: PropTypes.oneOf(['up', 'down', 'stable']),
  status: PropTypes.oneOf(['normal', 'warning', 'danger', 'good']),
};

export default WeatherCard;