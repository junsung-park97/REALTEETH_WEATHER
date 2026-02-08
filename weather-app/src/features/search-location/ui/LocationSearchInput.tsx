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
    className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-accent/50 transition-all duration-200 border-b border-border/40 last:border-0"
  >
    <div className="bg-primary/10 p-2 rounded-full shrink-0">
      <MapPin className="size-4 text-primary" />
    </div>
    <div className="flex flex-col min-w-0 gap-0.5">
      <span className="text-sm font-semibold text-foreground truncate">{location.name}</span>
      <span className="text-xs text-muted-foreground truncate font-medium">
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
    <div ref={containerRef} className={cn('relative group', className)}>
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors duration-300" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="pl-10 pr-10 h-11 rounded-xl bg-background/50 backdrop-blur-sm border-transparent focus:border-primary/20 shadow-sm transition-all duration-300"
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
        <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-popover/95 backdrop-blur-md border rounded-xl shadow-xl max-h-[320px] overflow-auto animate-in fade-in slide-in-from-top-2 duration-200">
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
