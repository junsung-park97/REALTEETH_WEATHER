import { kmaClient } from './client'

interface KmaForecastItem {
  baseDate: string
  baseTime: string
  category: string
  fcstDate: string
  fcstTime: string
  fcstValue: string
  nx: number
  ny: number
}

interface KmaNcstItem {
  baseDate: string
  baseTime: string
  category: string
  nx: number
  ny: number
  obsrValue: string
}

const formatDate = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

const formatTime = (date: Date): string => {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}${minutes}`
}

const getUltraSrtNcstBaseTime = (date: Date): { baseDate: string; baseTime: string } => {
  const now = new Date(date)
  const minutes = now.getMinutes()

  if (minutes < 40) {
    now.setHours(now.getHours() - 1)
  }

  return {
    baseDate: formatDate(now),
    baseTime: `${String(now.getHours()).padStart(2, '0')}00`,
  }
}

const getUltraSrtFcstBaseTime = (date: Date): { baseDate: string; baseTime: string } => {
  const now = new Date(date)
  const minutes = now.getMinutes()

  if (minutes < 45) {
    now.setHours(now.getHours() - 1)
  }

  return {
    baseDate: formatDate(now),
    baseTime: `${String(now.getHours()).padStart(2, '0')}30`,
  }
}

const getVilageFcstBaseTime = (date: Date): { baseDate: string; baseTime: string } => {
  const now = new Date(date)
  const hours = now.getHours()
  const minutes = now.getMinutes()

  const baseTimes = [2, 5, 8, 11, 14, 17, 20, 23]
  let baseHour = baseTimes[0]
  let baseDate = formatDate(now)

  for (let i = baseTimes.length - 1; i >= 0; i--) {
    const bt = baseTimes[i]
    if (hours > bt || (hours === bt && minutes >= 10)) {
      baseHour = bt
      break
    }
    if (i === 0) {
      now.setDate(now.getDate() - 1)
      baseDate = formatDate(now)
      baseHour = 23
    }
  }

  return {
    baseDate,
    baseTime: `${String(baseHour).padStart(2, '0')}00`,
  }
}

export const fetchUltraSrtNcst = async (
  nx: number,
  ny: number
): Promise<KmaNcstItem[]> => {
  const { baseDate, baseTime } = getUltraSrtNcstBaseTime(new Date())

  return kmaClient.get<KmaNcstItem>('getUltraSrtNcst', {
    numOfRows: 10,
    pageNo: 1,
    base_date: baseDate,
    base_time: baseTime,
    nx,
    ny,
  })
}

export const fetchUltraSrtFcst = async (
  nx: number,
  ny: number
): Promise<KmaForecastItem[]> => {
  const { baseDate, baseTime } = getUltraSrtFcstBaseTime(new Date())

  return kmaClient.get<KmaForecastItem>('getUltraSrtFcst', {
    numOfRows: 60,
    pageNo: 1,
    base_date: baseDate,
    base_time: baseTime,
    nx,
    ny,
  })
}

export const fetchVilageFcst = async (
  nx: number,
  ny: number
): Promise<KmaForecastItem[]> => {
  const { baseDate, baseTime } = getVilageFcstBaseTime(new Date())

  return kmaClient.get<KmaForecastItem>('getVilageFcst', {
    numOfRows: 1000,
    pageNo: 1,
    base_date: baseDate,
    base_time: baseTime,
    nx,
    ny,
  })
}

export type { KmaForecastItem, KmaNcstItem }
export { formatDate, formatTime }
