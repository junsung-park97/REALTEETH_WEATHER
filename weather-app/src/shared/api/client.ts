const KMA_BASE_URL = 'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0'

const getApiKey = () => {
  const key = import.meta.env.VITE_WEATHER_API_KEY
  if (!key) {
    throw new Error('VITE_WEATHER_API_KEY environment variable is not set')
  }
  return key
}

interface KmaResponse<T> {
  response: {
    header: {
      resultCode: string
      resultMsg: string
    }
    body?: {
      dataType: string
      items: {
        item: T[]
      }
      numOfRows: number
      pageNo: number
      totalCount: number
    }
  }
}

export const kmaClient = {
  get: async <T>(
    endpoint: string,
    params: Record<string, string | number>
  ): Promise<T[]> => {
    const url = new URL(`${KMA_BASE_URL}/${endpoint}`)
    url.searchParams.set('serviceKey', getApiKey())
    url.searchParams.set('dataType', 'JSON')
    Object.entries(params).forEach(([k, v]) =>
      url.searchParams.set(k, String(v))
    )

    const response = await fetch(url.toString())

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`)
    }

    const data: KmaResponse<T> = await response.json()

    if (data.response.header.resultCode !== '00') {
      throw new Error(
        `KMA API Error: ${data.response.header.resultMsg}`
      )
    }

    return data.response.body?.items?.item ?? []
  },
}
