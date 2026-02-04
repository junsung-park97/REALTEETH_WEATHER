import { cn } from '@/shared/lib/utils'
import { Skeleton, ScrollArea, ScrollBar } from '@/shared/ui'

interface HourlyForecastSkeletonProps {
  className?: string
  itemCount?: number
}

const HourlyItemSkeleton = () => (
  <div className="flex flex-col items-center gap-1 px-3 py-2 min-w-[60px] md:min-w-[70px] lg:min-w-[80px]">
    <Skeleton className="h-3 w-6" />
    <Skeleton className="size-8 rounded-full" />
    <Skeleton className="h-4 w-8" />
  </div>
)

export const HourlyForecastSkeleton = ({
  className,
  itemCount = 12,
}: HourlyForecastSkeletonProps) => {
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center gap-2 mb-2 px-4">
        <Skeleton className="h-4 w-20" />
      </div>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex">
          {Array.from({ length: itemCount }).map((_, index) => (
            <HourlyItemSkeleton key={index} />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}
