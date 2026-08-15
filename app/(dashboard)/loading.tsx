import { Skeleton } from "@/components/ui/skeleton";

export default function GlobalDashboardLoading() {
  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in-50 duration-150">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 border-2 border-black/20" />
        <Skeleton className="h-4 w-72 border border-black/10" />
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="p-4 border-2 border-black/20 bg-white space-y-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]"
          >
            <div className="flex items-center gap-2">
              <Skeleton className="w-8 h-8 rounded-none border border-black/20" />
              <Skeleton className="h-5 flex-1 border border-black/10" />
            </div>
            <Skeleton className="h-12 w-full border border-black/10" />
            <div className="pt-2 border-t border-black/10 flex justify-between items-center">
              <Skeleton className="h-3 w-20 border border-black/10" />
              <Skeleton className="h-3 w-16 border border-black/10" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
