import { WeatherHeader } from "@/widgets/weather-header";
import { FavoritesList } from "@/widgets/favorites-list";
import { ThemeToggle } from "@/features/theme-toggle";

export const HomePage = () => {
  return (
    <div className="min-h-screen bg-background animate-in fade-in duration-300">
      <div className="max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto px-4 py-6 space-y-8">
        <header className="flex items-center justify-between">
          <div className="w-10" />
          <h1 className="text-2xl font-bold">날씨</h1>
          <ThemeToggle />
        </header>

        <main className="space-y-8">
          <WeatherHeader />
          <FavoritesList />
        </main>
      </div>
    </div>
  );
};
