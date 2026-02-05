/**
 * ETL 파이프라인 검증 스크립트
 *
 * submunicipalities.json의 품질을 검증합니다.
 *
 * 검증 항목:
 * 1. 시도별 Feature 수 확인
 * 2. korea_districts.json Level 3 매칭률 계산
 * 3. 좌표 범위 검증 (한반도 범위)
 * 4. base 속성 형식 검증
 *
 * 사용법:
 *   npx tsx scripts/etl/validatePipeline.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import type { GeoJSONCollection, GeoJSONFeature } from './lib/types'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 경로 설정
const DATA_DIR = path.join(__dirname, '../data')
const SUBMUNICIPALITIES_PATH = path.join(DATA_DIR, 'submunicipalities.json')
const KOREA_DISTRICTS_PATH = path.join(__dirname, '../../korea_districts.json')

// 시도 코드 → 시도명
const PROVINCE_NAMES: Record<string, string> = {
  '11': '서울특별시',
  '26': '부산광역시',
  '27': '대구광역시',
  '28': '인천광역시',
  '29': '광주광역시',
  '30': '대전광역시',
  '31': '울산광역시',
  '36': '세종특별자치시',
  '41': '경기도',
  '43': '충청북도',
  '44': '충청남도',
  '46': '전라남도',
  '47': '경상북도',
  '48': '경상남도',
  '50': '제주특별자치도',
  '51': '강원특별자치도',
  '52': '전북특별자치도',
}

// 예상 Feature 수 범위
const EXPECTED_COUNTS: Record<string, [number, number]> = {
  '11': [400, 550], // 서울특별시
  '26': [180, 260], // 부산광역시
  '27': [140, 220], // 대구광역시
  '28': [140, 220], // 인천광역시
  '29': [80, 130], // 광주광역시
  '30': [70, 120], // 대전광역시
  '31': [60, 100], // 울산광역시
  '36': [30, 70], // 세종특별자치시
  '41': [500, 700], // 경기도
  '43': [140, 220], // 충청북도
  '44': [180, 260], // 충청남도
  '46': [300, 400], // 전라남도
  '47': [350, 450], // 경상북도
  '48': [300, 400], // 경상남도
  '50': [30, 80], // 제주특별자치도
  '51': [160, 240], // 강원특별자치도
  '52': [200, 300], // 전북특별자치도
}

// 한반도 좌표 범위
const KOREA_BOUNDS = {
  lat: { min: 33, max: 43 },
  lon: { min: 124, max: 132 },
}

interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  stats: {
    totalFeatures: number
    byProvince: Record<string, number>
    matchRate: number
    coordErrors: number
    baseErrors: number
  }
}

/**
 * Feature에서 좌표 추출 (첫 번째 좌표)
 */
const getFirstCoordinate = (feature: GeoJSONFeature): [number, number] | null => {
  const geo = feature.geometry
  if (geo.type === 'Polygon' && geo.coordinates[0]?.[0]) {
    return geo.coordinates[0][0] as [number, number]
  }
  if (geo.type === 'MultiPolygon' && geo.coordinates[0]?.[0]?.[0]) {
    return geo.coordinates[0][0][0] as [number, number]
  }
  return null
}

/**
 * korea_districts.json에서 Level 3 (읍면동) 패턴 추출
 */
const loadLevel3Patterns = (): Set<string> => {
  const districts = JSON.parse(fs.readFileSync(KOREA_DISTRICTS_PATH, 'utf-8')) as string[]
  const level3 = new Set<string>()

  for (const entry of districts) {
    const parts = entry.split('-')
    if (parts.length === 3) {
      level3.add(entry)
    }
  }

  return level3
}

/**
 * Feature의 전체 주소 패턴 생성
 */
const getFeaturePattern = (feature: GeoJSONFeature): string | null => {
  const { base, name, code } = feature.properties
  if (!base || !name) return null

  const provinceCode = code?.substring(0, 2) || ''

  // 세종특별자치시는 단일 레벨 (base에 공백 없음)
  if (provinceCode === '36' && !base.includes(' ')) {
    return `${base}-${base}-${name}`
  }

  // base: "충청북도 청주시상당구" → "충청북도-청주시상당구"
  const parts = base.split(' ')
  if (parts.length < 2) return null

  const province = parts[0]
  const city = parts.slice(1).join('')

  return `${province}-${city}-${name}`
}

/**
 * 검증 실행
 */
