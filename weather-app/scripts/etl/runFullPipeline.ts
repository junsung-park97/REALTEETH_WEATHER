/**
 * 전국 법정동 ETL 파이프라인 실행 스크립트
 *
 * 16개 시도 SHP 파일을 순차적으로 처리하여 submunicipalities.json을 업데이트합니다.
 *
 * 파이프라인:
 * 1. GDAL 변환 (SHP → GeoJSON, WGS84)
 * 2. 속성 변환 (EMD_CD/EMD_NM → code/name/base)
 * 3. korea_districts.json과 매칭 검증
 * 4. submunicipalities.json 병합
 *
 * 사용법:
 *   npx tsx scripts/etl/runFullPipeline.ts
 *   npx tsx scripts/etl/runFullPipeline.ts --province 43  # 특정 시도만
 *   npx tsx scripts/etl/runFullPipeline.ts --dry-run      # 테스트 모드
 */

import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'
import { getSggInfoByEmdCode } from './transform/sggCodeMap'
import type { GeoJSONCollection, GeoJSONFeature, GeoJSONGeometry } from './lib/types'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 경로 설정
const DATA_DIR = path.join(__dirname, '../data')
const SHP_BASE_DIR = path.join(DATA_DIR, 'LSMD_ADM_SECT_UMD_전국')
const CONVERTED_DIR = path.join(DATA_DIR, 'converted')
const SUBMUNICIPALITIES_PATH = path.join(DATA_DIR, 'submunicipalities.json')
const KOREA_DISTRICTS_PATH = path.join(__dirname, '../../korea_districts.json')

// 시도 설정
interface ProvinceConfig {
  code: string
  name: string
  dir: string
}

const PROVINCES: ProvinceConfig[] = [
  { code: '11', name: '서울특별시', dir: 'LSMD_ADM_SECT_UMD_서울' },
  { code: '26', name: '부산광역시', dir: 'LSMD_ADM_SECT_UMD_부산' },
  { code: '27', name: '대구광역시', dir: 'LSMD_ADM_SECT_UMD_대구' },
  { code: '28', name: '인천광역시', dir: 'LSMD_ADM_SECT_UMD_인천' },
  { code: '29', name: '광주광역시', dir: 'LSMD_ADM_SECT_UMD_광주' },
  { code: '30', name: '대전광역시', dir: 'LSMD_ADM_SECT_UMD_대전' },
  { code: '31', name: '울산광역시', dir: 'LSMD_ADM_SECT_UMD_울산' },
  { code: '36', name: '세종특별자치시', dir: 'LSMD_ADM_SECT_UMD_세종' },
  { code: '41', name: '경기도', dir: 'LSMD_ADM_SECT_UMD_경기' },
  { code: '43', name: '충청북도', dir: 'LSMD_ADM_SECT_UMD_충북' },
  { code: '44', name: '충청남도', dir: 'LSMD_ADM_SECT_UMD_충남' },
  { code: '46', name: '전라남도', dir: 'LSMD_ADM_SECT_UMD_전남' },
  { code: '47', name: '경상북도', dir: 'LSMD_ADM_SECT_UMD_경북' },
  { code: '48', name: '경상남도', dir: 'LSMD_ADM_SECT_UMD_경남' },
  { code: '50', name: '제주특별자치도', dir: 'LSMD_ADM_SECT_UMD_제주' },
  { code: '51', name: '강원특별자치도', dir: 'LSMD_ADM_SECT_UMD_강원특별자치도' },
  { code: '52', name: '전북특별자치도', dir: 'LSMD_ADM_SECT_UMD_전북특별자치도' },
]

// GDAL Feature 타입
interface GdalFeature {
  type: 'Feature'
  properties: {
    EMD_CD: string
    EMD_NM: string
    COL_ADM_SE: string
    SGG_OID?: number
  }
  geometry: GeoJSONGeometry
}

interface GdalCollection {
  type: 'FeatureCollection'
  name?: string
  crs?: unknown
  features: GdalFeature[]
}

// 처리 결과 타입
interface ProcessResult {
  provinceCode: string
  provinceName: string
  inputCount: number
  outputCount: number
  matchedCount: number
  unmatchedCount: number
  unmatchedSamples: string[]
}

/**
 * korea_districts.json에서 전체 주소 패턴 Set 생성
 */
const loadDistrictPatterns = (): Set<string> => {
  const districts = JSON.parse(fs.readFileSync(KOREA_DISTRICTS_PATH, 'utf-8')) as string[]
  return new Set(districts)
}

/**
 * SHP → GeoJSON 변환 (GDAL)
 * 한글 인코딩 문제 해결을 위해 ENCODING=CP949 옵션 사용
 */
