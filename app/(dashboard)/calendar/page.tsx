export const dynamic = "force-dynamic";
import { CalendarView } from "@/features/calendar/components/calendar-view";

export default function CalendarPage() {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <CalendarView />
    </div>
  );
}
