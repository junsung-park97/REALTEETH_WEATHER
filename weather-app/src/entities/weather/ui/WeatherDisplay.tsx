import { createContext, useContext } from 'react'
import { cn } from '@/shared/lib/utils'
import type { SkyCondition, PrecipitationType } from '../model/types'
import { getWeatherIcon, getWeatherLabel } from '../model/constants'

type Size = 'sm' | 'md' | 'lg'

const SizeContext = createContext<Size>('md')
const useSize = () => useContext(SizeContext)

interface WeatherDisplayProps {
  size?: Size
  className?: string
  children: React.ReactNode
}

interface IconProps {
  sky: SkyCondition
  precipitation?: PrecipitationType
  className?: string
}

interface TempProps {
  value: number
  className?: string
}

interface MinMaxProps {
  min: number
  max: number
  className?: string
}

interface DetailsProps {
  humidity?: number
  windSpeed?: number
  pop?: number
  className?: string
}

interface LabelProps {
  sky: SkyCondition
  precipitation?: PrecipitationType
  className?: string
}

const sizeClasses = {
  icon: { sm: 'text-3xl', md: 'text-5xl', lg: 'text-7xl' },
  temp: { sm: 'text-2xl', md: 'text-4xl', lg: 'text-6xl' },
  text: { sm: 'text-xs', md: 'text-sm', lg: 'text-base' },
} as const

const WeatherDisplay = ({
  size = 'md',
  className,
  children,
}: WeatherDisplayProps) => {
  return (
    <SizeContext.Provider value={size}>
      <div className={cn('flex flex-col items-center gap-2', className)}>
        {children}
      </div>
    </SizeContext.Provider>
  )
}

const Icon = ({ sky, precipitation = 'none', className }: IconProps) => {
  const size = useSize()
  const icon = getWeatherIcon(sky, precipitation)

  return (
    <span
      className={cn(sizeClasses.icon[size], className)}
      role="img"
      aria-label={`${sky} ${precipitation}`}
    >
      {icon}
    </span>
  )
}

const Temp = ({ value, className }: TempProps) => {
  const size = useSize()

  return (
    <span className={cn('font-bold', sizeClasses.temp[size], className)}>
      {value.toFixed(1)}°
    </span>
  )
}

const MinMax = ({ min, max, className }: MinMaxProps) => {
  const size = useSize()

  return (
    <div className={cn('text-muted-foreground', sizeClasses.text[size], className)}>
      <span className="text-blue-500">{min.toFixed(1)}°</span>
      <span className="mx-1">/</span>
      <span className="text-red-500">{max.toFixed(1)}°</span>
    </div>
  )
}

const Details = ({ humidity, windSpeed, pop, className }: DetailsProps) => {
  const size = useSize()

  return (
    <div
      className={cn(
        'flex gap-4 text-muted-foreground',
        sizeClasses.text[size],
        className
      )}
    >
      {humidity !== undefined && <span>💧 {humidity}%</span>}
      {windSpeed !== undefined && <span>💨 {windSpeed}m/s</span>}
      {pop !== undefined && pop > 0 && <span>🌧️ {pop}%</span>}
    </div>
  )
}

const Label = ({ sky, precipitation = 'none', className }: LabelProps) => {
  const label = getWeatherLabel(sky, precipitation)

  return (
    <span className={cn('text-muted-foreground text-sm', className)}>
      {label}
    </span>
  )
}

WeatherDisplay.Icon = Icon
WeatherDisplay.Temp = Temp
WeatherDisplay.MinMax = MinMax
WeatherDisplay.Details = Details
WeatherDisplay.Label = Label

export { WeatherDisplay }
