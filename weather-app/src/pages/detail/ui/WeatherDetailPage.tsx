import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import { Button, Alert, AlertDescription, Card, CardContent } from '@/shared/ui'
import { getRegionByCode, getRegionFullName } from '@/shared/data/regionSearch'
import {
  useWeather,
  CurrentWeather,
  CurrentWeatherSkeleton,
  HourlyForecast,
  HourlyForecastSkeleton,
} from '@/features/get-weather'
import { AddFavoriteButton } from '@/features/manage-favorites'
import { ThemeToggle } from '@/features/theme-toggle'
import type { Location } from '@/entities/location'
import type { Region } from '@/shared/data/types'

const regionToLocation = (region: Region): Location => ({
  code: region.code,
  name: region.level3 || region.level2 || region.level1,
  fullName: getRegionFullName(region),
  level1: region.level1,
  level2: region.level2,
  level3: region.level3,
  nx: region.nx,
  ny: region.ny,
  lat: region.lat,
  lon: region.lon,
})

export const WeatherDetailPage = () => {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()

  const region = code ? getRegionByCode(code) : undefined
  const location = region ? regionToLocation(region) : undefined

  const {
    current: weather,
    hourly,
    minTemp,
    maxTemp,
    isLoading,
    error,
  } = useWeather(location?.nx, location?.ny)

  if (!region || !location) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto px-4 py-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="size-4 mr-2" />
            돌아가기
          </Button>
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>
              해당 장소의 정보가 제공되지 않습니다.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background animate-in fade-in duration-300">
      <div className="max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto px-4 py-6 space-y-6">
        <header className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="size-4 mr-2" />
            돌아가기
          </Button>
          <div className="flex items-center gap-2">
            <AddFavoriteButton location={location} />
            <ThemeToggle />
          </div>
        </header>

        {isLoading && (
          <>
            <CurrentWeatherSkeleton />
            <Card>
              <CardContent className="pt-4">
                <HourlyForecastSkeleton />
              </CardContent>
            </Card>
          </>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>
              날씨 정보를 불러올 수 없습니다.
            </AlertDescription>
          </Alert>
        )}

        {!isLoading && weather && (
          <>
            <CurrentWeather
              weather={weather}
              locationName={location.fullName}
              minTemp={minTemp}
              maxTemp={maxTemp}
            />

            {hourly.length > 0 && (
              <Card>
                <CardContent className="pt-4">
                  <HourlyForecast forecasts={hourly} />
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}
