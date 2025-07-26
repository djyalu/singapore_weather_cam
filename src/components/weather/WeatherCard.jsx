import PropTypes from 'prop-types';

const WeatherCard = ({ title, value, icon, description }) => {
  return (
    <div className="card hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-800">{value}</p>
          {description && (
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          )}
        </div>
        <div className="text-4xl ml-4">{icon}</div>
      </div>
    </div>
  );
};

WeatherCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.node.isRequired,
  description: PropTypes.string,
};

export default WeatherCard;