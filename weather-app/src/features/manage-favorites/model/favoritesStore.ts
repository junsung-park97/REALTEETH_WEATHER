import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Location, Favorite } from '@/entities/location'

const MAX_FAVORITES = 6

interface FavoritesState {
  favorites: Favorite[]
  addFavorite: (location: Location, customName?: string) => boolean
  removeFavorite: (id: string) => void
  updateFavoriteName: (id: string, name: string) => void
  isFavorite: (code: string) => boolean
  canAddMore: () => boolean
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],

      addFavorite: (location, customName) => {
        const state = get()

        if (state.favorites.length >= MAX_FAVORITES) {
          return false
        }

        if (state.isFavorite(location.code)) {
          return false
        }

        const newFavorite: Favorite = {
          id: crypto.randomUUID(),
          code: location.code,
          customName: customName || location.name,
          location,
          createdAt: new Date().toISOString(),
        }

        set((state) => ({
          favorites: [...state.favorites, newFavorite],
        }))

        return true
      },

      removeFavorite: (id) => {
        set((state) => ({
          favorites: state.favorites.filter((f) => f.id !== id),
        }))
      },

      updateFavoriteName: (id, name) => {
        set((state) => ({
          favorites: state.favorites.map((f) =>
            f.id === id ? { ...f, customName: name } : f
          ),
        }))
      },

      isFavorite: (code) => {
        return get().favorites.some((f) => f.code === code)
      },

      canAddMore: () => {
        return get().favorites.length < MAX_FAVORITES
      },
    }),
    {
      name: 'weather-favorites',
    }
  )
)
