import regionsData from './regions.json'
import type { Region } from './types'

const regions: Region[] = regionsData.regions

/**
 * 행정구역명으로 검색 (자동완성용)
 */
export const searchRegions = (query: string, limit = 10): Region[] => {
  if (!query.trim()) return []

  const normalizedQuery = query.trim().toLowerCase()

  return regions
    .filter((region) => {
      const fullName = [region.level1, region.level2, region.level3]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return fullName.includes(normalizedQuery)
    })
    .slice(0, limit)
}

/**
 * 행정구역 코드로 조회
 */
export const getRegionByCode = (code: string): Region | undefined => {
  return regions.find((region) => region.code === code)
}

/**
 * 격자좌표로 가장 가까운 행정구역 조회
 */
export const getRegionByGrid = (nx: number, ny: number): Region | undefined => {
  return regions.find((region) => region.nx === nx && region.ny === ny)
}

/**
 * 위경도로 가장 가까운 행정구역 조회
 */
export const getNearestRegion = (lat: number, lon: number): Region | undefined => {
  let nearest: Region | undefined
  let minDistance = Number.POSITIVE_INFINITY

  for (const region of regions) {
    const distance = Math.sqrt(
      (region.lat - lat) ** 2 + (region.lon - lon) ** 2
    )

    if (distance < minDistance) {
      minDistance = distance
      nearest = region
    }
  }

  return nearest
}

/**
 * 행정구역 전체 이름 반환
 */
export const getRegionFullName = (region: Region): string => {
  return [region.level1, region.level2, region.level3]
    .filter(Boolean)
    .join(' ')
}

/**
 * 모든 행정구역 반환
 */
export const getAllRegions = (): Region[] => {
  return regions
}

/**
 * 시/도 목록 반환
 */
export const getLevel1Regions = (): Region[] => {
  return regions.filter((region) => !region.level2 && !region.level3)
}

/**
 * 특정 시/도의 시/군/구 목록 반환
 */
export const getLevel2Regions = (level1: string): Region[] => {
  return regions.filter(
    (region) => region.level1 === level1 && region.level2 && !region.level3
  )
}
