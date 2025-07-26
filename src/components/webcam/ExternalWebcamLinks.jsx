import { webcamSources } from '../../config/webcamSources';

const ExternalWebcamLinks = () => {
  return (
    <div className="card">
      <h3 className="text-xl font-semibold mb-4">외부 웹캠 링크</h3>

      {/* LTA Traffic Cameras */}
      <div className="mb-6">
        <h4 className="text-lg font-medium mb-3 text-blue-600">🚗 교통 카메라</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {webcamSources.lta.cameras.map((camera) => (
            <div key={camera.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <h5 className="font-medium mb-2">{camera.name}</h5>
              <p className="text-sm text-gray-600 mb-3">{camera.location}</p>
              <div className="aspect-video bg-gray-100 rounded overflow-hidden mb-2">
                <img
                  src={`${camera.imageUrl}?t=${Date.now()}`}
                  alt={camera.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = '/images/placeholder.jpg';
                  }}
                />
              </div>
              <p className="text-xs text-gray-500">실시간 교통 상황 (1분마다 업데이트)</p>
            </div>
          ))}
        </div>
      </div>

      {/* Government Resources */}
      <div className="mb-6">
        <h4 className="text-lg font-medium mb-3 text-green-600">🏛️ 정부 공식 사이트</h4>
        <div className="space-y-2">
          <a
            href="https://onemotoring.lta.gov.sg/content/onemotoring/home/driving/traffic_information/traffic-cameras.html"
            target="_blank"
            rel="noopener noreferrer"
            className="block p-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">OneMotoring (LTA)</p>
                <p className="text-sm text-gray-600">싱가포르 공식 교통 카메라</p>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </div>
          </a>
        </div>
      </div>

      {/* Alternative Sources */}
      <div>
        <h4 className="text-lg font-medium mb-3 text-purple-600">🌐 대체 웹캠 소스</h4>
        <div className="space-y-2">
          {webcamSources.alternatives.map((source, index) => (
            <a
              key={index}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{source.name}</p>
                  <p className="text-sm text-gray-600">{source.description}</p>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Notice */}
      <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
        <p className="text-sm text-yellow-800">
          💡 <strong>참고:</strong> 싱가포르에서는 보안상의 이유로 실시간 비디오 스트림 대신
          주기적으로 업데이트되는 정적 이미지를 제공합니다. 대부분의 교통 카메라는 30초~2분마다 업데이트됩니다.
        </p>
      </div>
    </div>
  );
};

export default ExternalWebcamLinks;