import { MapPin, RefreshCw } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui";
import { WeatherDisplay } from "@/entities/weather";
import type { Weather } from "@/entities/weather";

interface CurrentWeatherProps {
  weather: Weather;
  locationName: string;
  minTemp: number | null;
  maxTemp: number | null;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  className?: string;
}

export const CurrentWeather = ({
  weather,
  locationName,
  minTemp,
  maxTemp,
  onRefresh,
  isRefreshing,
  className,
}: CurrentWeatherProps) => {
  return (
    <div className={cn('flex flex-col items-center gap-4 py-8', className)}>
      <div className="flex items-center gap-2 text-muted-foreground bg-accent/50 px-4 py-1.5 rounded-full backdrop-blur-sm">
        <MapPin className="size-4 text-primary" />
        <span className="text-sm font-medium">{locationName}</span>
        {onRefresh && (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="hover:bg-accent hover:text-primary transition-colors ml-1"
          >
            <RefreshCw
              className={cn("size-3.5", isRefreshing && "animate-spin text-primary")}
            />
          </Button>
        )}
      </div>

      <WeatherDisplay size="lg" className="gap-6">
        <div className="flex flex-col items-center">
          <WeatherDisplay.Icon
            sky={weather.sky}
            precipitation={weather.precipitation}
            className="drop-shadow-lg mb-2"
          />
          <WeatherDisplay.Label
            sky={weather.sky}
            precipitation={weather.precipitation}
            className="text-xl font-medium text-foreground/80"
          />
        </div>
        
        <WeatherDisplay.Temp value={weather.temperature} />
        
        {minTemp !== null && maxTemp !== null && (
          <WeatherDisplay.MinMax min={minTemp} max={maxTemp} className="text-xl font-medium" />
        )}
        
        <div className="mt-4 w-full">
          <WeatherDisplay.Details
            humidity={weather.humidity}
            windSpeed={weather.windSpeed}
            pop={weather.precipitationProbability}
          />
        </div>
      </WeatherDisplay>
    </div>
  );
};
