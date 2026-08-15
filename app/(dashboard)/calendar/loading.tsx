import { Skeleton } from "@/components/ui/skeleton";

export default function CalendarLoading() {
  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in-50 duration-150">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-8 w-36 border-2 border-black/20" />
          <Skeleton className="h-4 w-64 border border-black/10" />
        </div>
        <Skeleton className="h-10 w-36 border-2 border-black/20 bg-yellow-100" />
      </div>

      {/* Calendar Card Skeleton */}
      <div className="p-4 border-2 border-black/20 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] space-y-4">
        {/* Calendar Nav controls */}
        <div className="flex justify-between items-center pb-3 border-b border-black/10">
          <div className="flex gap-2">
            <Skeleton className="h-8 w-16 border-2 border-black/20" />
            <Skeleton className="h-8 w-16 border-2 border-black/20" />
            <Skeleton className="h-8 w-16 border-2 border-black/20" />
          </div>
          <Skeleton className="h-6 w-32 border border-black/10" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20 border-2 border-black/20" />
            <Skeleton className="h-8 w-20 border-2 border-black/20" />
          </div>
        </div>

        {/* 7 columns grid header */}
        <div className="grid grid-cols-7 gap-2">
          {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((day) => (
            <Skeleton key={day} className="h-6 w-full border border-black/10" />
          ))}
        </div>

        {/* 5 weeks rows grid */}
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <div
              key={i}
              className="h-20 sm:h-24 border border-black/10 p-1.5 flex flex-col justify-between bg-neutral-50/50"
            >
              <Skeleton className="h-3 w-5 border border-black/10" />
              {i % 4 === 1 && (
                <Skeleton className="h-4 w-full border border-black/10 bg-yellow-100" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
