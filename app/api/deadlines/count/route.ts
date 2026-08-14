export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { deadlineService } from "@/features/deadlines/services/deadline.service";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ count: 0 }, { status: 401 });
  const count = await deadlineService.getOverdueCount();
  return NextResponse.json({ count });
}
