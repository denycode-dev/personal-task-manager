import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-6xl mx-auto animate-in fade-in-50 duration-150">
      {/* 1. Header Banner */}
      <div className="p-6 border-2 border-black/20 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] space-y-3">
        <Skeleton className="h-7 w-64 border border-black/10" />
        <Skeleton className="h-4 w-40 border border-black/10" />
      </div>

      {/* 2. Executive Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-4 border-2 border-black/20 bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,0.1)] space-y-2"
          >
            <div className="flex justify-between items-center">
              <Skeleton className="h-3 w-16 border border-black/10" />
              <Skeleton className="w-6 h-6 border border-black/10" />
            </div>
            <Skeleton className="h-8 w-12 border border-black/10" />
          </div>
        ))}
      </div>

      {/* 3. Navigation Hub Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-4 border-2 border-black/20 bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,0.1)] space-y-3"
          >
            <div className="flex items-center gap-2">
              <Skeleton className="w-8 h-8 border border-black/10" />
              <Skeleton className="h-4 w-24 border border-black/10" />
            </div>
            <Skeleton className="h-10 w-full border border-black/10" />
          </div>
        ))}
      </div>

      {/* 4. Activity Reports Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="p-5 border-2 border-black/20 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] space-y-4"
          >
            <div className="flex justify-between items-center border-b border-black/10 pb-3">
              <Skeleton className="h-5 w-36 border border-black/10" />
              <Skeleton className="h-4 w-16 border border-black/10" />
            </div>
            <div className="space-y-2.5">
              {[1, 2, 3].map((j) => (
                <div key={j} className="p-2.5 border border-black/10 flex items-center justify-between">
                  <div className="space-y-1 flex-1">
                    <Skeleton className="h-4 w-3/4 border border-black/10" />
                    <Skeleton className="h-3 w-1/3 border border-black/10" />
                  </div>
                  <Skeleton className="h-4 w-12 border border-black/10" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
