import { cn } from '@/shared/lib/utils'
import type { SkyCondition, PrecipitationType } from '../model/types'
import { getWeatherIcon } from '../model/constants'

interface WeatherIconProps {
  sky: SkyCondition
  precipitation?: PrecipitationType
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeClasses = {
  sm: 'text-2xl',
  md: 'text-4xl',
  lg: 'text-6xl',
  xl: 'text-8xl',
}

export const WeatherIcon = ({
  sky,
  precipitation = 'none',
  size = 'md',
  className,
}: WeatherIconProps) => {
  const icon = getWeatherIcon(sky, precipitation)

  return (
    <span
      className={cn(sizeClasses[size], className)}
      role="img"
      aria-label={`${sky} ${precipitation}`}
    >
      {icon}
    </span>
  )
}
