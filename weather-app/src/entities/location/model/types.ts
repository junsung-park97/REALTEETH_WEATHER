export interface Location {
  code: string
  name: string
  fullName: string
  level1: string
  level2: string
  level3: string
  nx: number
  ny: number
  lat: number
  lon: number
}

export interface Favorite {
  id: string
  code: string
  customName: string
  location: Location
  createdAt: string
}
