/**
 * 기상청 격자좌표 변환 함수
 * Lambert Conformal Conic Projection 기반
 * 위경도 ↔ 격자좌표(nx, ny) 변환
 */

interface GridCoord {
  nx: number
  ny: number
}

interface LatLon {
  lat: number
  lon: number
}

// 기상청 격자 변환 상수
const RE = 6371.00877 // 지구 반경(km)
const GRID = 5.0 // 격자 간격(km)
const SLAT1 = 30.0 // 투영 위도1(degree)
const SLAT2 = 60.0 // 투영 위도2(degree)
const OLON = 126.0 // 기준점 경도(degree)
const OLAT = 38.0 // 기준점 위도(degree)
const XO = 43 // 기준점 X좌표(GRID)
const YO = 136 // 기준점 Y좌표(GRID)

const DEGRAD = Math.PI / 180.0
const RADDEG = 180.0 / Math.PI

// 사전 계산된 상수
const re = RE / GRID
const slat1 = SLAT1 * DEGRAD
const slat2 = SLAT2 * DEGRAD
const olon = OLON * DEGRAD
const olat = OLAT * DEGRAD

const sn =
  Math.tan(Math.PI * 0.25 + slat2 * 0.5) /
  Math.tan(Math.PI * 0.25 + slat1 * 0.5)
const snLog = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn)
const sf = (Math.tan(Math.PI * 0.25 + slat1 * 0.5) ** snLog * Math.cos(slat1)) / snLog
const ro = (re * sf) / Math.tan(Math.PI * 0.25 + olat * 0.5) ** snLog

/**
 * 위경도를 격자좌표로 변환
 */
export const latLonToGrid = (lat: number, lon: number): GridCoord => {
  const ra = (re * sf) / Math.tan(Math.PI * 0.25 + lat * DEGRAD * 0.5) ** snLog
  let theta = lon * DEGRAD - olon
  if (theta > Math.PI) theta -= 2.0 * Math.PI
  if (theta < -Math.PI) theta += 2.0 * Math.PI
  theta *= snLog

  const nx = Math.floor(ra * Math.sin(theta) + XO + 0.5)
  const ny = Math.floor(ro - ra * Math.cos(theta) + YO + 0.5)

  return { nx, ny }
}

/**
 * 격자좌표를 위경도로 변환
 */
export const gridToLatLon = (nx: number, ny: number): LatLon => {
  const xn = nx - XO
  const yn = ro - ny + YO
  const ra = Math.sqrt(xn * xn + yn * yn)
  const alat =
    (2 * Math.atan(((re * sf) / ra) ** (1.0 / snLog)) - Math.PI * 0.5) * RADDEG

  let theta = 0.0
  if (Math.abs(xn) <= 0.0) {
    theta = 0.0
  } else if (Math.abs(yn) <= 0.0) {
    theta = Math.PI * 0.5
    if (xn < 0.0) theta = -theta
  } else {
    theta = Math.atan2(xn, yn)
  }
  const alon = theta / snLog + olon

  return {
    lat: alat,
    lon: alon * RADDEG,
  }
}

/**
 * 좌표 유효성 검사 (한반도 범위)
 */
export const isValidKoreaCoord = (lat: number, lon: number): boolean => {
  return lat >= 33 && lat <= 43 && lon >= 124 && lon <= 132
}

/**
 * 격자좌표 유효성 검사
 */
export const isValidGridCoord = (nx: number, ny: number): boolean => {
  return nx >= 1 && nx <= 149 && ny >= 1 && ny <= 253
}
