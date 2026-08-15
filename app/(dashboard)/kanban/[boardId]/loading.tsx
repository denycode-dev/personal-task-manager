import { Skeleton } from "@/components/ui/skeleton";

export default function KanbanBoardDetailLoading() {
  return (
    <div className="flex flex-col h-screen overflow-hidden animate-in fade-in-50 duration-150">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 border-b-2 border-black/20 bg-white">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-16 border border-black/10" />
          <span className="text-black/30">/</span>
          <Skeleton className="h-5 w-40 border border-black/10" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-28 border-2 border-black/20" />
          <Skeleton className="h-7 w-8 border-2 border-black/20" />
        </div>
      </div>

      {/* Kanban columns */}
      <div className="flex-1 p-4 sm:p-6 overflow-x-auto flex gap-4 bg-neutral-50/50">
        {[1, 2, 3].map((col) => (
          <div
            key={col}
            className="w-72 sm:w-80 shrink-0 border-2 border-black/20 bg-white p-3 space-y-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.1)] flex flex-col max-h-[calc(100vh-8rem)]"
          >
            <div className="flex justify-between items-center pb-2 border-b border-black/10">
              <Skeleton className="h-5 w-24 border border-black/10" />
              <Skeleton className="h-5 w-6 border border-black/10" />
            </div>

            <div className="space-y-2.5 flex-1">
              {[1, 2, 3].map((card) => (
                <div
                  key={card}
                  className="p-3 border-2 border-black/10 bg-white space-y-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.05)]"
                >
                  <Skeleton className="h-4 w-5/6 border border-black/10" />
                  <Skeleton className="h-3 w-1/2 border border-black/10" />
                </div>
              ))}
            </div>

            <Skeleton className="h-8 w-full border-2 border-black/10" />
          </div>
        ))}
      </div>
    </div>
  );
}
