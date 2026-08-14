export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notes, noteShares } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const [share] = await db
    .select({ noteId: noteShares.noteId })
    .from(noteShares)
    .where(eq(noteShares.publicSlug, slug));

  if (!share) {
    return NextResponse.json(
      { error: "Catatan tidak ditemukan." },
      { status: 404 }
    );
  }

  const [note] = await db
    .select({ id: notes.id, title: notes.title, content: notes.content })
    .from(notes)
    .where(eq(notes.id, share.noteId));

  if (!note) {
    return NextResponse.json(
      { error: "Catatan tidak ditemukan." },
      { status: 404 }
    );
  }

  return NextResponse.json(note);
}
