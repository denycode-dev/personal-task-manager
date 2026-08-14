export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { calendarService } from "@/features/calendar/services/calendar.service";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json([], { status: 401 });
  const { searchParams } = request.nextUrl;
  const startParam = searchParams.get("start");
  const endParam = searchParams.get("end");
  const start = startParam ? new Date(startParam) : new Date();
  const end = endParam ? new Date(endParam) : new Date(Date.now() + 30 * 86400000);
  const events = await calendarService.getEvents(start, end);
  return NextResponse.json(events);
}
