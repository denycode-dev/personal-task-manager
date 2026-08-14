export function LoadingState({ message = "Memuat..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <p className="text-muted-foreground animate-pulse">{message}</p>
    </div>
  );
}
