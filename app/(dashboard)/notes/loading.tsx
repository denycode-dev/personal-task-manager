import { Skeleton } from "@/components/ui/skeleton";

export default function NotesLoading() {
  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in-50 duration-150">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-8 w-40 border-2 border-black/20" />
          <Skeleton className="h-4 w-60 border border-black/10" />
        </div>
        <Skeleton className="h-10 w-28 border-2 border-black/20 bg-yellow-100" />
      </div>

      {/* Folder filter pills */}
      <div className="flex gap-2 flex-wrap items-center">
        <Skeleton className="h-7 w-16 border-2 border-black/20 bg-yellow-200" />
        <Skeleton className="h-7 w-24 border-2 border-black/20" />
        <Skeleton className="h-7 w-28 border-2 border-black/20" />
        <Skeleton className="h-7 w-20 border-2 border-black/20" />
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="flex flex-col justify-between p-4 border-2 border-black/20 bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,0.1)] space-y-4"
          >
            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-20 border border-black/10" />
                <Skeleton className="h-4 w-12 border border-black/10" />
              </div>
              <Skeleton className="h-5 w-4/5 border border-black/10" />
              <Skeleton className="h-3 w-full border border-black/10" />
            </div>

            <div className="pt-2.5 border-t border-black/10 flex justify-between items-center">
              <Skeleton className="h-3 w-20 border border-black/10" />
              <Skeleton className="h-3 w-12 border border-black/10" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
