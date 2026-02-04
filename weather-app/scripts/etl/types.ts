/**
 * ETL 파이프라인 타입 정의
 */

// GeoJSON Feature 타입
export interface GeoJSONFeature {
  type: 'Feature'
  properties: {
    code: string
    name: string
    name_eng?: string
    base?: string // 상위 행정구역 (municipalities/submunicipalities)
  }
  geometry: GeoJSONGeometry
}

export type GeoJSONGeometry = PolygonGeometry | MultiPolygonGeometry

export interface PolygonGeometry {
  type: 'Polygon'
  coordinates: number[][][] // [ring][point][lng, lat]
}

export interface MultiPolygonGeometry {
  type: 'MultiPolygon'
  coordinates: number[][][][] // [polygon][ring][point][lng, lat]
}

export interface GeoJSONCollection {
  type: 'FeatureCollection'
  features: GeoJSONFeature[]
}

// 매칭 결과 타입
export interface MatchResult {
  feature: GeoJSONFeature | null
  code: string
  matchType: 'exact' | 'parent' | 'none'
}
