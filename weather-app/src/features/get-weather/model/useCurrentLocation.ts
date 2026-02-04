import { useState, useEffect, useCallback } from 'react'
import { getNearestRegion } from '@/shared/data/regionSearch'
import type { Location } from '@/entities/location'
import type { Region } from '@/shared/data/types'

interface UseCurrentLocationResult {
  location: Location | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

const regionToLocation = (region: Region): Location => ({
  code: region.code,
  name: region.level3 || region.level2 || region.level1,
  fullName: [region.level1, region.level2, region.level3]
    .filter(Boolean)
    .join(' '),
  level1: region.level1,
  level2: region.level2,
  level3: region.level3,
  nx: region.nx,
  ny: region.ny,
  lat: region.lat,
  lon: region.lon,
})

export const useCurrentLocation = (): UseCurrentLocationResult => {
  const [location, setLocation] = useState<Location | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const getCurrentLocation = useCallback(() => {
    setIsLoading(true)
    setError(null)

    if (!navigator.geolocation) {
      setError('이 브라우저에서는 위치 서비스를 지원하지 않습니다.')
      setIsLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        const region = getNearestRegion(latitude, longitude)

        if (region) {
          setLocation(regionToLocation(region))
        } else {
          setError('해당 위치의 정보를 찾을 수 없습니다.')
        }
        setIsLoading(false)
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('위치 권한이 거부되었습니다.')
            break
          case err.POSITION_UNAVAILABLE:
            setError('위치 정보를 사용할 수 없습니다.')
            break
          case err.TIMEOUT:
            setError('위치 정보 요청 시간이 초과되었습니다.')
            break
          default:
            setError('위치를 가져오는 중 오류가 발생했습니다.')
        }
        setIsLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    )
  }, [])

  useEffect(() => {
    getCurrentLocation()
  }, [getCurrentLocation])

  return {
    location,
    isLoading,
    error,
    refetch: getCurrentLocation,
  }
}
