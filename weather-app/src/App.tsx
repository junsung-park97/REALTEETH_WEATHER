import { Providers } from '@/app/providers'
import { AppRouter } from '@/app/router'

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
  return (
    <Providers>
      <AppRouter />
    </Providers>
  )
}

export default App
