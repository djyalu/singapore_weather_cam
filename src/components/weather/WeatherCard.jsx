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
      'relative overflow-hidden backdrop-blur-lg transition-all duration-500 hover:scale-110 transform group hover:shadow-2xl border-2 hover:border-purple-400/50',
      getStatusColor(),
    )}>
      {/* 차분한 그라데이션 배경 */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/15 via-indigo-500/10 to-purple-600/15"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-slate-400/5 via-blue-400/8 to-indigo-400/8"></div>

      {/* 부드러운 호버 효과 */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-400/15 via-indigo-400/15 to-purple-400/15 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      {/* 상단 액센트 라인 */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 opacity-0 group-hover:opacity-60 transition-opacity duration-500"></div>

      <CardContent className="relative z-10 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider drop-shadow-sm">{title}</p>
              {trend && (
                <span className={cn(
                  'inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-sm backdrop-blur-sm border',
                  trend === 'up' && 'bg-destructive/10 text-destructive border-destructive/20',
                  trend === 'down' && 'bg-primary/10 text-primary border-primary/20',
                  trend === 'stable' && 'bg-muted text-muted-foreground border-border',
                )}>
                  {trend === 'up' ? '↗️' : trend === 'down' ? '↘️' : '→'}
                </span>
              )}
            </div>

            <p className="text-4xl font-black text-transparent bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 bg-clip-text mb-2 group-hover:from-blue-500 group-hover:via-indigo-400 group-hover:to-purple-500 transition-all duration-500 drop-shadow-xl">
              {value}
            </p>

            {description && (
              <p className="text-sm text-muted-foreground leading-relaxed font-medium">{description}</p>
            )}
          </div>

          <div className="ml-6 relative">
            <div className="text-5xl transform group-hover:scale-125 group-hover:rotate-6 transition-all duration-500 drop-shadow-xl filter group-hover:drop-shadow-[0_0_15px_rgba(79,70,229,0.6)]">
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

        {/* 차분한 하단 액센트 */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 rounded-full"></div>

        {/* 부드러운 코너 효과 */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-400/15 via-purple-400/8 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
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