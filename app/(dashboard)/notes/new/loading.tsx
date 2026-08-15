import { Skeleton } from "@/components/ui/skeleton";

export default function NewNoteLoading() {
  return (
    <div className="flex flex-col h-screen animate-in fade-in-50 duration-150">
      {/* Top Header Controls Skeleton */}
      <div className="flex items-center justify-between gap-2 px-4 sm:px-6 py-2 border-b border-black/20 bg-white text-sm">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-16 border border-black/10" />
          <span className="text-black/30">/</span>
          <Skeleton className="h-5 w-40 border border-black/10" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-28 border-2 border-black/20" />
          <Skeleton className="h-7 w-20 border-2 border-black/20" />
          <Skeleton className="h-7 w-8 border-2 border-black/20" />
        </div>
      </div>

      {/* Editor Canvas Skeleton */}
      <div className="flex-1 p-6 sm:p-8 max-w-4xl mx-auto w-full space-y-4">
        <Skeleton className="h-10 w-3/4 border-2 border-black/20" />
        <Skeleton className="h-10 w-full border-2 border-black/20 bg-neutral-100" />
        <div className="space-y-3 pt-4">
          <Skeleton className="h-4 w-full border border-black/10" />
          <Skeleton className="h-4 w-5/6 border border-black/10" />
          <Skeleton className="h-4 w-4/6 border border-black/10" />
        </div>
      </div>
    </div>
  );
}
