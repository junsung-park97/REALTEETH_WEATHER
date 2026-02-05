import { MapPin, RefreshCw } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Button, Card, CardContent } from "@/shared/ui";
import { WeatherDisplay } from "@/entities/weather";
import { HourlyForecast } from "@/features/get-weather";
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
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div className="flex items-center gap-2 text-muted-foreground">
        <MapPin className="size-4" />
        <span className="text-sm">{locationName}</span>
        {onRefresh && (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={cn("size-3", isRefreshing && "animate-spin")}
            />
          </Button>
        )}
      </div>

      <WeatherDisplay size="lg">
        <WeatherDisplay.Icon
          sky={weather.sky}
          precipitation={weather.precipitation}
        />
        <WeatherDisplay.Temp value={weather.temperature} />
        <WeatherDisplay.Label
          sky={weather.sky}
          precipitation={weather.precipitation}
        />
        {minTemp !== null && maxTemp !== null && (
          <WeatherDisplay.MinMax min={minTemp} max={maxTemp} />
        )}
        <WeatherDisplay.Details
          humidity={weather.humidity}
          windSpeed={weather.windSpeed}
          pop={weather.precipitationProbability}
        />
      </WeatherDisplay>
    </div>
  );
};
