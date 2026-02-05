/**
 * 행정구역명 파싱 모듈
 * "서울특별시-종로구-청운동" 형식을 { level1, level2, level3 }으로 변환
 */

export interface ParsedDistrict {
  level1: string // 시/도
  level2: string // 시/군/구
  level3: string // 읍/면/동
  raw: string // 원본 문자열
}

/**
 * 행정구역 문자열을 파싱합니다.
 * @param district "서울특별시-종로구-청운동" 형식의 문자열
 */
export const parseDistrict = (district: string): ParsedDistrict => {
  const parts = district.split('-')

  return {
    level1: parts[0] || '',
    level2: parts[1] || '',
    level3: parts.slice(2).join('-'),
    raw: district,
  }
}

/**
 * korea_districts.json 전체를 파싱합니다.
 */
export const parseAllDistricts = (districts: string[]): ParsedDistrict[] => {
  return districts.map(parseDistrict)
}

/**
 * 파싱된 지역의 레벨을 반환합니다.
 * 1 = 시/도만, 2 = 시/군/구까지, 3 = 읍/면/동까지
 */
export const getDistrictLevel = (parsed: ParsedDistrict): 1 | 2 | 3 => {
  if (parsed.level3) return 3
  if (parsed.level2) return 2
  return 1
}

/**
 * 전체 주소를 반환합니다.
 */
export const getFullAddress = (parsed: ParsedDistrict): string => {
  const parts = [parsed.level1, parsed.level2, parsed.level3].filter(Boolean)
  return parts.join(' ')
}
