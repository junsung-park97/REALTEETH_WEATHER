import { cn } from '@/shared/lib/utils'
import { Skeleton } from '@/shared/ui'

interface CurrentWeatherSkeletonProps {
  className?: string
}

export const CurrentWeatherSkeleton = ({
  className,
}: CurrentWeatherSkeletonProps) => {
  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      {/* Location */}
      <div className="flex items-center gap-2">
        <Skeleton className="size-4 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>

      {/* Weather icon */}
      <Skeleton className="size-20 rounded-full" />

      {/* Temperature */}
      <Skeleton className="h-14 w-24" />

      {/* Weather label */}
      <Skeleton className="h-4 w-16" />

      {/* Min/Max temp */}
      <Skeleton className="h-4 w-20" />

      {/* Details */}
      <div className="flex gap-4">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-14" />
        <Skeleton className="h-4 w-12" />
      </div>
    </div>
  )
}
