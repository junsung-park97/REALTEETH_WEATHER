import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Input,
  Button,
} from '@/shared/ui'
import { useFavoritesStore } from '../model/favoritesStore'
import type { Favorite } from '@/entities/location'

interface FavoriteEditDialogProps {
  favorite: Favorite | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const FavoriteEditDialog = ({
  favorite,
  open,
  onOpenChange,
}: FavoriteEditDialogProps) => {
  const [name, setName] = useState('')
  const updateFavoriteName = useFavoritesStore((state) => state.updateFavoriteName)

  useEffect(() => {
    if (favorite) {
      setName(favorite.customName)
    }
  }, [favorite])

  const handleSave = () => {
    if (favorite && name.trim()) {
      updateFavoriteName(favorite.id, name.trim())
      onOpenChange(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>즐겨찾기 이름 수정</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="즐겨찾기 이름"
            maxLength={20}
          />
          <p className="text-xs text-muted-foreground mt-2">
            {favorite?.location.fullName}
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
