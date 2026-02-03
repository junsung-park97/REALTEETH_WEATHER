/**
 * regions.json 검증 스크립트
 *
 * 생성된 데이터의 유효성을 확인합니다.
 */

import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const REGIONS_PATH = join(__dirname, '../../src/shared/data/regions.json')
const KOREA_DISTRICTS_PATH = join(__dirname, '../../korea_districts.json')

interface Region {
  code: string
  level1: string
  level2: string
  level3: string
  lat: number
  lon: number
  nx: number
  ny: number
}

interface RegionsData {
  version: string
  generatedAt: string
  regions: Region[]
}

interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  stats: {
    totalRegions: number
    uniqueGridCoords: number
    byLevel: {
      level1Only: number
      level2: number
      level3: number
    }
  }
}

const validate = (): ValidationResult => {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    stats: {
      totalRegions: 0,
      uniqueGridCoords: 0,
      byLevel: {
        level1Only: 0,
        level2: 0,
        level3: 0,
      },
    },
  }

  // 1. 파일 존재 확인
  if (!existsSync(REGIONS_PATH)) {
    result.errors.push(`regions.json 파일이 없습니다: ${REGIONS_PATH}`)
    result.valid = false
    return result
  }

  // 2. JSON 파싱
  let data: RegionsData
  try {
    data = JSON.parse(readFileSync(REGIONS_PATH, 'utf-8'))
  } catch (error) {
    result.errors.push(`JSON 파싱 실패: ${error}`)
    result.valid = false
    return result
  }

  // 3. 스키마 검증
  if (!data.version) {
    result.errors.push('version 필드가 없습니다')
  }
  if (!data.generatedAt) {
    result.errors.push('generatedAt 필드가 없습니다')
  }
  if (!Array.isArray(data.regions)) {
    result.errors.push('regions 필드가 배열이 아닙니다')
    result.valid = false
    return result
  }

  result.stats.totalRegions = data.regions.length

  // 4. 원본 데이터 개수 비교
  if (existsSync(KOREA_DISTRICTS_PATH)) {
    const originalData: string[] = JSON.parse(readFileSync(KOREA_DISTRICTS_PATH, 'utf-8'))
    if (data.regions.length !== originalData.length) {
      result.warnings.push(
        `원본과 결과 개수 불일치: 원본 ${originalData.length}개, 결과 ${data.regions.length}개`
      )
    }
  }

  // 5. 각 region 검증
  const gridCoords = new Set<string>()
  const seenCodes = new Set<string>()

  for (let i = 0; i < data.regions.length; i++) {
    const region = data.regions[i]
    const prefix = `regions[${i}]`

    // 필수 필드 확인
    if (!region.code) result.errors.push(`${prefix}: code 없음`)
    if (!region.level1) result.errors.push(`${prefix}: level1 없음`)

    // 중복 코드 확인
    if (region.code && seenCodes.has(region.code)) {
      result.warnings.push(`${prefix}: 중복 코드 ${region.code}`)
    }
    seenCodes.add(region.code)

    // 좌표 유효성 (한반도 범위)
    if (region.lat < 33 || region.lat > 43) {
      result.errors.push(`${prefix}: 위도 범위 초과 (${region.lat})`)
    }
    if (region.lon < 124 || region.lon > 132) {
      result.errors.push(`${prefix}: 경도 범위 초과 (${region.lon})`)
    }

    // 격자좌표 유효성
    if (region.nx < 1 || region.nx > 149) {
      result.errors.push(`${prefix}: nx 범위 초과 (${region.nx})`)
    }
    if (region.ny < 1 || region.ny > 253) {
      result.errors.push(`${prefix}: ny 범위 초과 (${region.ny})`)
    }

    // 통계 수집
    gridCoords.add(`${region.nx},${region.ny}`)

    if (region.level3) {
      result.stats.byLevel.level3++
    } else if (region.level2) {
      result.stats.byLevel.level2++
    } else {
      result.stats.byLevel.level1Only++
    }
  }

  result.stats.uniqueGridCoords = gridCoords.size

  // 6. 최종 유효성 판단
  if (result.errors.length > 0) {
    result.valid = false
  }

  return result
}

// 샘플 데이터 출력
const printSamples = (): void => {
  if (!existsSync(REGIONS_PATH)) return

  const data: RegionsData = JSON.parse(readFileSync(REGIONS_PATH, 'utf-8'))
  const samples = data.regions.slice(0, 5)

  console.log('\n📋 샘플 데이터:')
  samples.forEach((region, i) => {
    const address = [region.level1, region.level2, region.level3]
      .filter(Boolean)
      .join(' ')
    console.log(
      `   ${i + 1}. ${address} → (${region.lat}, ${region.lon}) → nx=${region.nx}, ny=${region.ny}`
    )
  })
}

// 메인 실행
const main = (): void => {
  console.log('🔍 regions.json 검증 시작\n')

  const result = validate()

  // 결과 출력
  console.log('📊 검증 결과:')
  console.log(`   - 전체 지역: ${result.stats.totalRegions}개`)
  console.log(`   - 고유 격자좌표: ${result.stats.uniqueGridCoords}개`)
  console.log(`   - 시/도만: ${result.stats.byLevel.level1Only}개`)
  console.log(`   - 시/군/구까지: ${result.stats.byLevel.level2}개`)
  console.log(`   - 읍/면/동까지: ${result.stats.byLevel.level3}개`)

  if (result.errors.length > 0) {
    console.log('\n❌ 오류:')
    result.errors.slice(0, 10).forEach((err) => console.log(`   - ${err}`))
    if (result.errors.length > 10) {
      console.log(`   ... 외 ${result.errors.length - 10}개`)
    }
  }

  if (result.warnings.length > 0) {
    console.log('\n⚠️  경고:')
    result.warnings.slice(0, 10).forEach((warn) => console.log(`   - ${warn}`))
    if (result.warnings.length > 10) {
      console.log(`   ... 외 ${result.warnings.length - 10}개`)
    }
  }

  printSamples()

  if (result.valid) {
    console.log('\n✅ 검증 통과!')
  } else {
    console.log('\n❌ 검증 실패!')
    process.exit(1)
  }
}

main()