const convertShpToGeoJson = (shpPath: string, outputPath: string): boolean => {
  try {
    // SHP 파일의 DBF 인코딩이 CP949(EUC-KR)이므로 명시적으로 지정
    execSync(
      `ogr2ogr -f GeoJSON -t_srs EPSG:4326 -lco ENCODING=UTF-8 "${outputPath}" "${shpPath}" -oo ENCODING=CP949`,
      {
        encoding: 'utf-8',
        stdio: 'pipe',
      }
    )
    return true
  } catch {
    return false
  }
}

/**
 * SHP 파일 경로 찾기
 */
const findShpFile = (provinceDir: string): string | null => {
  const dirPath = path.join(SHP_BASE_DIR, provinceDir)
  if (!fs.existsSync(dirPath)) return null

  const files = fs.readdirSync(dirPath)
  const shpFile = files.find((f) => f.endsWith('.shp'))
  return shpFile ? path.join(dirPath, shpFile) : null
}

/**
 * Feature 변환 및 검증
 */
const transformAndValidate = (
  feature: GdalFeature,
  districtPatterns: Set<string>
): { feature: GeoJSONFeature | null; matched: boolean; pattern: string } => {
  const { EMD_CD, EMD_NM } = feature.properties

  if (!EMD_CD || !EMD_NM) {
    return { feature: null, matched: false, pattern: '' }
  }

  // 시군구 정보 조회
  const sggInfo = getSggInfoByEmdCode(EMD_CD)
  if (!sggInfo) {
    return { feature: null, matched: false, pattern: `[NO_SGG] ${EMD_CD}` }
  }

  // 전체 주소 패턴 생성
  const pattern = `${sggInfo.province}-${sggInfo.city}-${EMD_NM}`

  // korea_districts.json에서 검증
  const matched = districtPatterns.has(pattern)

  // Feature 생성 (매칭 여부와 관계없이 생성)
  const transformedFeature: GeoJSONFeature = {
    type: 'Feature',
    properties: {
      code: EMD_CD,
      name: EMD_NM,
      base: `${sggInfo.province} ${sggInfo.city}`,
    },
    geometry: feature.geometry,
  }

  return { feature: transformedFeature, matched, pattern }
}

/**
 * 시도별 처리
 */
const processProvince = (
  province: ProvinceConfig,
  districtPatterns: Set<string>,
  dryRun: boolean
): ProcessResult | null => {
  console.log(`\n📍 [${province.code}] ${province.name}`)

  // SHP 파일 찾기
  const shpPath = findShpFile(province.dir)
  if (!shpPath) {
    console.log(`   ⚠️ SHP 파일 없음: ${province.dir}`)
    return null
  }

  // GeoJSON 변환
  const wgs84Path = path.join(CONVERTED_DIR, `${province.code}_wgs84.json`)
  console.log(`   1. GDAL 변환 중...`)

  if (!fs.existsSync(wgs84Path)) {
    if (!convertShpToGeoJson(shpPath, wgs84Path)) {
      console.log(`   ❌ GDAL 변환 실패`)
      return null
    }
  } else {
    console.log(`      (캐시 사용)`)
  }

  // GeoJSON 로드
  const gdalData = JSON.parse(fs.readFileSync(wgs84Path, 'utf-8')) as GdalCollection
  console.log(`   2. 입력: ${gdalData.features.length}개 Feature`)

  // 변환 및 검증
  const transformedFeatures: GeoJSONFeature[] = []
  let matchedCount = 0
  let unmatchedCount = 0
  const unmatchedSamples: string[] = []

  for (const feature of gdalData.features) {
    const result = transformAndValidate(feature, districtPatterns)

    if (result.feature) {
      transformedFeatures.push(result.feature)

      if (result.matched) {
        matchedCount++
      } else {
        unmatchedCount++
        if (unmatchedSamples.length < 5) {
          unmatchedSamples.push(result.pattern)
        }
      }
    }
  }

  const total = matchedCount + unmatchedCount
  const matchRate = total === 0 ? '0.0' : ((matchedCount / total) * 100).toFixed(1)
  console.log(`   3. 변환: ${transformedFeatures.length}개 (매칭률: ${matchRate}%)`)

  if (unmatchedSamples.length > 0) {
    console.log(`      미매칭 샘플: ${unmatchedSamples.slice(0, 3).join(', ')}`)
  }

  // 변환된 파일 저장
  const convertedPath = path.join(CONVERTED_DIR, `${province.code}_converted.json`)
  if (!dryRun) {
    const output: GeoJSONCollection = {
      type: 'FeatureCollection',
      features: transformedFeatures,
    }
    fs.writeFileSync(convertedPath, JSON.stringify(output), 'utf-8')
  }

  return {
    provinceCode: province.code,
    provinceName: province.name,
    inputCount: gdalData.features.length,
    outputCount: transformedFeatures.length,
    matchedCount,
    unmatchedCount,
    unmatchedSamples,
  }
}

