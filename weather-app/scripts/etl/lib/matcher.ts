/**
 * GeoJSON 매칭 모듈
 * 파싱된 행정구역명을 GeoJSON Feature와 매칭합니다.
 */

import type { ParsedDistrict } from './parser'
import type { GeoJSONCollection, GeoJSONFeature, MatchResult } from './types'

export interface GeoJSONData {
  provinces: GeoJSONCollection
  municipalities: GeoJSONCollection
  submunicipalities: GeoJSONCollection
}

/**
 * 시/도 이름 정규화 (GeoJSON과 korea_districts.json 간 차이 처리)
 */
const normalizeProvinceName = (name: string): string => {
  // GeoJSON에서는 "서울특별시" 대신 "서울"로 저장된 경우가 있음
  const mappings: Record<string, string[]> = {
    서울특별시: ['서울', '서울특별시'],
    부산광역시: ['부산', '부산광역시'],
    대구광역시: ['대구', '대구광역시'],
    인천광역시: ['인천', '인천광역시'],
    광주광역시: ['광주', '광주광역시'],
    대전광역시: ['대전', '대전광역시'],
    울산광역시: ['울산', '울산광역시'],
    세종특별자치시: ['세종', '세종특별자치시'],
    경기도: ['경기', '경기도'],
    강원특별자치도: ['강원', '강원도', '강원특별자치도'],
    충청북도: ['충북', '충청북도'],
    충청남도: ['충남', '충청남도'],
    전북특별자치도: ['전북', '전라북도', '전북특별자치도'],
    전라남도: ['전남', '전라남도'],
    경상북도: ['경북', '경상북도'],
    경상남도: ['경남', '경상남도'],
    제주특별자치도: ['제주', '제주도', '제주특별자치도'],
  }

  for (const [canonical, aliases] of Object.entries(mappings)) {
    if (aliases.includes(name)) {
      return canonical
    }
  }
  return name
}

/**
 * 시/도 Feature 찾기
 */
const findProvinceFeature = (
  provinces: GeoJSONCollection,
  level1: string
): GeoJSONFeature | null => {
  const normalized = normalizeProvinceName(level1)

  return (
    provinces.features.find((f) => {
      const name = f.properties.name
      return name === level1 || name === normalized || normalizeProvinceName(name) === normalized
    }) || null
  )
}

/**
 * 시/군/구 Feature 찾기
 */
const findMunicipalityFeature = (
  municipalities: GeoJSONCollection,
  level1: string,
  level2: string
): GeoJSONFeature | null => {
  const normalizedLevel1 = normalizeProvinceName(level1)

  // 동일 이름의 시/군/구가 여러 시/도에 있을 수 있으므로 상위 행정구역으로 필터링
  const candidates = municipalities.features.filter((f) => {
    const name = f.properties.name
    return name === level2
  })

  if (candidates.length === 0) return null
  if (candidates.length === 1) return candidates[0]

  // 여러 개인 경우 base 속성으로 구분
  const match = candidates.find((f) => {
    const base = f.properties.base
    if (!base) return false
    const normalizedBase = normalizeProvinceName(base)
    return base === level1 || normalizedBase === normalizedLevel1
  })

  return match || null
}

/**
 * base 속성으로 상위 행정구역 매칭하는 헬퍼 함수
 */
const findByBaseDisambiguation = (
  candidates: GeoJSONFeature[],
  level1: string,
  level2: string
): GeoJSONFeature | null => {
  const normalizedLevel1 = normalizeProvinceName(level1)

  const match = candidates.find((f) => {
    const base = f.properties.base
    if (!base) return false

    // base가 "서울특별시 종로구" 형식일 수 있음
    const baseParts = base.split(' ')
    const baseLevel1 = baseParts[0] || ''
    const baseLevel2 = baseParts[1] || ''

    const normalizedBaseLevel1 = normalizeProvinceName(baseLevel1)

    return normalizedBaseLevel1 === normalizedLevel1 && baseLevel2 === level2
  })

  return match ?? null
}

/**
 * "가"로 끝나는 지명에 "동" 접미사 추가 변환 시도
 * 예: "남문로1가" → "남문로1가동"
 */
const tryGaSuffix = (name: string): string | null => {
  // "가"로 끝나고 그 앞에 숫자가 있는 경우 (예: "남문로1가", "종로3가")
  if (/[0-9]가$/.test(name)) {
    return name + '동'
  }
  return null
}

/**
 * 리(里) 단위 여부 확인
 * "리"로 끝나는 지명은 Level 4로 간주
 * 예: "관정리", "낭성면-관정리"
 */
const isRi = (name: string): boolean => {
  return name.endsWith('리')
}

/**
 * Level 4 (리)에서 상위 읍/면 추출
 *
 * korea_districts.json에서 리 단위는 두 가지 형태가 있을 수 있습니다:
 * 1. raw: "충청북도-보은군-속리산면-삼가리" → level3: "삼가리" (parts[3]에 리가 있음)
 * 2. raw: "충청북도-청주시상당구-낭성면-관정리" → level3: "낭성면-관정리" (level3가 "읍면-리" 형태)
 *
 * 이 함수는 raw 문자열에서 상위 읍/면을 추출합니다.
 */
