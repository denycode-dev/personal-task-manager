export function ErrorState({
  message = "Terjadi kesalahan. Silakan coba lagi.",
}: {
  message?: string;
}) {
  return (
    <div className="flex items-center justify-center py-12">
      <p className="text-destructive font-medium">{message}</p>
    </div>
  );
}
