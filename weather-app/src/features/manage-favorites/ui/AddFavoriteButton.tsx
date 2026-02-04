import { Star, StarOff } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui'
import { useFavoritesStore } from '../model/favoritesStore'
import { ERROR_MESSAGES } from '@/entities/weather'
import type { Location } from '@/entities/location'

interface AddFavoriteButtonProps {
  location: Location
  onError?: (message: string) => void
  className?: string
}

export const AddFavoriteButton = ({
  location,
  onError,
  className,
}: AddFavoriteButtonProps) => {
  const isFavorite = useFavoritesStore((state) => state.isFavorite(location.code))
  const addFavorite = useFavoritesStore((state) => state.addFavorite)
  const removeFavorite = useFavoritesStore((state) => state.removeFavorite)
  const favorites = useFavoritesStore((state) => state.favorites)
  const canAddMore = useFavoritesStore((state) => state.canAddMore)

  const handleClick = () => {
    if (isFavorite) {
      const favorite = favorites.find((f) => f.code === location.code)
      if (favorite) {
        removeFavorite(favorite.id)
      }
    } else {
      if (!canAddMore()) {
        onError?.(ERROR_MESSAGES.FAVORITES_LIMIT)
        return
      }
      addFavorite(location)
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      className={cn(
        isFavorite && 'text-yellow-500 hover:text-yellow-600',
        className
      )}
      title={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
    >
      {isFavorite ? (
        <Star className="size-5 fill-current" />
      ) : (
        <StarOff className="size-5" />
      )}
    </Button>
  )
}
