import { Skeleton } from "@/components/ui/skeleton";

export default function FoldersLoading() {
  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in-50 duration-150">
      {/* Header */}
      <div className="space-y-1.5">
        <Skeleton className="h-8 w-36 border-2 border-black/20" />
        <Skeleton className="h-4 w-80 border border-black/10" />
      </div>

      {/* Create form skeleton */}
      <div className="p-4 border-2 border-black/20 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] space-y-3">
        <Skeleton className="h-5 w-32 border border-black/10" />
        <Skeleton className="h-9 w-full border-2 border-black/20" />
        <div className="flex gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="w-6 h-6 border-2 border-black/20" />
          ))}
        </div>
        <Skeleton className="h-9 w-28 border-2 border-black/20 bg-yellow-100" />
      </div>

      {/* Folders grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="p-3.5 border-2 border-black/20 bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,0.1)] space-y-3"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 flex-1">
                <Skeleton className="w-4 h-4 border border-black/20" />
                <Skeleton className="h-5 w-24 border border-black/10" />
              </div>
              <Skeleton className="w-6 h-6 border border-black/10" />
            </div>
            <div className="flex gap-1.5 pt-2 border-t border-black/10">
              <Skeleton className="h-5 w-16 border border-black/10" />
              <Skeleton className="h-5 w-16 border border-black/10" />
              <Skeleton className="h-5 w-16 border border-black/10" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
