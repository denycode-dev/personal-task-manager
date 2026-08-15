import { Skeleton } from "@/components/ui/skeleton";

export default function KanbanLoading() {
  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in-50 duration-150">
      {/* Header */}
      <div className="space-y-1.5">
        <Skeleton className="h-8 w-44 border-2 border-black/20" />
        <Skeleton className="h-4 w-72 border border-black/10" />
      </div>

      {/* Create form skeleton */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Skeleton className="h-10 flex-1 border-2 border-black/20" />
        <Skeleton className="h-10 w-36 border-2 border-black/20" />
        <Skeleton className="h-10 w-28 border-2 border-black/20 bg-yellow-100" />
      </div>

      {/* Folder pills skeleton */}
      <div className="flex gap-2 flex-wrap items-center">
        <Skeleton className="h-7 w-16 border-2 border-black/20 bg-yellow-200" />
        <Skeleton className="h-7 w-24 border-2 border-black/20" />
        <Skeleton className="h-7 w-20 border-2 border-black/20" />
      </div>

      {/* Kanban Boards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="flex flex-col justify-between p-4 border-2 border-black/20 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] space-y-4"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="w-8 h-8 border border-black/20 bg-blue-100" />
                <Skeleton className="h-5 flex-1 border border-black/10" />
              </div>
              <Skeleton className="h-4 w-20 border border-black/10" />
            </div>

            <div className="pt-2.5 border-t border-black/10 flex justify-between items-center">
              <Skeleton className="h-3 w-20 border border-black/10" />
              <Skeleton className="h-3 w-16 border border-black/10" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
