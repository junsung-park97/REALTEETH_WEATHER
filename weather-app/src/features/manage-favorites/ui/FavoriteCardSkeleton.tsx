import { cn } from '@/shared/lib/utils'
import { Card, CardHeader, CardContent, CardFooter, Skeleton } from '@/shared/ui'

interface FavoriteCardSkeletonProps {
  className?: string
}

export const FavoriteCardSkeleton = ({
  className,
}: FavoriteCardSkeletonProps) => {
  return (
    <Card className={cn('py-4', className)}>
      <CardHeader className="pb-2 px-4">
        <Skeleton className="h-4 w-16 mb-1" />
        <Skeleton className="h-3 w-24" />
      </CardHeader>
      <CardContent className="py-2 px-4">
        <div className="flex flex-col items-center gap-2">
          <Skeleton className="size-8 rounded-full" />
          <Skeleton className="h-6 w-12" />
          <Skeleton className="h-3 w-16" />
        </div>
      </CardContent>
      <CardFooter className="pt-2 px-4 gap-2 justify-center">
        <Skeleton className="size-6 rounded" />
        <Skeleton className="size-6 rounded" />
      </CardFooter>
    </Card>
  )
}
