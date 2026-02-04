export interface Region {
  code: string
  level1: string // 시/도
  level2: string // 시/군/구
  level3: string // 읍/면/동
  nx: number // 격자 X좌표
  ny: number // 격자 Y좌표
  lat: number // 위도
  lon: number // 경도
}

export interface RegionData {
  version: string // 데이터 버전
  generatedAt: string // 생성 시각 (ISO 8601)
  regions: Region[]
}
