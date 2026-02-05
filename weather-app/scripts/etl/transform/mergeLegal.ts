/**
 * 법정동 GeoJSON 병합 스크립트
 *
 * 변환된 법정동 GeoJSON을 기존 submunicipalities.json에 병합합니다.
 * 시도별로 점진적 업데이트를 지원합니다.
 *
 * 동작:
 * 1. 기존 submunicipalities.json 로드
 * 2. 변환된 법정동 GeoJSON 로드
 * 3. 기존 데이터에서 해당 시도의 Feature 제거 (코드 앞 2자리로 필터링)
 * 4. 새 법정동 데이터 추가
 * 5. 병합된 submunicipalities.json 저장
 *
 * 사용법:
 *   npx tsx scripts/etl/mergeLegal.ts <converted.json> [--province <code>]
 *
 * 예시:
 *   npx tsx scripts/etl/mergeLegal.ts scripts/data/chungbuk_wgs84_converted.json --province 43
 *
 * 옵션:
 *   --province <code>  시도 코드 (예: 43 = 충북). 미지정시 입력 파일에서 추출
 *   --dry-run          실제 저장 없이 결과만 출력
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import type { GeoJSONCollection, GeoJSONFeature } from '../lib/types'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const SUBMUNICIPALITIES_PATH = path.join(__dirname, '../../data/submunicipalities.json')

interface MergeOptions {
  provinceCode?: string
  dryRun?: boolean
}

interface MergeResult {
  originalCount: number
  removedCount: number
  addedCount: number
  finalCount: number
}

/**
 * Feature의 시도 코드 추출 (code 속성의 앞 2자리)
 */
const getProvinceCodeFromFeature = (feature: GeoJSONFeature): string => {
  const code = feature.properties.code
  return code ? code.substring(0, 2) : ''
}

/**
 * 입력 파일에서 시도 코드 자동 추출
 */
const detectProvinceCode = (features: GeoJSONFeature[]): string | null => {
  const codes = new Set<string>()

  for (const feature of features) {
    const code = getProvinceCodeFromFeature(feature)
    if (code) {
      codes.add(code)
    }
  }

  if (codes.size === 0) {
    return null
  }

  if (codes.size > 1) {
    const codeList = Array.from(codes).sort().join(', ')
    console.error(`❌ 입력 파일에 여러 시도 코드가 포함되어 있습니다: [${codeList}]`)
    console.error('   이 파일은 혼합된 시도 데이터를 포함하고 있어 자동 감지가 불가능합니다.')
    console.error('   --province 옵션으로 특정 시도 코드를 명시적으로 지정하세요.')
    console.error('')
    console.error('   사용법: npx tsx scripts/etl/mergeLegal.ts <file> --province <code>')
    console.error(`   예시: npx tsx scripts/etl/mergeLegal.ts <file> --province ${Array.from(codes)[0]}`)
    process.exit(1)
  }

  return Array.from(codes)[0]
}

/**
 * submunicipalities.json 병합
 */
const mergeSubmunicipalities = (
  newFeatures: GeoJSONFeature[],
  provinceCode: string,
  options: MergeOptions = {}
): MergeResult => {
  // 기존 데이터 로드
  if (!fs.existsSync(SUBMUNICIPALITIES_PATH)) {
    console.error(`❌ 기존 파일을 찾을 수 없습니다: ${SUBMUNICIPALITIES_PATH}`)
    process.exit(1)
  }

  const existing = JSON.parse(fs.readFileSync(SUBMUNICIPALITIES_PATH, 'utf-8')) as GeoJSONCollection
  const originalCount = existing.features.length

  console.log(`\n📊 기존 submunicipalities.json: ${originalCount}개 Feature`)

  // 해당 시도의 기존 Feature 제거
  const filteredFeatures = existing.features.filter((f) => {
    const code = getProvinceCodeFromFeature(f)
    return code !== provinceCode
  })
  const removedCount = originalCount - filteredFeatures.length

  console.log(`  - 시도 코드 ${provinceCode} 제거: ${removedCount}개`)

  // 새 법정동 데이터 검증
  console.log(`\n🔍 새 법정동 데이터 검증 중...`)
  const invalidFeatures: Array<{ code: string; expected: string; index: number }> = []
  
  for (let i = 0; i < newFeatures.length; i++) {
    const feature = newFeatures[i]
    const featureProvinceCode = getProvinceCodeFromFeature(feature)
    
    if (featureProvinceCode !== provinceCode) {
      invalidFeatures.push({
        code: featureProvinceCode,
        expected: provinceCode,
        index: i,
      })
    }
  }

  if (invalidFeatures.length > 0) {
    console.error(`\n❌ 검증 실패: 잘못된 시도 코드를 가진 Feature가 발견되었습니다.`)
    console.error(`   예상 시도 코드: ${provinceCode}`)
    console.error(`   잘못된 Feature 수: ${invalidFeatures.length}개 / ${newFeatures.length}개`)
    console.error(`\n   샘플 (최대 5개):`)
    
    invalidFeatures.slice(0, 5).forEach((invalid) => {
      const feature = newFeatures[invalid.index]
      const featureCode = feature.properties.code || 'NO_CODE'
      const featureName = feature.properties.name || 'NO_NAME'
      console.error(`     - [${invalid.index}] code=${featureCode} (시도: ${invalid.code}, 예상: ${invalid.expected}) name="${featureName}"`)
    })
    
    console.error(`\n   입력 파일이 잘못된 시도의 데이터를 포함하고 있습니다.`)
    console.error(`   올바른 시도 코드(${provinceCode})의 데이터만 포함된 파일을 사용하세요.`)
    process.exit(1)
  }

  console.log(`  ✅ 모든 Feature가 시도 코드 ${provinceCode}와 일치합니다.`)

  // 새 법정동 데이터 추가
  const mergedFeatures = [...filteredFeatures, ...newFeatures]
  const addedCount = newFeatures.length

  console.log(`  - 새 법정동 추가: ${addedCount}개`)

  // 결과 생성
  const result: MergeResult = {
    originalCount,
    removedCount,
    addedCount,
    finalCount: mergedFeatures.length,
  }

  // 저장
  if (!options.dryRun) {
    const merged: GeoJSONCollection = {
      type: 'FeatureCollection',
      features: mergedFeatures,
    }

    fs.writeFileSync(SUBMUNICIPALITIES_PATH, JSON.stringify(merged), 'utf-8')
    console.log(`\n✅ 병합 완료: ${SUBMUNICIPALITIES_PATH}`)
  } else {
    console.log('\n🔍 Dry-run 모드: 실제 저장 건너뜀')
  }

  return result
}

