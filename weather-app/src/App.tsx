import { Providers } from '@/app/providers'
import { AppRouter } from '@/app/router'

const App = () => {
  return (
    <Providers>
      <div className="min-h-screen bg-background font-sans antialiased">
        <main className="relative flex min-h-screen flex-col">
          <div className="flex-1 max-w-screen-xl mx-auto w-full px-4 py-6 md:py-10">
            <AppRouter />
          </div>
        </main>
      </div>
    </Providers>
  )
}

export default App
