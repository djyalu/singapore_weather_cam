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
      "relative overflow-hidden backdrop-blur-sm transition-all duration-300 hover:scale-105 transform group hover:shadow-2xl",
      getStatusColor()
    )}>
      {/* Enhanced glassmorphism background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background/60 via-background/40 to-background/20"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-background/10 to-background/20"></div>
      
      {/* Animated background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

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

            <p className="text-4xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors duration-300 drop-shadow-md">
              {value}
            </p>

            {description && (
              <p className="text-sm text-muted-foreground leading-relaxed font-medium">{description}</p>
            )}
          </div>

          <div className="ml-6 relative">
            <div className="text-5xl transform group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 drop-shadow-lg">
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

        {/* Enhanced bottom accent */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-secondary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 rounded-full"></div>
        
        {/* Corner accent */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-background/30 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
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