import { Skeleton } from "@/components/ui/skeleton";

export default function NoteEditorLoading() {
  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] animate-in fade-in-50 duration-150">
      {/* Top Header Controls Bar */}
      <div className="flex items-center justify-between gap-2 px-4 py-2 border-b-2 border-black/20 bg-white">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-14 border border-black/10" />
          <span className="text-black/30">/</span>
          <Skeleton className="h-5 w-32 border border-black/10" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-20 border-2 border-black/20" />
          <Skeleton className="h-7 w-16 border-2 border-black/20" />
          <Skeleton className="h-7 w-8 border-2 border-black/20" />
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 p-6 md:p-10 max-w-4xl w-full mx-auto space-y-6">
        <Skeleton className="h-10 w-3/4 border-2 border-black/20" />
        <div className="space-y-3 pt-4">
          <Skeleton className="h-4 w-full border border-black/10" />
          <Skeleton className="h-4 w-5/6 border border-black/10" />
          <Skeleton className="h-4 w-4/6 border border-black/10" />
          <Skeleton className="h-4 w-full border border-black/10" />
          <Skeleton className="h-4 w-3/4 border border-black/10" />
        </div>
      </div>
    </div>
  );
}
