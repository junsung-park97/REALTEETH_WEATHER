/**
 * 중심좌표(Centroid) 계산 모듈
 * Polygon 및 MultiPolygon 지오메트리의 중심점을 계산합니다.
 */

import type { GeoJSONGeometry } from './types'

interface Centroid {
  lat: number
  lon: number
}

/**
 * 링(좌표 배열)의 중심좌표를 계산합니다.
 */
const calculateRingCentroid = (ring: number[][]): { cx: number; cy: number; area: number } => {
  const n = ring.length
  let cx = 0
  let cy = 0
  let area = 0

  for (let i = 0; i < n - 1; i++) {
    const [x1, y1] = ring[i]
    const [x2, y2] = ring[i + 1]
    const cross = x1 * y2 - x2 * y1
    cx += (x1 + x2) * cross
    cy += (y1 + y2) * cross
    area += cross
  }

  area /= 2
  const factor = area !== 0 ? 1 / (6 * area) : 0

  return {
    cx: cx * factor,
    cy: cy * factor,
    area: Math.abs(area),
  }
}

/**
 * Polygon의 중심좌표를 계산합니다.
 * 외곽 링만 사용 (구멍은 무시)
 */
const calculatePolygonCentroid = (coordinates: number[][][]): { cx: number; cy: number; area: number } => {
  // 첫 번째 링이 외곽 경계
  const outerRing = coordinates[0]
  if (!outerRing || outerRing.length < 3) {
    return { cx: 0, cy: 0, area: 0 }
  }

  return calculateRingCentroid(outerRing)
}

/**
 * MultiPolygon의 면적 가중 중심좌표를 계산합니다.
 */
const calculateMultiPolygonCentroid = (coordinates: number[][][][]): { cx: number; cy: number; area: number } => {
  let totalArea = 0
  let weightedCx = 0
  let weightedCy = 0

  for (const polygon of coordinates) {
    const { cx, cy, area } = calculatePolygonCentroid(polygon)
    if (area > 0) {
      weightedCx += cx * area
      weightedCy += cy * area
      totalArea += area
    }
  }

  if (totalArea === 0) {
    return { cx: 0, cy: 0, area: 0 }
  }

  return {
    cx: weightedCx / totalArea,
    cy: weightedCy / totalArea,
    area: totalArea,
  }
}

/**
 * GeoJSON Geometry의 중심좌표를 계산합니다.
 * @returns { lat, lon } WGS84 좌표
 */
export const calculateCentroid = (geometry: GeoJSONGeometry): Centroid => {
  let result: { cx: number; cy: number; area: number }

  if (geometry.type === 'Polygon') {
    result = calculatePolygonCentroid(geometry.coordinates)
  } else if (geometry.type === 'MultiPolygon') {
    result = calculateMultiPolygonCentroid(geometry.coordinates)
  } else {
    throw new Error(`Unsupported geometry type: ${(geometry as { type: string }).type}`)
  }

  // GeoJSON은 [longitude, latitude] 순서
  return {
    lon: Math.round(result.cx * 10000) / 10000, // 소수점 4자리
    lat: Math.round(result.cy * 10000) / 10000,
  }
}

/**
 * 좌표 유효성 검사 (한반도 범위)
 */
export const isValidKoreaCoordinate = (lat: number, lon: number): boolean => {
  return lat >= 33 && lat <= 43 && lon >= 124 && lon <= 132
}
