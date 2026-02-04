/**
 * 행정구역 ETL 파이프라인 메인 스크립트
 *
 * korea_districts.json → GeoJSON 매칭 → 중심좌표 계산 → 격자좌표 변환
 *
 * 실행: npm run etl:generate
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

import { parseDistrict, getDistrictLevel, type ParsedDistrict } from './parser'
import { matchDistrict, type GeoJSONData } from './matcher'
import { calculateCentroid, isValidKoreaCoordinate } from './centroid'
import { latLonToGrid } from '../../src/shared/lib/gridConverter'
import type { GeoJSONCollection } from './types'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 경로 설정
const KOREA_DISTRICTS_PATH = join(__dirname, '../../korea_districts.json')
const DATA_DIR = join(__dirname, '../data')
const OUTPUT_PATH = join(__dirname, '../../src/shared/data/regions.json')

// 출력 타입
interface RegionOutput {
  code: string
  level1: string
  level2: string
  level3: string
  lat: number
  lon: number
  nx: number
  ny: number
}

interface OutputJSON {
  version: string
  generatedAt: string
  regions: RegionOutput[]
}

interface ProcessingStats {
  total: number
  matched: number
  parentMatch: number
  failed: number
  failedItems: string[]
}

/**
 * GeoJSON 파일들을 로드합니다.
 */
const loadGeoJSONData = (): GeoJSONData => {
  const files = ['provinces.json', 'municipalities.json', 'submunicipalities.json']

  for (const file of files) {
    const path = join(DATA_DIR, file)
    if (!existsSync(path)) {
      console.error(`❌ GeoJSON 파일을 찾을 수 없습니다: ${path}`)
      console.error('   먼저 npm run etl:download 를 실행하세요.')
      process.exit(1)
    }
  }

  console.log('📂 GeoJSON 데이터 로드 중...')

  const provinces = JSON.parse(
    readFileSync(join(DATA_DIR, 'provinces.json'), 'utf-8')
  ) as GeoJSONCollection

  const municipalities = JSON.parse(
    readFileSync(join(DATA_DIR, 'municipalities.json'), 'utf-8')
  ) as GeoJSONCollection

  const submunicipalities = JSON.parse(
    readFileSync(join(DATA_DIR, 'submunicipalities.json'), 'utf-8')
  ) as GeoJSONCollection

  console.log(`   - 시/도: ${provinces.features.length}개`)
  console.log(`   - 시/군/구: ${municipalities.features.length}개`)
  console.log(`   - 읍/면/동: ${submunicipalities.features.length}개`)

  return { provinces, municipalities, submunicipalities }
}

// 사용된 코드 추적을 위한 Set
const usedCodes = new Set<string>()

/**
 * 고유 코드를 생성합니다.
 * 중복 시 suffix를 추가하여 고유성 보장
 */
const generateUniqueCode = (baseCode: string, parsed: ParsedDistrict): string => {
  // 기본 코드로 시도
  if (!usedCodes.has(baseCode)) {
    usedCodes.add(baseCode)
    return baseCode
  }

  // 중복 시 suffix 추가
  let suffix = 1
  let uniqueCode = `${baseCode}_${suffix}`
  while (usedCodes.has(uniqueCode)) {
    suffix++
    uniqueCode = `${baseCode}_${suffix}`
  }
  usedCodes.add(uniqueCode)
  return uniqueCode
}

/**
 * 단일 행정구역을 처리합니다.
 */
const processDistrict = (
  parsed: ParsedDistrict,
  geoData: GeoJSONData
): { region: RegionOutput | null; matchType: 'exact' | 'parent' | 'none' } => {
  const matchResult = matchDistrict(parsed, geoData)

  if (!matchResult.feature) {
    return { region: null, matchType: 'none' }
  }

  const centroid = calculateCentroid(matchResult.feature.geometry)

  if (!isValidKoreaCoordinate(centroid.lat, centroid.lon)) {
    const featureName = matchResult.feature.properties?.name ?? 'unknown'
    const featureBase = matchResult.feature.properties?.base ?? 'unknown'
    console.warn(`⚠️  좌표 범위 오류:`)
    console.warn(`   입력: ${parsed.raw}`)
    console.warn(`   매칭된 Feature: ${featureName} (base: ${featureBase})`)
    console.warn(`   매칭 타입: ${matchResult.matchType}`)
    console.warn(`   좌표: lat=${centroid.lat}, lon=${centroid.lon}`)
    console.warn(`   유효 범위: lat=33~43, lon=124~132`)
    console.warn('')
    return { region: null, matchType: 'none' }
  }

  const grid = latLonToGrid(centroid.lat, centroid.lon)

  // 고유 코드 생성
  const baseCode = matchResult.code
  const uniqueCode = generateUniqueCode(baseCode, parsed)

  return {
    region: {
      code: uniqueCode,
      level1: parsed.level1,
      level2: parsed.level2,
      level3: parsed.level3,
      lat: centroid.lat,
      lon: centroid.lon,
      nx: grid.nx,
      ny: grid.ny,
    },
    matchType: matchResult.matchType,
  }
}

/**
 * 메인 ETL 실행
 */
const main = async (): Promise<void> => {
  console.log('🚀 행정구역 ETL 파이프라인 시작\n')

  // 1. 입력 데이터 로드
  console.log('📂 korea_districts.json 로드 중...')
  const districtsRaw = readFileSync(KOREA_DISTRICTS_PATH, 'utf-8')
  const districts: string[] = JSON.parse(districtsRaw)
  console.log(`   - 총 ${districts.length}개 항목\n`)

  // 2. GeoJSON 데이터 로드
  const geoData = loadGeoJSONData()
  console.log('')

  // 3. ETL 처리
  console.log('🔄 ETL 처리 중...')
  const stats: ProcessingStats = {
    total: districts.length,
    matched: 0,
    parentMatch: 0,
    failed: 0,
    failedItems: [],
  }

  const regions: RegionOutput[] = []

  for (const district of districts) {
    const parsed = parseDistrict(district)
    const { region, matchType } = processDistrict(parsed, geoData)

    if (region) {
      regions.push(region)
      if (matchType === 'exact') {
        stats.matched++
      } else {
        stats.parentMatch++
      }
    } else {
      stats.failed++
      stats.failedItems.push(district)
    }
  }

  // 4. 결과 저장
  console.log('\n💾 결과 저장 중...')
  const output: OutputJSON = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    regions,
  }

  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf-8')
  console.log(`   - 저장 완료: ${OUTPUT_PATH}`)

  // 5. 통계 출력
  console.log('\n📊 처리 결과:')
  console.log(`   - 전체: ${stats.total}개`)
  console.log(`   - 정확 매칭: ${stats.matched}개 (${((stats.matched / stats.total) * 100).toFixed(1)}%)`)
  console.log(`   - 상위 구역 매칭: ${stats.parentMatch}개 (${((stats.parentMatch / stats.total) * 100).toFixed(1)}%)`)
  console.log(`   - 매칭 실패: ${stats.failed}개 (${((stats.failed / stats.total) * 100).toFixed(1)}%)`)

  if (stats.failedItems.length > 0) {
    console.log('\n⚠️  매칭 실패 항목:')
    stats.failedItems.slice(0, 20).forEach((item) => {
      console.log(`   - ${item}`)
    })
    if (stats.failedItems.length > 20) {
      console.log(`   ... 외 ${stats.failedItems.length - 20}개`)
    }
  }

  console.log('\n✨ ETL 완료!')
}

main().catch((error) => {
  console.error('❌ ETL 실패:', error)
  process.exit(1)
})
