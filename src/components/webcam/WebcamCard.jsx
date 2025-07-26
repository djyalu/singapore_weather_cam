const WebcamCard = ({ webcam, onClick }) => {
  const { id, name, location, imageUrl, analysis, lastUpdated } = webcam;

  return (
    <div 
      className="card cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
      onClick={onClick}
    >
      <div className="relative">
        <img
          src={imageUrl || '/images/placeholder.jpg'}
          alt={`${name} webcam view`}
          className="w-full h-48 object-cover rounded-md mb-4"
          loading="lazy"
        />
        <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
          {new Date(lastUpdated).toLocaleTimeString('en-SG')}
        </div>
      </div>
      
      <h3 className="text-lg font-semibold mb-2">{name}</h3>
      <p className="text-sm text-gray-600 mb-3">{location}</p>
      
      {analysis && (
        <div className="border-t pt-3">
          <p className="text-sm text-gray-700">
            <span className="font-medium">AI Analysis:</span> {analysis.description}
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {analysis.tags?.map((tag, index) => (
              <span 
                key={index}
                className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WebcamCard;