/**
 * 시도 코드 → 시도명 매핑
 */
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
  '42': '강원특별자치도', // 기존 코드 (호환성)
  '43': '충청북도',
  '44': '충청남도',
  '45': '전북특별자치도', // 기존 코드 (호환성)
  '46': '전라남도',
  '47': '경상북도',
  '48': '경상남도',
  '50': '제주특별자치도',
  '51': '강원특별자치도', // 새 코드 (SHP 기준)
  '52': '전북특별자치도', // 새 코드 (SHP 기준)
}

/**
 * 명령줄 인수 파싱
 */
const parseArgs = (args: string[]): { inputPath: string; options: MergeOptions } => {
  const inputPath = args.find((arg) => !arg.startsWith('--'))
  const options: MergeOptions = {}

  const provinceIdx = args.indexOf('--province')
  if (provinceIdx !== -1 && args[provinceIdx + 1]) {
    options.provinceCode = args[provinceIdx + 1]
  }

  if (args.includes('--dry-run')) {
    options.dryRun = true
  }

  if (!inputPath) {
    console.error('사용법: npx tsx scripts/etl/mergeLegal.ts <converted.json> [--province <code>] [--dry-run]')
    console.error('예시: npx tsx scripts/etl/mergeLegal.ts scripts/data/chungbuk_wgs84_converted.json --province 43')
    process.exit(1)
  }

  return { inputPath, options }
}

/**
 * 메인 실행 함수
 */
const main = async () => {
  const { inputPath, options } = parseArgs(process.argv.slice(2))

  console.log('🔄 법정동 GeoJSON 병합 시작')
  console.log(`  입력: ${inputPath}`)

  // 입력 파일 읽기
  if (!fs.existsSync(inputPath)) {
    console.error(`❌ 입력 파일을 찾을 수 없습니다: ${inputPath}`)
    process.exit(1)
  }

  const inputData = JSON.parse(fs.readFileSync(inputPath, 'utf-8')) as GeoJSONCollection
  console.log(`\n📊 입력 데이터: ${inputData.features.length}개 Feature`)

  // 시도 코드 결정
  let provinceCode = options.provinceCode
  if (!provinceCode) {
    provinceCode = detectProvinceCode(inputData.features)
    if (!provinceCode) {
      console.error('❌ 시도 코드를 감지할 수 없습니다. --province 옵션을 사용하세요.')
      process.exit(1)
    }
  }

  const provinceName = PROVINCE_NAMES[provinceCode] || `시도 코드 ${provinceCode}`
  console.log(`  시도: ${provinceName} (${provinceCode})`)

  // 병합 실행
  const result = mergeSubmunicipalities(inputData.features, provinceCode, options)

  // 결과 요약
  console.log('\n📈 결과 요약:')
  console.log(`  원본: ${result.originalCount}개`)
  console.log(`  제거: ${result.removedCount}개 (${provinceName})`)
  console.log(`  추가: ${result.addedCount}개 (법정동)`)
  console.log(`  최종: ${result.finalCount}개`)
}

main().catch((err) => {
  console.error('❌ 오류 발생:', err)
  process.exit(1)
})
