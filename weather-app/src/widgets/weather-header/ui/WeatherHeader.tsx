import { useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
<<<<<<< HEAD
import { Alert, AlertDescription } from '@/shared/ui'
=======
import { Alert, AlertDescription, Card, CardContent } from '@/shared/ui'
>>>>>>> 408c40c4cc28cebc87f5a97e48884977f583249b
import { LocationSearchInput } from '@/features/search-location'
import {
  useCurrentLocation,
  useWeather,
  CurrentWeather,
  CurrentWeatherSkeleton,
<<<<<<< HEAD
=======
  HourlyForecast,
  HourlyForecastSkeleton,
>>>>>>> 408c40c4cc28cebc87f5a97e48884977f583249b
} from '@/features/get-weather'
import { AddFavoriteButton } from '@/features/manage-favorites'
import type { Location } from '@/entities/location'

interface WeatherHeaderProps {
  className?: string
}

export const WeatherHeader = ({ className }: WeatherHeaderProps) => {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [error, setError] = useState<string | null>(null)
<<<<<<< HEAD
=======
  const [isRefreshing, setIsRefreshing] = useState(false)
>>>>>>> 408c40c4cc28cebc87f5a97e48884977f583249b

  const {
    location: currentLocation,
    isLoading: isLocationLoading,
    error: locationError,
    refetch: refetchLocation,
  } = useCurrentLocation()

  const activeLocation = selectedLocation || currentLocation

  const {
    current: weather,
<<<<<<< HEAD
=======
    hourly,
>>>>>>> 408c40c4cc28cebc87f5a97e48884977f583249b
    minTemp,
    maxTemp,
    isLoading: isWeatherLoading,
    error: weatherError,
  } = useWeather(activeLocation?.nx, activeLocation?.ny)

  const handleSelectLocation = (location: Location) => {
    setSelectedLocation(location)
    setError(null)
  }

<<<<<<< HEAD
  const handleRefresh = () => {
    if (selectedLocation) {
      setSelectedLocation(null)
    } else {
      refetchLocation()
=======
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      if (selectedLocation) {
        setSelectedLocation(null)
      } else {
        await refetchLocation()
      }
    } finally {
      setIsRefreshing(false)
>>>>>>> 408c40c4cc28cebc87f5a97e48884977f583249b
    }
  }

  const handleFavoriteError = (message: string) => {
    setError(message)
    setTimeout(() => setError(null), 3000)
  }

  const isLoading = isLocationLoading || isWeatherLoading

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className="flex items-center gap-2">
        <LocationSearchInput
          onSelectLocation={handleSelectLocation}
          className="flex-1"
        />
        {activeLocation && (
          <AddFavoriteButton
            location={activeLocation}
            onError={handleFavoriteError}
          />
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {locationError && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{locationError}</AlertDescription>
        </Alert>
      )}

      {weatherError && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>
            날씨 정보를 불러올 수 없습니다.
          </AlertDescription>
        </Alert>
      )}

<<<<<<< HEAD
      {isLoading && <CurrentWeatherSkeleton />}

      {!isLoading && weather && activeLocation && (
        <CurrentWeather
          weather={weather}
          locationName={activeLocation.fullName}
          minTemp={minTemp}
          maxTemp={maxTemp}
          onRefresh={handleRefresh}
          isRefreshing={isLoading}
        />
=======
      {isLoading && !weather && (
        <>
          <CurrentWeatherSkeleton />
          <Card>
            <CardContent className="pt-4">
              <HourlyForecastSkeleton />
            </CardContent>
          </Card>
        </>
      )}

      {weather && activeLocation && (
        <>
          <CurrentWeather
            weather={weather}
            locationName={activeLocation.fullName}
            minTemp={minTemp}
            maxTemp={maxTemp}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
          />
          {hourly.length > 0 && (
            <Card>
              <CardContent className="pt-4">
                <HourlyForecast forecasts={hourly} />
              </CardContent>
            </Card>
          )}
        </>
>>>>>>> 408c40c4cc28cebc87f5a97e48884977f583249b
      )}
    </div>
  )
}
