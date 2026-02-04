import { useQuery } from '@tanstack/react-query'
import {
  fetchUltraSrtNcst,
  fetchVilageFcst,
  type KmaNcstItem,
  type KmaForecastItem,
} from '@/shared/api'
import {
  SKY_MAP,
  PTY_MAP,
  type Weather,
  type HourlyForecast,
  type SkyCondition,
  type PrecipitationType,
} from '@/entities/weather'

interface UseWeatherResult {
  current: Weather | null
  hourly: HourlyForecast[]
  minTemp: number | null
  maxTemp: number | null
  isLoading: boolean
  error: Error | null
}

const parseNcstData = (items: KmaNcstItem[]): Partial<Weather> => {
  const result: Partial<Weather> = {}

  for (const item of items) {
    switch (item.category) {
      case 'T1H':
        result.temperature = parseFloat(item.obsrValue)
        break
      case 'REH':
        result.humidity = parseInt(item.obsrValue, 10)
        break
      case 'WSD':
        result.windSpeed = parseFloat(item.obsrValue)
        break
      case 'PTY':
        result.precipitation = PTY_MAP[item.obsrValue] as PrecipitationType ?? 'none'
        break
    }
  }

  return result
}

const parseFcstData = (items: KmaForecastItem[]): {
  hourly: HourlyForecast[]
  minTemp: number | null
  maxTemp: number | null
  currentSky: SkyCondition
} => {
  const hourlyMap = new Map<string, Partial<Weather>>()
  let minTemp: number | null = null
  let maxTemp: number | null = null
  let currentSky: SkyCondition = 'clear'

  const now = new Date()
  const currentHour = `${String(now.getHours()).padStart(2, '0')}00`

  for (const item of items) {
    const key = `${item.fcstDate}-${item.fcstTime}`

    if (!hourlyMap.has(key)) {
      hourlyMap.set(key, {})
    }

    const weather = hourlyMap.get(key)!

    switch (item.category) {
      case 'TMP':
        weather.temperature = parseFloat(item.fcstValue)
        break
      case 'SKY':
        weather.sky = SKY_MAP[item.fcstValue] as SkyCondition ?? 'clear'
        if (item.fcstTime === currentHour) {
          currentSky = weather.sky
        }
        break
      case 'PTY':
        weather.precipitation = PTY_MAP[item.fcstValue] as PrecipitationType ?? 'none'
        break
      case 'POP':
        weather.precipitationProbability = parseInt(item.fcstValue, 10)
        break
      case 'REH':
        weather.humidity = parseInt(item.fcstValue, 10)
        break
      case 'WSD':
        weather.windSpeed = parseFloat(item.fcstValue)
        break
      case 'TMN':
        minTemp = parseFloat(item.fcstValue)
        break
      case 'TMX':
        maxTemp = parseFloat(item.fcstValue)
        break
    }
  }

  const hourly: HourlyForecast[] = []
  const sortedKeys = Array.from(hourlyMap.keys()).sort()

  for (const key of sortedKeys.slice(0, 24)) {
    const [date, time] = key.split('-')
    const weather = hourlyMap.get(key)!

    if (weather.temperature !== undefined) {
      hourly.push({
        date,
        time,
        weather: {
          temperature: weather.temperature,
          sky: weather.sky ?? 'clear',
          precipitation: weather.precipitation ?? 'none',
          humidity: weather.humidity ?? 0,
          windSpeed: weather.windSpeed ?? 0,
          precipitationProbability: weather.precipitationProbability ?? 0,
        },
      })
    }
  }

  return { hourly, minTemp, maxTemp, currentSky }
}

export const useWeather = (
  nx: number | undefined,
  ny: number | undefined
): UseWeatherResult => {
  const ncstQuery = useQuery({
    queryKey: ['weather', 'ncst', nx, ny],
    queryFn: () => fetchUltraSrtNcst(nx!, ny!),
    enabled: nx !== undefined && ny !== undefined,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  })

  const fcstQuery = useQuery({
    queryKey: ['weather', 'fcst', nx, ny],
    queryFn: () => fetchVilageFcst(nx!, ny!),
    enabled: nx !== undefined && ny !== undefined,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  })

  const isLoading = ncstQuery.isLoading || fcstQuery.isLoading
  const error = ncstQuery.error ?? fcstQuery.error

  if (isLoading || error || !ncstQuery.data || !fcstQuery.data) {
    return {
      current: null,
      hourly: [],
      minTemp: null,
      maxTemp: null,
      isLoading,
      error: error as Error | null,
    }
  }

  const ncstData = parseNcstData(ncstQuery.data)
  const { hourly, minTemp, maxTemp, currentSky } = parseFcstData(fcstQuery.data)

  const current: Weather = {
    temperature: ncstData.temperature ?? 0,
    sky: currentSky,
    precipitation: ncstData.precipitation ?? 'none',
    humidity: ncstData.humidity ?? 0,
    windSpeed: ncstData.windSpeed ?? 0,
    precipitationProbability: hourly[0]?.weather.precipitationProbability ?? 0,
  }

  return {
    current,
    hourly,
    minTemp,
    maxTemp,
    isLoading: false,
    error: null,
  }
}
