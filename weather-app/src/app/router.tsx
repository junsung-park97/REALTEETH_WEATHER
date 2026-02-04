import { Routes, Route } from 'react-router-dom'
import { HomePage } from '@/pages/home'
import { WeatherDetailPage } from '@/pages/detail'

export const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/location/:code" element={<WeatherDetailPage />} />
    </Routes>
  )
}
