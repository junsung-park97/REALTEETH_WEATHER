/**
 * GeoJSON 데이터 다운로드 스크립트
 * southkorea-maps 저장소에서 행정구역 경계 데이터를 다운로드합니다.
 */

import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const DATA_DIR = join(__dirname, '../data')

const GEOJSON_SOURCES = {
  provinces:
    'https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2018/json/skorea-provinces-2018-geo.json',
  municipalities:
    'https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2018/json/skorea-municipalities-2018-geo.json',
  submunicipalities:
    'https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2018/json/skorea-submunicipalities-2018-geo.json',
} as const

type GeoJSONType = keyof typeof GEOJSON_SOURCES

const TIMEOUT_MS = 60_000 // 60초

const downloadFile = async (url: string, filename: string): Promise<void> => {
  const filepath = join(DATA_DIR, filename)

  if (existsSync(filepath)) {
    console.log(`⏭️  ${filename} already exists, skipping...`)
    return
  }

  console.log(`📥 Downloading ${filename}...`)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) {
      throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`)
    }

    const data = await response.text()
    writeFileSync(filepath, data)
    console.log(`✅ Saved ${filename}`)
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Timeout: ${filename} download exceeded ${TIMEOUT_MS / 1000}s`)
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

const main = async (): Promise<void> => {
  console.log('🚀 Starting GeoJSON download...\n')

  mkdirSync(DATA_DIR, { recursive: true })

  const downloads: Array<{ type: GeoJSONType; filename: string }> = [
    { type: 'provinces', filename: 'provinces.json' },
    { type: 'municipalities', filename: 'municipalities.json' },
    { type: 'submunicipalities', filename: 'submunicipalities.json' },
  ]

  for (const { type, filename } of downloads) {
    try {
      await downloadFile(GEOJSON_SOURCES[type], filename)
    } catch (error) {
      console.error(`❌ Failed to download ${type}:`, error)
      process.exit(1)
    }
  }

  console.log('\n✨ All GeoJSON files downloaded successfully!')
}

main()