/**
 * submunicipalities.json 전체 교체
 */
const replaceSubmunicipalities = (results: ProcessResult[], dryRun: boolean): void => {
  console.log('\n📦 submunicipalities.json 생성 중...')

  const allFeatures: GeoJSONFeature[] = []

  for (const result of results) {
    const convertedPath = path.join(CONVERTED_DIR, `${result.provinceCode}_converted.json`)
    if (fs.existsSync(convertedPath)) {
      const data = JSON.parse(fs.readFileSync(convertedPath, 'utf-8')) as GeoJSONCollection
      allFeatures.push(...data.features)
    }
  }

  console.log(`   총 Feature 수: ${allFeatures.length}개`)

  if (!dryRun) {
    const output: GeoJSONCollection = {
      type: 'FeatureCollection',
      features: allFeatures,
    }
    fs.writeFileSync(SUBMUNICIPALITIES_PATH, JSON.stringify(output), 'utf-8')
    console.log(`   ✅ 저장 완료: ${SUBMUNICIPALITIES_PATH}`)
  } else {
    console.log(`   🔍 Dry-run 모드: 저장 건너뜀`)
  }
}

/**
 * 명령줄 인수 파싱
 */
const parseArgs = (): { provinces: ProvinceConfig[]; dryRun: boolean } => {
  const args = process.argv.slice(2)
  let dryRun = false
  let targetProvince: string | null = null

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dry-run') {
      dryRun = true
    } else if (args[i] === '--province' && args[i + 1]) {
      targetProvince = args[i + 1]
      i++
    }
  }

  const provinces = targetProvince
    ? PROVINCES.filter((p) => p.code === targetProvince)
    : PROVINCES

  return { provinces, dryRun }
}

/**
 * 메인 실행
 */
const main = async () => {
  console.log('🚀 전국 법정동 ETL 파이프라인 시작')
  console.log('=' .repeat(50))

  const { provinces, dryRun } = parseArgs()

  if (dryRun) {
    console.log('🔍 Dry-run 모드: 실제 저장 없이 테스트')
  }

  // 출력 디렉토리 생성
  if (!fs.existsSync(CONVERTED_DIR)) {
    fs.mkdirSync(CONVERTED_DIR, { recursive: true })
  }

  // korea_districts.json 로드
  console.log('\n📚 korea_districts.json 로드 중...')
  const districtPatterns = loadDistrictPatterns()
  console.log(`   ${districtPatterns.size}개 패턴 로드 완료`)

  // 시도별 처리
  const results: ProcessResult[] = []
  for (const province of provinces) {
    const result = processProvince(province, districtPatterns, dryRun)
    if (result) {
      results.push(result)
    }
  }

  // submunicipalities.json 교체
  if (results.length > 0) {
    replaceSubmunicipalities(results, dryRun)
  }

  // 결과 요약
  console.log('\n' + '=' .repeat(50))
  console.log('📊 처리 결과 요약')
  console.log('=' .repeat(50))

  let totalInput = 0
  let totalOutput = 0
  let totalMatched = 0
  let totalUnmatched = 0

  for (const result of results) {
    totalInput += result.inputCount
    totalOutput += result.outputCount
    totalMatched += result.matchedCount
    totalUnmatched += result.unmatchedCount

    const resultTotal = result.matchedCount + result.unmatchedCount
    const rate = resultTotal === 0 ? '0.0' : ((result.matchedCount / resultTotal) * 100).toFixed(1)
    console.log(`  ${result.provinceName.padEnd(10)} : ${result.outputCount}개 (${rate}%)`)
  }

  console.log('-'.repeat(50))
  const overallTotal = totalMatched + totalUnmatched
  const totalRate = overallTotal === 0 ? '0.0' : ((totalMatched / overallTotal) * 100).toFixed(1)
  console.log(`  전체         : ${totalOutput}개 (매칭률: ${totalRate}%)`)
  console.log('')

  if (!dryRun) {
    console.log('✅ ETL 파이프라인 완료!')
    console.log('   다음 명령어로 regions.json을 재생성하세요:')
    console.log('   npm run etl:generate')
  }
}

main().catch((err) => {
  console.error('❌ 오류 발생:', err)
  process.exit(1)
})