const extractParentEupMyeon = (raw: string, level3: string): string | null => {
  if (!isRi(level3)) return null

  const parts = raw.split('-')

  // Case 1: level3가 "읍면-리" 형태 (예: "낭성면-관정리")
  // 이 경우 level3에서 직접 읍/면 추출
  if (level3.includes('-')) {
    const level3Parts = level3.split('-')
    const potentialEupMyeon = level3Parts[0]
    if (potentialEupMyeon && (potentialEupMyeon.endsWith('읍') || potentialEupMyeon.endsWith('면'))) {
      return potentialEupMyeon
    }
  }

  // Case 2: raw에서 추출 - 구조: 시도-시군구-읍면-리
  // raw: "충청북도-보은군-속리산면-삼가리"
  // parts[2] = "속리산면"
  if (parts.length >= 4) {
    const eupMyeon = parts[2] // 읍/면
    if (eupMyeon && (eupMyeon.endsWith('읍') || eupMyeon.endsWith('면'))) {
      return eupMyeon
    }
  }

  return null
}

/**
 * 읍/면/동 Feature 찾기
 */
const findSubmunicipalityFeature = (
  submunicipalities: GeoJSONCollection,
  level1: string,
  level2: string,
  level3: string
): GeoJSONFeature | null => {
  // 1. 먼저 정확히 일치하는 항목 찾기
  const exactMatches = submunicipalities.features.filter(
    (f) => f.properties.name === level3
  )

  if (exactMatches.length === 1) {
    return exactMatches[0]
  }

  if (exactMatches.length > 1) {
    // 정확 매칭이 여러 개면 base로 disambiguation
    const match = findByBaseDisambiguation(exactMatches, level1, level2)
    if (match) return match
    // disambiguation 실패 시 null 반환 (blind fallback 방지)
    return null
  }

  // 2. "가" 접미사 변환 시도 (예: "남문로1가" → "남문로1가동")
  const gaVariant = tryGaSuffix(level3)
  if (gaVariant) {
    const gaMatches = submunicipalities.features.filter(
      (f) => f.properties.name === gaVariant
    )
    if (gaMatches.length === 1) {
      return gaMatches[0]
    }
    if (gaMatches.length > 1) {
      const match = findByBaseDisambiguation(gaMatches, level1, level2)
      if (match) return match
    }
  }

  // 3. 정확 매칭이 없으면 숫자 제거 후 매칭 시도 (예: "역삼1동" vs "역삼동")
  const level3Stripped = level3.replace(/[0-9]/g, '')
  const strippedCandidates = submunicipalities.features.filter((f) => {
    const name = f.properties.name
    return name.replace(/[0-9]/g, '') === level3Stripped
  })

  if (strippedCandidates.length === 0) return null
  if (strippedCandidates.length === 1) return strippedCandidates[0]

  // 여러 개면 base로 disambiguation
  const match = findByBaseDisambiguation(strippedCandidates, level1, level2)
  if (match) return match

  // disambiguation 실패 시 null 반환 (blind fallback 방지)
  return null
}

/**
 * 행정구역을 GeoJSON Feature와 매칭합니다.
 */
export const matchDistrict = (parsed: ParsedDistrict, geoData: GeoJSONData): MatchResult => {
  const { level1, level2, level3, raw } = parsed

  // level3가 있으면 읍/면/동에서 찾기
  if (level3) {
    const feature = findSubmunicipalityFeature(
      geoData.submunicipalities,
      level1,
      level2,
      level3
    )
    if (feature) {
      return { feature, code: feature.properties.code, matchType: 'exact' }
    }

    // Level 4 (리) 폴백: 상위 읍/면에서 찾기
    // 예: "충청북도-보은군-속리산면-삼가리" → "속리산면"으로 폴백
    const parentEupMyeon = extractParentEupMyeon(raw, level3)
    if (parentEupMyeon) {
      const parentFeature = findSubmunicipalityFeature(
        geoData.submunicipalities,
        level1,
        level2,
        parentEupMyeon
      )
      if (parentFeature) {
        return {
          feature: parentFeature,
          code: parentFeature.properties.code,
          matchType: 'parent',
        }
      }
    }

    // 읍/면/동에서 못 찾으면 시/군/구에서 찾기 (fallback)
    const municipalityFeature = findMunicipalityFeature(geoData.municipalities, level1, level2)
    if (municipalityFeature) {
      return {
        feature: municipalityFeature,
        code: municipalityFeature.properties.code,
        matchType: 'parent',
      }
    }
  }

  // level2가 있으면 시/군/구에서 찾기
  if (level2) {
    const feature = findMunicipalityFeature(geoData.municipalities, level1, level2)
    if (feature) {
      return { feature, code: feature.properties.code, matchType: 'exact' }
    }

    // 시/군/구에서 못 찾으면 시/도에서 찾기 (fallback)
    const provinceFeature = findProvinceFeature(geoData.provinces, level1)
    if (provinceFeature) {
      return {
        feature: provinceFeature,
        code: provinceFeature.properties.code,
        matchType: 'parent',
      }
    }
  }

  // level1만 있으면 시/도에서 찾기
  if (level1) {
    const feature = findProvinceFeature(geoData.provinces, level1)
    if (feature) {
      return { feature, code: feature.properties.code, matchType: 'exact' }
    }
  }

  return { feature: null, code: '', matchType: 'none' }
}
