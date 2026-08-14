import { redirect } from "next/navigation";

// Root → redirects to dashboard home
export default function RootPage() {
  redirect("/dashboard");
}
