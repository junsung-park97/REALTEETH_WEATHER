import type { SkyCondition, PrecipitationType } from './types'

export const SKY_MAP: Record<string, SkyCondition> = {
  '1': 'clear',
  '3': 'cloudy',
  '4': 'overcast',
}

export const PTY_MAP: Record<string, PrecipitationType> = {
  '0': 'none',
  '1': 'rain',
  '2': 'sleet',
  '3': 'snow',
  '4': 'shower',
}

export const WEATHER_ICONS: Record<SkyCondition, Record<PrecipitationType, string>> = {
  clear: {
    none: '☀️',
    rain: '🌦️',
    snow: '🌨️',
    sleet: '🌨️',
    shower: '🌦️',
  },
  cloudy: {
    none: '⛅',
    rain: '🌧️',
    snow: '🌨️',
    sleet: '🌨️',
    shower: '🌧️',
  },
  overcast: {
    none: '☁️',
    rain: '🌧️',
    snow: '❄️',
    sleet: '🌨️',
    shower: '🌧️',
  },
}

export const SKY_LABELS: Record<SkyCondition, string> = {
  clear: '맑음',
  cloudy: '구름많음',
  overcast: '흐림',
}

export const PTY_LABELS: Record<PrecipitationType, string> = {
  none: '',
  rain: '비',
  snow: '눈',
  sleet: '비/눈',
  shower: '소나기',
}

export const ERROR_MESSAGES = {
  LOCATION_PERMISSION_DENIED: '위치 권한이 거부되었습니다.',
  WEATHER_NOT_AVAILABLE: '날씨 정보를 불러올 수 없습니다.',
  LOCATION_NOT_FOUND: '해당 장소의 정보가 제공되지 않습니다.',
  FAVORITES_LIMIT: '즐겨찾기는 최대 6개까지 추가할 수 있습니다.',
  NETWORK_ERROR: '네트워크 오류가 발생했습니다. 다시 시도해주세요.',
}

export const getWeatherIcon = (
  sky: SkyCondition,
  precipitation: PrecipitationType
): string => {
  return WEATHER_ICONS[sky]?.[precipitation] ?? WEATHER_ICONS.clear.none
}

export const getWeatherLabel = (
  sky: SkyCondition,
  precipitation: PrecipitationType
): string => {
  const skyLabel = SKY_LABELS[sky]
  const ptyLabel = PTY_LABELS[precipitation]
  return ptyLabel ? `${skyLabel}, ${ptyLabel}` : skyLabel
}
