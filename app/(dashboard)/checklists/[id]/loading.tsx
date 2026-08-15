import { Skeleton } from "@/components/ui/skeleton";

export default function ChecklistDetailLoading() {
  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-3xl mx-auto space-y-6 animate-in fade-in-50 duration-150">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-3 border-b-2 border-black/20 pb-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-16 border border-black/10" />
          <span className="text-black/30">/</span>
          <Skeleton className="h-6 w-44 border border-black/10" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-28 border-2 border-black/20" />
          <Skeleton className="h-7 w-8 border-2 border-black/20" />
        </div>
      </div>

      {/* Progress Bar Card Skeleton */}
      <div className="p-4 border-2 border-black/20 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] space-y-2">
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-40 border border-black/10" />
          <Skeleton className="h-4 w-10 border border-black/10" />
        </div>
        <Skeleton className="h-3 w-full border-2 border-black/10" />
      </div>

      {/* Items Skeleton */}
      <div className="space-y-3">
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 border-2 border-black/20 bg-white"
            >
              <Skeleton className="w-5 h-5 border-2 border-black/20" />
              <Skeleton className="h-4 flex-1 border border-black/10" />
              <Skeleton className="h-4 w-16 border border-black/10" />
            </div>
          ))}
        </div>

        {/* Add item form skeleton */}
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1 border-2 border-black/20" />
          <Skeleton className="h-10 w-24 border-2 border-black/20 bg-yellow-100" />
        </div>
      </div>
    </div>
  );
}
