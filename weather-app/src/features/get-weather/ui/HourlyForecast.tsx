import { cn } from '@/shared/lib/utils'
import { ScrollArea, ScrollBar } from '@/shared/ui'
import { WeatherIcon } from '@/entities/weather'
import type { HourlyForecast as HourlyForecastType } from '@/entities/weather'

interface HourlyForecastProps {
  forecasts: HourlyForecastType[]
  className?: string
}

const formatTime = (time: string): string => {
  const hour = parseInt(time.slice(0, 2), 10)
  return `${hour}시`
}

const HourlyItem = ({ forecast }: { forecast: HourlyForecastType }) => {
  const { time, weather } = forecast

  return (
    <div className="flex flex-col items-center gap-1 px-3 py-2 min-w-[60px] md:min-w-[70px] lg:min-w-[80px]">
      <span className="text-xs text-muted-foreground">{formatTime(time)}</span>
      <WeatherIcon
        sky={weather.sky}
        precipitation={weather.precipitation}
        size="sm"
      />
      <span className="text-sm font-medium">{weather.temperature.toFixed(1)}°</span>
      {weather.precipitationProbability > 0 && (
        <span className="text-xs text-blue-500">
          {weather.precipitationProbability}%
        </span>
      )}
    </div>
  )
}

export const HourlyForecast = ({ forecasts, className }: HourlyForecastProps) => {
  if (forecasts.length === 0) {
    return null
  }

  return (
    <div className={cn('w-full', className)}>
      <h3 className="text-sm font-medium text-muted-foreground mb-2 px-4">
        시간별 예보
      </h3>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex">
          {forecasts.map((forecast) => (
            <HourlyItem key={`${forecast.date}-${forecast.time}`} forecast={forecast} />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}
