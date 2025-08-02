import PropTypes from 'prop-types';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

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
    <Card className={cn(
      "relative overflow-hidden backdrop-blur-lg transition-all duration-500 hover:scale-110 transform group hover:shadow-2xl border-2 hover:border-purple-400/50",
      getStatusColor()
    )}>
      {/* 강화된 그라데이션 배경 */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-pink-500/15 to-blue-600/20"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-cyan-400/10 via-purple-400/10 to-pink-400/10"></div>
      
      {/* 애니메이션 글로우 효과 강화 */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 via-pink-400/20 to-cyan-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700 animate-pulse"></div>
      
      {/* 상단 네온 라인 */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      <CardContent className="relative z-10 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider drop-shadow-sm">{title}</p>
              {trend && (
                <span className={cn(
                  "inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-sm backdrop-blur-sm border",
                  trend === 'up' && "bg-destructive/10 text-destructive border-destructive/20",
                  trend === 'down' && "bg-primary/10 text-primary border-primary/20",
                  trend === 'stable' && "bg-muted text-muted-foreground border-border"
                )}>
                  {trend === 'up' ? '↗️' : trend === 'down' ? '↘️' : '→'}
                </span>
              )}
            </div>

            <p className="text-5xl font-black text-transparent bg-gradient-to-r from-purple-600 via-pink-500 to-cyan-500 bg-clip-text mb-2 group-hover:from-cyan-400 group-hover:via-purple-400 group-hover:to-pink-400 transition-all duration-500 drop-shadow-2xl">
              {value}
            </p>

            {description && (
              <p className="text-sm text-muted-foreground leading-relaxed font-medium">{description}</p>
            )}
          </div>

          <div className="ml-6 relative">
            <div className="text-6xl transform group-hover:scale-150 group-hover:rotate-12 transition-all duration-700 drop-shadow-2xl filter group-hover:drop-shadow-[0_0_20px_rgba(168,85,247,0.8)]">
              {icon}
            </div>
            {status !== 'normal' && (
              <div className={`absolute -top-2 -right-2 w-4 h-4 rounded-full shadow-lg ${
                status === 'warning' ? 'bg-amber-400 border-2 border-amber-200' :
                  status === 'danger' ? 'bg-red-400 border-2 border-red-200' :
                    'bg-green-400 border-2 border-green-200'
              } animate-pulse`}>
                <div className={`absolute inset-0 rounded-full ${
                  status === 'warning' ? 'bg-amber-400' :
                    status === 'danger' ? 'bg-red-400' :
                      'bg-green-400'
                } animate-ping`}></div>
              </div>
            )}
          </div>
        </div>

        {/* 강화된 하단 네온 액센트 */}
        <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700 rounded-full shadow-lg"></div>
        
        {/* 코너 글로우 효과 */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-400/20 via-pink-400/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        {/* 추가 네온 효과 */}
        <div className="absolute inset-0 border-2 border-transparent group-hover:border-gradient-to-r group-hover:from-cyan-400/50 group-hover:via-purple-400/50 group-hover:to-pink-400/50 rounded-lg transition-all duration-500"></div>
      </CardContent>
    </Card>
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