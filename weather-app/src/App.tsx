import { useState } from 'react'
import './App.css'

interface WeatherItem {
  category: string
  fcstDate: string
  fcstTime: string
  fcstValue: string
}

interface WeatherResponse {
  response: {
    header: {
      resultCode: string
      resultMsg: string
    }
    body?: {
      items: {
        item: WeatherItem[]
      }
    }
  }
}

// 카테고리 코드 한글 변환
const categoryMap: Record<string, string> = {
  POP: '강수확률(%)',
  PTY: '강수형태',
  PCP: '1시간 강수량',
  REH: '습도(%)',
  SNO: '1시간 신적설',
  SKY: '하늘상태',
  TMP: '1시간 기온(℃)',
  TMN: '일 최저기온(℃)',
  TMX: '일 최고기온(℃)',
  UUU: '풍속(동서)',
  VVV: '풍속(남북)',
  WAV: '파고',
  VEC: '풍향',
  WSD: '풍속(m/s)',
}

function App() {
  const [weatherData, setWeatherData] = useState<WeatherItem[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rawResponse, setRawResponse] = useState<string>('')

  const API_KEY = import.meta.env.VITE_WEATHER_API_KEY

  // 현재 날짜와 시간 계산 (base_date, base_time)
  const getBaseDateTime = () => {
    const now = new Date()
    // 발표 시간: 02, 05, 08, 11, 14, 17, 20, 23시
    const baseHours = [2, 5, 8, 11, 14, 17, 20, 23]

    let hour = now.getHours()
    let baseHour = baseHours.filter(h => h <= hour).pop() || 23

    // 만약 현재 시간이 2시 이전이면 전날 23시 데이터 사용
    if (hour < 2) {
      now.setDate(now.getDate() - 1)
      baseHour = 23
    }

    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')

    return {
      baseDate: `${year}${month}${day}`,
      baseTime: String(baseHour).padStart(2, '0') + '00'
    }
  }

  const fetchWeather = async () => {
    setLoading(true)
    setError(null)
    setWeatherData(null)
    setRawResponse('')

    const { baseDate, baseTime } = getBaseDateTime()

    // 서울 좌표 (강남구 기준)
    const nx = 61
    const ny = 126

    const url = new URL('https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst')
    url.searchParams.append('serviceKey', API_KEY)
    url.searchParams.append('pageNo', '1')
    url.searchParams.append('numOfRows', '300')
    url.searchParams.append('dataType', 'JSON')
    url.searchParams.append('base_date', baseDate)
    url.searchParams.append('base_time', baseTime)
    url.searchParams.append('nx', String(nx))
    url.searchParams.append('ny', String(ny))

    console.log('요청 URL:', url.toString())
    console.log('발표일시:', baseDate, baseTime)

    try {
      const response = await fetch(url.toString())
      const text = await response.text()
      setRawResponse(text)

      const data: WeatherResponse = JSON.parse(text)

      console.log('응답 데이터:', data)

      if (data.response.header.resultCode !== '00') {
        throw new Error(`API 에러: ${data.response.header.resultMsg}`)
      }

      if (data.response.body?.items?.item) {
        setWeatherData(data.response.body.items.item)
      } else {
        throw new Error('날씨 데이터가 없습니다')
      }
    } catch (err) {
      console.error('에러:', err)
      setError(err instanceof Error ? err.message : '알 수 없는 에러가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  // 시간대별로 데이터 그룹화
  const getGroupedByTime = () => {
    if (!weatherData) return {}

    const grouped: Record<string, WeatherItem[]> = {}

    weatherData.forEach(item => {
      const key = `${item.fcstDate}-${item.fcstTime}`
      if (!grouped[key]) {
        grouped[key] = []
      }
      grouped[key].push(item)
    })

    return grouped
  }

  // 시간 포맷팅 (20250203-1400 -> 2025.02.03 14:00)
  const formatDateTime = (key: string) => {
    const [date, time] = key.split('-')
    return `${date.slice(0, 4)}.${date.slice(4, 6)}.${date.slice(6, 8)} ${time.slice(0, 2)}:${time.slice(2, 4)}`
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>기상청 API 테스트</h1>

      <div style={{ marginBottom: '20px' }}>
        <p>API 키 상태: {API_KEY ? '✅ 설정됨' : '❌ 미설정'}</p>
        {!API_KEY && (
          <p style={{ color: 'red' }}>
            .env 파일에 VITE_WEATHER_API_KEY를 설정해주세요
          </p>
        )}
      </div>

      <button
        onClick={fetchWeather}
        disabled={loading || !API_KEY}
        style={{ padding: '10px 20px', fontSize: '16px', marginBottom: '20px' }}
      >
        {loading ? '로딩 중...' : '날씨 데이터 가져오기'}
      </button>

      {error && (
        <div style={{ color: 'red', padding: '10px', border: '1px solid red', marginBottom: '20px' }}>
          <strong>에러:</strong> {error}
        </div>
      )}

      {weatherData && (
        <div>
          <h2>시간대별 날씨 (서울)</h2>
          {Object.entries(getGroupedByTime()).map(([timeKey, items]) => (
            <div key={timeKey} style={{ marginBottom: '20px' }}>
              <h3 style={{
                background: '#4a90d9',
                color: 'white',
                padding: '8px 12px',
                margin: '0',
                borderRadius: '4px 4px 0 0'
              }}>
                {formatDateTime(timeKey)}
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td style={{
                        border: '1px solid #ddd',
                        padding: '8px',
                        width: '50%',
                        background: '#f9f9f9'
                      }}>
                        {categoryMap[item.category] || item.category}
                      </td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                        {item.fcstValue}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {rawResponse && (
        <details style={{ marginTop: '20px' }}>
          <summary>원본 응답 데이터 (디버깅용)</summary>
          <pre style={{
            background: '#f5f5f5',
            padding: '10px',
            overflow: 'auto',
            maxHeight: '300px',
            fontSize: '12px'
          }}>
            {JSON.stringify(JSON.parse(rawResponse), null, 2)}
          </pre>
        </details>
      )}
    </div>
  )
}

export default App
