import { useState, useRef, useEffect } from 'react'
import { Search, MapPin, X, Loader2 } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Input, Button } from '@/shared/ui'
import { useLocationSearch } from '../model/useLocationSearch'
import type { Location } from '@/entities/location'

interface LocationSearchInputProps {
  onSelectLocation: (location: Location) => void
  placeholder?: string
  className?: string
}

const SearchResult = ({
  location,
  onSelect,
}: {
  location: Location
  onSelect: () => void
}) => (
  <button
    type="button"
    onClick={onSelect}
    className="flex items-center gap-3 w-full px-3 py-2 text-left hover:bg-accent transition-colors"
  >
    <MapPin className="size-4 text-muted-foreground shrink-0" />
    <div className="flex flex-col min-w-0">
      <span className="text-sm font-medium truncate">{location.name}</span>
      <span className="text-xs text-muted-foreground truncate">
        {location.fullName}
      </span>
    </div>
  </button>
)

const NoResults = () => (
  <div className="px-3 py-4 text-center text-sm text-muted-foreground">
    검색 결과가 없습니다
  </div>
)

export const LocationSearchInput = ({
  onSelectLocation,
  placeholder = '지역 검색 (예: 강남구, 역삼동)',
  className,
}: LocationSearchInputProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { query, setQuery, results, isSearching } = useLocationSearch()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (location: Location) => {
    onSelectLocation(location)
    setQuery('')
    setIsOpen(false)
    inputRef.current?.blur()
  }

  const handleClear = () => {
    setQuery('')
    inputRef.current?.focus()
  }

  const showDropdown = isOpen && query.trim().length > 0

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="pl-9 pr-9"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon-xs"
            className="absolute right-2 top-1/2 -translate-y-1/2"
            onClick={handleClear}
          >
            {isSearching ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <X className="size-3" />
            )}
          </Button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border rounded-md shadow-lg max-h-[300px] overflow-auto animate-in fade-in slide-in-from-top-2 duration-200">
          {results.length > 0 ? (
            results.map((location) => (
              <SearchResult
                key={location.code}
                location={location}
                onSelect={() => handleSelect(location)}
              />
            ))
          ) : (
            !isSearching && <NoResults />
          )}
        </div>
      )}
    </div>
  )
}
