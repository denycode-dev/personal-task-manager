import { Skeleton } from "@/components/ui/skeleton";

export default function ChecklistsLoading() {
  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in-50 duration-150">
      {/* Header */}
      <div className="space-y-1.5">
        <Skeleton className="h-8 w-44 border-2 border-black/20" />
        <Skeleton className="h-4 w-72 border border-black/10" />
      </div>

      {/* Create form skeleton */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Skeleton className="h-10 flex-1 border-2 border-black/20" />
        <Skeleton className="h-10 w-36 border-2 border-black/20" />
        <Skeleton className="h-10 w-32 border-2 border-black/20 bg-yellow-100" />
      </div>

      {/* Folder filter pills */}
      <div className="flex gap-2 flex-wrap items-center">
        <Skeleton className="h-7 w-16 border-2 border-black/20 bg-yellow-200" />
        <Skeleton className="h-7 w-24 border-2 border-black/20" />
        <Skeleton className="h-7 w-20 border-2 border-black/20" />
      </div>

      {/* Checklists List */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between p-4 border-2 border-black/20 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]"
          >
            <div className="flex items-center gap-3 flex-1">
              <Skeleton className="w-9 h-9 border-2 border-black/20 bg-emerald-100 shrink-0" />
              <div className="space-y-1.5 flex-1 max-w-md">
                <Skeleton className="h-5 w-3/4 border border-black/10" />
                <Skeleton className="h-3 w-1/3 border border-black/10" />
              </div>
            </div>
            <Skeleton className="h-4 w-16 border border-black/10" />
          </div>
        ))}
      </div>
    </div>
  );
}
