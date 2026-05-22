import { Skeleton } from "@/components/ui";

export function RequirementsSkeleton() {
  return (
    <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 space-y-8 w-full animate-pulse bg-background overflow-y-auto overflow-x-hidden">
      <div className="mb-6 sm:mb-8 border-b border-border pb-4 sm:pb-6">
        <Skeleton className="h-8 w-64 bg-muted/60 mb-3" />
        <Skeleton className="h-4 w-96 bg-muted/60" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Skeleton className="h-[120px] rounded-2xl bg-muted/60" />
        <Skeleton className="h-[120px] rounded-2xl bg-muted/60" />
        <Skeleton className="h-[120px] rounded-2xl bg-muted/60" />
        <Skeleton className="h-[120px] rounded-2xl bg-muted/60" />
      </div>
      <Skeleton className="h-[300px] rounded-2xl bg-muted/60 w-full" />
    </div>
  );
}
