import { Providers } from '@/app/providers'
import { AppRouter } from '@/app/router'

const App = () => {
  return (
    <Providers>
      <AppRouter />
    </Providers>
  )
}

export default App
