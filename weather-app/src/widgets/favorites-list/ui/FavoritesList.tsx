import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Card, CardContent } from '@/shared/ui'
import {
  useFavoritesStore,
  FavoriteCard,
  FavoriteCardSkeleton,
  FavoriteEditDialog,
} from '@/features/manage-favorites'
import { useWeather } from '@/features/get-weather'
import type { Favorite } from '@/entities/location'

interface FavoritesListProps {
  className?: string
}

const FavoriteCardWithWeather = ({
  favorite,
  onEdit,
  onDelete,
  onClick,
}: {
  favorite: Favorite
  onEdit: () => void
  onDelete: () => void
  onClick: () => void
}) => {
  const { current: weather, minTemp, maxTemp, isLoading } = useWeather(
    favorite.location.nx,
    favorite.location.ny
  )

  if (isLoading) {
    return <FavoriteCardSkeleton />
  }

  return (
    <FavoriteCard onClick={onClick}>
      <FavoriteCard.Header
        name={favorite.customName}
        location={favorite.location.fullName}
      />
      {weather && (
        <FavoriteCard.Weather
          sky={weather.sky}
          precipitation={weather.precipitation}
          temp={weather.temperature}
          minTemp={minTemp ?? undefined}
          maxTemp={maxTemp ?? undefined}
        />
      )}
      <FavoriteCard.Actions onEdit={onEdit} onDelete={onDelete} />
    </FavoriteCard>
  )
}

const EmptyCard = () => (
  <Card className="border-dashed py-0 h-full min-h-[140px] flex items-center justify-center transition-all duration-200 hover:border-primary/50 hover:bg-accent/50 cursor-pointer">
    <CardContent className="flex flex-col items-center justify-center p-6 text-muted-foreground gap-2">
      <div className="bg-muted p-3 rounded-full">
        <Plus className="size-6" />
      </div>
      <span className="text-sm font-medium">즐겨찾기 추가</span>
    </CardContent>
  </Card>
)

export const FavoritesList = ({ className }: FavoritesListProps) => {
  const navigate = useNavigate()
  const favorites = useFavoritesStore((state) => state.favorites)
  const removeFavorite = useFavoritesStore((state) => state.removeFavorite)
  const [editingFavorite, setEditingFavorite] = useState<Favorite | null>(null)

  const handleCardClick = (favorite: Favorite) => {
    navigate(`/location/${favorite.code}`)
  }

  if (favorites.length === 0) {
    return null
  }

  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span className="text-yellow-500">★</span> 즐겨찾기
        </h2>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
          {favorites.length} / 6
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {favorites.map((favorite) => (
          <FavoriteCardWithWeather
            key={favorite.id}
            favorite={favorite}
            onEdit={() => setEditingFavorite(favorite)}
            onDelete={() => removeFavorite(favorite.id)}
            onClick={() => handleCardClick(favorite)}
          />
        ))}
        {favorites.length < 6 && <EmptyCard />}
      </div>

      <FavoriteEditDialog
        favorite={editingFavorite}
        open={!!editingFavorite}
        onOpenChange={(open) => !open && setEditingFavorite(null)}
      />
    </div>
  )
}