const validate = (): ValidationResult => {
  const errors: string[] = []
  const warnings: string[] = []

  // 파일 존재 확인
  if (!fs.existsSync(SUBMUNICIPALITIES_PATH)) {
    return {
      isValid: false,
      errors: ['submunicipalities.json 파일이 없습니다.'],
      warnings: [],
      stats: { totalFeatures: 0, byProvince: {}, matchRate: 0, coordErrors: 0, baseErrors: 0 },
    }
  }

  // 데이터 로드
  const data = JSON.parse(fs.readFileSync(SUBMUNICIPALITIES_PATH, 'utf-8')) as GeoJSONCollection
  const level3Patterns = loadLevel3Patterns()

  const totalFeatures = data.features.length
  const byProvince: Record<string, number> = {}
  let coordErrors = 0
  let baseErrors = 0
  let matchedCount = 0

  // Feature별 검증
  for (const feature of data.features) {
    const code = feature.properties.code
    const provinceCode = code?.substring(0, 2) || 'unknown'

    // 시도별 카운트
    byProvince[provinceCode] = (byProvince[provinceCode] || 0) + 1

    // 좌표 범위 검증
    const coord = getFirstCoordinate(feature)
    if (coord) {
      const [lon, lat] = coord
      if (
        lat < KOREA_BOUNDS.lat.min ||
        lat > KOREA_BOUNDS.lat.max ||
        lon < KOREA_BOUNDS.lon.min ||
        lon > KOREA_BOUNDS.lon.max
      ) {
        coordErrors++
      }
    }

    // base 속성 검증
    const { base, name } = feature.properties
    if (!base || !name) {
      baseErrors++
    } else if (!base.includes(' ') && provinceCode !== '36') {
      // 세종특별자치시(36)는 단일 레벨이므로 공백 불필요
      baseErrors++
    }

    // korea_districts.json 매칭
    const pattern = getFeaturePattern(feature)
    if (pattern && level3Patterns.has(pattern)) {
      matchedCount++
    }
  }

  // 시도별 Feature 수 검증
  for (const [code, count] of Object.entries(byProvince)) {
    const expected = EXPECTED_COUNTS[code]
    const name = PROVINCE_NAMES[code] || code

    if (expected) {
      if (count < expected[0]) {
        warnings.push(`${name}(${code}): ${count}개 (예상 최소 ${expected[0]}개 미만)`)
      } else if (count > expected[1]) {
        warnings.push(`${name}(${code}): ${count}개 (예상 최대 ${expected[1]}개 초과)`)
      }
    }
  }

  // 좌표 오류 검증
  if (coordErrors > 0) {
    const rate = ((coordErrors / totalFeatures) * 100).toFixed(2)
    if (coordErrors > totalFeatures * 0.01) {
      errors.push(`좌표 범위 오류: ${coordErrors}개 (${rate}%)`)
    } else {
      warnings.push(`좌표 범위 오류: ${coordErrors}개 (${rate}%)`)
    }
  }

  // base 속성 오류 검증
  if (baseErrors > 0) {
    const rate = ((baseErrors / totalFeatures) * 100).toFixed(2)
    if (baseErrors > totalFeatures * 0.01) {
      errors.push(`base 속성 오류: ${baseErrors}개 (${rate}%)`)
    } else {
      warnings.push(`base 속성 오류: ${baseErrors}개 (${rate}%)`)
    }
  }

  // 매칭률 계산
  const matchRate = (matchedCount / totalFeatures) * 100

  // 매칭률 검증 (목표: 95%+)
  if (matchRate < 90) {
    errors.push(`korea_districts.json 매칭률: ${matchRate.toFixed(1)}% (목표: 95%+)`)
  } else if (matchRate < 95) {
    warnings.push(`korea_districts.json 매칭률: ${matchRate.toFixed(1)}% (목표: 95%+)`)
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    stats: {
      totalFeatures,
      byProvince,
      matchRate,
      coordErrors,
      baseErrors,
    },
  }
}

/**
 * 메인 실행
 */
const main = () => {
  console.log('🔍 ETL 파이프라인 검증 시작')
  console.log('=' .repeat(50))

  const result = validate()

  // 시도별 통계 출력
  console.log('\n📊 시도별 Feature 수:')
  const sortedProvinces = Object.entries(result.stats.byProvince).sort(([a], [b]) => a.localeCompare(b))

  for (const [code, count] of sortedProvinces) {
    const name = PROVINCE_NAMES[code] || code
    const expected = EXPECTED_COUNTS[code]
    const status = expected
      ? count >= expected[0] && count <= expected[1]
        ? '✅'
        : '⚠️'
      : '❓'
    console.log(`  ${status} ${name.padEnd(10)} (${code}): ${count}개`)
  }

  console.log('-'.repeat(50))
  console.log(`  전체: ${result.stats.totalFeatures}개`)

  // 매칭률 출력
  console.log(`\n📈 korea_districts.json 매칭률: ${result.stats.matchRate.toFixed(1)}%`)

  // 오류 출력
  if (result.errors.length > 0) {
    console.log('\n❌ 오류:')
    for (const error of result.errors) {
      console.log(`  - ${error}`)
    }
  }

  // 경고 출력
  if (result.warnings.length > 0) {
    console.log('\n⚠️ 경고:')
    for (const warning of result.warnings) {
      console.log(`  - ${warning}`)
    }
  }

  // 최종 결과
  console.log('\n' + '=' .repeat(50))
  if (result.isValid) {
    console.log('✅ 검증 통과!')
  } else {
    console.log('❌ 검증 실패 - 위 오류를 확인하세요.')
    process.exit(1)
  }
}

main()
