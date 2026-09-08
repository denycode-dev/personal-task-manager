import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (session) redirect("/");
  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      {children}
    </main>
  );
}
