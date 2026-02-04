import { useState, useMemo } from 'react'
import { useDebounce } from '@/shared/hooks'
import { searchRegions, getRegionFullName } from '@/shared/data/regionSearch'
import type { Region } from '@/shared/data/types'
import type { Location } from '@/entities/location'

interface UseLocationSearchResult {
  query: string
  setQuery: (query: string) => void
  results: Location[]
  isSearching: boolean
}

const regionToLocation = (region: Region): Location => ({
  code: region.code,
  name: region.level3 || region.level2 || region.level1,
  fullName: getRegionFullName(region),
  level1: region.level1,
  level2: region.level2,
  level3: region.level3,
  nx: region.nx,
  ny: region.ny,
  lat: region.lat,
  lon: region.lon,
})

export const useLocationSearch = (limit: number = 10): UseLocationSearchResult => {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 300)

  const results = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return []
    }

    const regions = searchRegions(debouncedQuery, limit)
    return regions.map(regionToLocation)
  }, [debouncedQuery, limit])

  const isSearching = query !== debouncedQuery

  return {
    query,
    setQuery,
    results,
    isSearching,
  }
}
