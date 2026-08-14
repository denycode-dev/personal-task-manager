export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { noteService } from "@/features/notes/services/note.service";

export default async function NewNotePage() {
  const note = await noteService.create({ title: "Catatan tanpa judul" });
  redirect(`/notes/${note.id}`);
}
