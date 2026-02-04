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
  <Card className="border-dashed py-4 transition-all duration-200 hover:border-muted-foreground/50">
    <CardContent className="flex flex-col items-center justify-center h-full min-h-[120px] text-muted-foreground">
      <Plus className="size-8 mb-2" />
      <span className="text-sm">즐겨찾기 추가</span>
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
    <div className={cn('space-y-4', className)}>
      <h2 className="text-lg font-semibold px-1">즐겨찾기</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
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
