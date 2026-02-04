export type SkyCondition = 'clear' | 'cloudy' | 'overcast'
export type PrecipitationType = 'none' | 'rain' | 'snow' | 'sleet' | 'shower'

export interface Weather {
  temperature: number
  sky: SkyCondition
  precipitation: PrecipitationType
  humidity: number
  windSpeed: number
  precipitationProbability: number
}

export interface HourlyForecast {
  date: string
  time: string
  weather: Weather
}

export interface CurrentWeatherData {
  temperature: number
  humidity: number
  windSpeed: number
  precipitation: PrecipitationType
}
