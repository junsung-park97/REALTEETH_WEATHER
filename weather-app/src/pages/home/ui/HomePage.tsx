import { WeatherHeader } from "@/widgets/weather-header";
import { FavoritesList } from "@/widgets/favorites-list";
import { ThemeToggle } from "@/features/theme-toggle";

export const HomePage = () => {
  return (
    <div className="animate-in fade-in duration-300 space-y-8">
      <header className="flex items-center justify-between">
        <div className="w-10" />
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Weather
        </h1>
        <ThemeToggle />
      </header>

      <main className="space-y-10">
        <WeatherHeader />
        <FavoritesList />
      </main>
    </div>
  );
};
