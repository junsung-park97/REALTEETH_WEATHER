import { cn } from '@/shared/lib/utils'
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
    <div className="flex flex-col items-center gap-2 px-4 py-3 min-w-[72px] md:min-w-[80px] snap-center rounded-xl bg-card border shadow-sm mx-1 first:ml-0 last:mr-0 transition-transform hover:scale-105 duration-200">
      <span className="text-xs font-medium text-muted-foreground">{formatTime(time)}</span>
      <WeatherIcon
        sky={weather.sky}
        precipitation={weather.precipitation}
        className="size-8 my-1"
      />
      <span className="text-sm font-bold text-foreground">{weather.temperature.toFixed(1)}°</span>
      {weather.precipitationProbability > 0 && (
        <span className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded-full">
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
      <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-1 flex items-center gap-2">
        <span className="size-1.5 rounded-full bg-primary/60" />
        시간별 예보
      </h3>
      <div className="flex overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide snap-x snap-mandatory">
        {forecasts.map((forecast) => (
          <HourlyItem key={`${forecast.date}-${forecast.time}`} forecast={forecast} />
        ))}
      </div>
    </div>
  )
}
