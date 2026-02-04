import { useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Alert, AlertDescription } from '@/shared/ui'
import { LocationSearchInput } from '@/features/search-location'
import {
  useCurrentLocation,
  useWeather,
  CurrentWeather,
  CurrentWeatherSkeleton,
} from '@/features/get-weather'
import { AddFavoriteButton } from '@/features/manage-favorites'
import type { Location } from '@/entities/location'

interface WeatherHeaderProps {
  className?: string
}

export const WeatherHeader = ({ className }: WeatherHeaderProps) => {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [error, setError] = useState<string | null>(null)

  const {
    location: currentLocation,
    isLoading: isLocationLoading,
    error: locationError,
    refetch: refetchLocation,
  } = useCurrentLocation()

  const activeLocation = selectedLocation || currentLocation

  const {
    current: weather,
    minTemp,
    maxTemp,
    isLoading: isWeatherLoading,
    error: weatherError,
  } = useWeather(activeLocation?.nx, activeLocation?.ny)

  const handleSelectLocation = (location: Location) => {
    setSelectedLocation(location)
    setError(null)
  }

  const handleRefresh = () => {
    if (selectedLocation) {
      setSelectedLocation(null)
    } else {
      refetchLocation()
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
      )}
    </div>
  )
}
