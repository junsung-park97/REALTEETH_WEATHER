import { cn } from '@/shared/lib/utils'
import { Card, CardHeader, CardContent, CardFooter, Button } from '@/shared/ui'
import { Pencil, Trash2 } from 'lucide-react'
import { WeatherDisplay } from '@/entities/weather'
import type { SkyCondition, PrecipitationType } from '@/entities/weather'

interface FavoriteCardProps {
  onClick?: () => void
  className?: string
  children: React.ReactNode
}

interface HeaderProps {
  name: string
  location: string
  className?: string
}

interface WeatherProps {
  sky: SkyCondition
  precipitation: PrecipitationType
  temp: number
  minTemp?: number
  maxTemp?: number
  className?: string
}

interface ActionsProps {
  onEdit: () => void
  onDelete: () => void
  className?: string
}

const FavoriteCard = ({ onClick, className, children }: FavoriteCardProps) => {
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-200 py-4',
        onClick && 'hover:scale-[1.02] hover:shadow-lg',
        className
      )}
      onClick={onClick}
    >
      {children}
    </Card>
  )
}

const Header = ({ name, location, className }: HeaderProps) => (
  <CardHeader className={cn('pb-2 px-4', className)}>
    <h3 className="font-semibold text-sm truncate">{name}</h3>
    <p className="text-xs text-muted-foreground truncate">{location}</p>
  </CardHeader>
)

const Weather = ({
  sky,
  precipitation,
  temp,
  minTemp,
  maxTemp,
  className,
}: WeatherProps) => (
  <CardContent className={cn('py-2 px-4', className)}>
    <WeatherDisplay size="sm">
      <WeatherDisplay.Icon sky={sky} precipitation={precipitation} />
      <WeatherDisplay.Temp value={temp} />
      {minTemp !== undefined && maxTemp !== undefined && (
        <WeatherDisplay.MinMax min={minTemp} max={maxTemp} />
      )}
    </WeatherDisplay>
  </CardContent>
)

const Actions = ({ onEdit, onDelete, className }: ActionsProps) => (
  <CardFooter className={cn('pt-2 px-4 gap-2 justify-center', className)}>
    <Button
      variant="ghost"
      size="icon-xs"
      onClick={(e) => {
        e.stopPropagation()
        onEdit()
      }}
    >
      <Pencil className="size-3" />
    </Button>
    <Button
      variant="ghost"
      size="icon-xs"
      onClick={(e) => {
        e.stopPropagation()
        onDelete()
      }}
    >
      <Trash2 className="size-3" />
    </Button>
  </CardFooter>
)

FavoriteCard.Header = Header
FavoriteCard.Weather = Weather
FavoriteCard.Actions = Actions

export { FavoriteCard }
