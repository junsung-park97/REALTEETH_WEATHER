/**
 * 법정동 GeoJSON 속성 변환 스크립트
 *
 * GDAL로 변환된 법정동 GeoJSON의 속성을 matcher.ts가 기대하는 형식으로 변환합니다.
 *
 * 입력 속성 (SHP → GDAL 변환 후):
 *   - EMD_CD: 읍면동 코드 (8자리)
 *   - EMD_NM: 읍면동 이름
 *   - COL_ADM_SE: 시군구 코드 (5자리)
 *   - SGG_OID: 시군구 OID (불필요)
 *
 * 출력 속성 (matcher.ts 호환):
 *   - code: 읍면동 코드
 *   - name: 읍면동 이름
 *   - base: 상위 행정구역 (시도 + 시군구)
 *
 * 사용법:
 *   npx tsx scripts/etl/transformLegal.ts <input.json> [output.json]
 *
 * 예시:
 *   npx tsx scripts/etl/transformLegal.ts scripts/data/chungbuk_wgs84.json
 */

import * as fs from 'fs'
import * as path from 'path'
import { getSggInfo, getSggInfoByEmdCode } from './sggCodeMap'
import type { GeoJSONCollection, GeoJSONFeature, GeoJSONGeometry } from '../lib/types'

// GDAL 변환 후 GeoJSON Feature 타입
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

interface TransformResult {
  success: number
  failed: number
  missingCodes: Set<string>
}

/**
 * 단일 Feature 속성 변환
 */
const transformFeature = (feature: GdalFeature): GeoJSONFeature | null => {
  const { EMD_CD, EMD_NM, COL_ADM_SE } = feature.properties

  if (!EMD_CD || !EMD_NM || !COL_ADM_SE) {
    console.warn(`  ⚠️ 필수 속성 누락: EMD_CD=${EMD_CD}, EMD_NM=${EMD_NM}, COL_ADM_SE=${COL_ADM_SE}`)
    return null
  }

  // EMD_CD 기반 매핑 우선 시도 (일반구 단위 정확도)
  // COL_ADM_SE가 행정시 단위(청주시 = 43110)로만 제공되는 경우에도
  // EMD_CD 앞 5자리로 일반구(상당구 = 43111)를 정확히 매핑
  let sggInfo = getSggInfoByEmdCode(EMD_CD)

  // EMD_CD 매핑 실패시 COL_ADM_SE로 폴백
  if (!sggInfo) {
    sggInfo = getSggInfo(COL_ADM_SE)
  }

  if (!sggInfo) {
    // 매핑되지 않은 코드 - 경고만 출력하고 base를 비워서 반환
    console.warn(`  ⚠️ 매핑되지 않은 시군구 코드: COL_ADM_SE=${COL_ADM_SE}, EMD_CD=${EMD_CD} (${EMD_NM})`)
    return {
      type: 'Feature',
      properties: {
        code: EMD_CD,
        name: EMD_NM,
        base: '',
      },
      geometry: feature.geometry,
    }
  }

  return {
    type: 'Feature',
    properties: {
      code: EMD_CD,
      name: EMD_NM,
      base: `${sggInfo.province} ${sggInfo.city}`,
    },
    geometry: feature.geometry,
  }
}

/**
 * GeoJSON Collection 전체 변환
 */
const transformCollection = (input: GdalCollection): { output: GeoJSONCollection; result: TransformResult } => {
  const result: TransformResult = {
    success: 0,
    failed: 0,
    missingCodes: new Set(),
  }

  const transformedFeatures: GeoJSONFeature[] = []

  for (const feature of input.features) {
    const transformed = transformFeature(feature)
    if (transformed) {
      transformedFeatures.push(transformed)
      result.success++

      // base가 비어있으면 매핑 누락
      if (!transformed.properties.base) {
        result.missingCodes.add(feature.properties.COL_ADM_SE)
      }
    } else {
      result.failed++
    }
  }

  const output: GeoJSONCollection = {
    type: 'FeatureCollection',
    features: transformedFeatures,
  }

  return { output, result }
}

/**
 * 메인 실행 함수
 */
const main = async () => {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.error('사용법: npx tsx scripts/etl/transformLegal.ts <input.json> [output.json]')
    console.error('예시: npx tsx scripts/etl/transformLegal.ts scripts/data/chungbuk_wgs84.json')
    process.exit(1)
  }

  const inputPath = args[0]
  const outputPath = args[1] || inputPath.replace('.json', '_converted.json')

  console.log('🔄 법정동 GeoJSON 속성 변환 시작')
  console.log(`  입력: ${inputPath}`)
  console.log(`  출력: ${outputPath}`)

  // 입력 파일 읽기
  if (!fs.existsSync(inputPath)) {
    console.error(`❌ 입력 파일을 찾을 수 없습니다: ${inputPath}`)
    process.exit(1)
  }

  const inputData = JSON.parse(fs.readFileSync(inputPath, 'utf-8')) as GdalCollection

  console.log(`\n📊 입력 데이터: ${inputData.features.length}개 Feature`)

  // 변환 실행
  const { output, result } = transformCollection(inputData)

  // 결과 저장
  const outputDir = path.dirname(outputPath)
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8')

  // 결과 출력
  console.log('\n✅ 변환 완료')
  console.log(`  성공: ${result.success}개`)
  console.log(`  실패: ${result.failed}개`)

  if (result.missingCodes.size > 0) {
    console.log(`\n⚠️ sggCodeMap.ts에 추가 필요한 코드:`)
    for (const code of result.missingCodes) {
      console.log(`  - ${code}`)
    }
  }

  console.log(`\n📁 출력 파일: ${outputPath}`)
}

main().catch((err) => {
  console.error('❌ 오류 발생:', err)
  process.exit(1)
})
