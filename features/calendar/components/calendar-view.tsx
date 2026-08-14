"use client";

import { useCallback, useRef, useState, useTransition, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventClickArg, EventSourceFuncArg, EventContentArg } from "@fullcalendar/core";
import {
  createTimelineEventAction,
  deleteTimelineEventAction,
} from "@/features/timeline/actions/timeline.action";
import { useConfirm } from "@/lib/hooks/use-confirm";
import { toast } from "sonner";
import {
  Plus,
  CaretLeft,
  CaretRight,
  CalendarBlank,
  Columns,
  CalendarCheck,
  Kanban,
  CheckSquare,
  Flag,
  Trash,
  Clock,
  Eye,
  EyeSlash,
  Funnel,
  ArrowSquareOut,
} from "@phosphor-icons/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// 12 preset colors for timeline events
const EVENT_COLORS = [
  "#4361EE", "#F72585", "#FF9F1C", "#06D6A0",
  "#FFD500", "#7209B7", "#FF6B6B", "#4CC9F0",
  "#80B918", "#2D6A4F", "#8D99AE", "#FF6B35",
];

type EventForm = {
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  color: string;
};

type SelectedEventDetail = {
  id: string;
  title: string;
  description?: string;
  start: Date | null;
  end: Date | null;
  color?: string;
  type: "kanban" | "checklist" | "timeline";
  url?: string;
};

const emptyForm = (): EventForm => ({
  title: "",
  description: "",
  startAt: new Date().toISOString().slice(0, 16),
  endAt: "",
  color: "#F72585",
});

export function CalendarView() {
  const calRef = useRef<FullCalendar>(null);
  const [currentTitle, setCurrentTitle] = useState("");
  const [currentView, setCurrentView] = useState("dayGridMonth");
  const [isMobile, setIsMobile] = useState(false);

  // Show/Hide Filters
  const [showKanban, setShowKanban] = useState(true);
  const [showChecklist, setShowChecklist] = useState(true);
  const [showTimeline, setShowTimeline] = useState(true);
  const [showFiltersBar, setShowFiltersBar] = useState(false);

  // Forms and Modals
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<EventForm>(emptyForm);
  const [selectedEvent, setSelectedEvent] = useState<SelectedEventDetail | null>(null);
  const [isPending, startTransition] = useTransition();

  const updateCalendarTitle = () => {
    if (calRef.current) {
      const api = calRef.current.getApi();
      setCurrentTitle(api.view.title);
      setCurrentView(api.view.type);
    }
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    setTimeout(updateCalendarTitle, 100);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const fetchEvents = useCallback(
    (
      info: EventSourceFuncArg,
      success: (events: object[]) => void,
      failure: (err: Error) => void
    ) => {
      fetch(
        `/api/calendar/events?start=${encodeURIComponent(info.startStr)}&end=${encodeURIComponent(info.endStr)}`
      )
        .then((r) => r.json())
        .then((rawEvents: any[]) => {
          // Filter according to show/hide toggles
          const filtered = rawEvents.filter((ev) => {
            const type = ev.extendedProps?.type;
            if (type === "kanban" && !showKanban) return false;
            if (type === "checklist" && !showChecklist) return false;
            if (type === "timeline" && !showTimeline) return false;
            return true;
          });
          success(filtered);
        })
        .catch(failure);
    },
    [showKanban, showChecklist, showTimeline]
  );

  // Re-fetch events when filter toggles change
  useEffect(() => {
    calRef.current?.getApi().refetchEvents();
  }, [showKanban, showChecklist, showTimeline]);

  const handlePrev = () => {
    calRef.current?.getApi().prev();
    updateCalendarTitle();
  };

  const handleNext = () => {
    calRef.current?.getApi().next();
    updateCalendarTitle();
  };

  const handleToday = () => {
    calRef.current?.getApi().today();
    updateCalendarTitle();
  };

  const handleViewChange = (viewName: string) => {
    calRef.current?.getApi().changeView(viewName);
    updateCalendarTitle();
  };

  const handleEventClick = (info: EventClickArg) => {
    const type = info.event.extendedProps.type as "kanban" | "checklist" | "timeline";
    setSelectedEvent({
      id: info.event.id,
      title: info.event.title,
      description: info.event.extendedProps.description,
      start: info.event.start,
      end: info.event.end,
      color: info.event.backgroundColor,
      type,
      url: info.event.extendedProps.url,
    });
  };

  const handleDateClick = (arg: { dateStr: string; date: Date }) => {
    setForm({ ...emptyForm(), startAt: arg.dateStr + "T09:00" });
    setFormOpen(true);
  };

  const confirm = useConfirm();

  const handleDeleteTimelineEvent = async (id: string, eventTitle?: string) => {
    const ok = await confirm({
      title: "Hapus Event Timeline",
      message: `Hapus event "${eventTitle || "ini"}" dari kalender?`,
      confirmLabel: "Hapus",
      danger: true,
    });
    if (!ok) return;

    const rawId = id.replace("timeline-", "");
    startTransition(async () => {
      await deleteTimelineEventAction(rawId);
      setSelectedEvent(null);
      calRef.current?.getApi().refetchEvents();
      toast.success("Event timeline berhasil dihapus.");
    });
  };

  const handleSubmit = () => {
    if (!form.title.trim() || !form.startAt) return;
    startTransition(async () => {
      const result = await createTimelineEventAction({
        title: form.title.trim(),
        description: form.description || undefined,
        startAt: form.startAt,
        endAt: form.endAt || undefined,
        color: form.color,
      });
      if (result.success) {
        toast.success("Event berhasil ditambahkan ke kalender.");
        setFormOpen(false);
        setForm(emptyForm());
        calRef.current?.getApi().refetchEvents();
      } else {
        toast.error(result.error);
      }
    });
  };

  // Custom Event Content: seamlessly renders icons and truncated labels for both single-day and multi-day spans
  const renderCustomEvent = (eventInfo: EventContentArg) => {
    const type = eventInfo.event.extendedProps?.type as "kanban" | "checklist" | "timeline" | undefined;
    const isStart = eventInfo.isStart;

    return (
      <div
        className="flex items-center gap-1 w-full px-1 py-0.5 overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer text-[10px] sm:text-[11px] font-black leading-none select-none"
        title={`${eventInfo.event.title} (${eventInfo.timeText || ""})`}
      >
        {isStart && (
          <span className="shrink-0 text-black">
            {type === "kanban" ? (
              <Kanban size={11} weight="bold" />
            ) : type === "checklist" ? (
              <CheckSquare size={11} weight="bold" />
            ) : (
              <Flag size={11} weight="bold" />
            )}
          </span>
        )}
        <span className="truncate flex-1 min-w-0 text-black tracking-tight">
          {eventInfo.event.title}
        </span>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 1. Top Custom Clean Navigation Bar */}
      <div className="border-b-2 border-black bg-white px-3 sm:px-6 py-2.5 sm:py-3 flex-shrink-0 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Month/Year Title & Navigation */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <h1 className="text-base sm:text-xl font-black text-black capitalize truncate max-w-[140px] sm:max-w-none">
              {currentTitle || "Kalender"}
            </h1>

            <div className="flex items-center gap-1">
              <button
                suppressHydrationWarning
                type="button"
                onClick={handlePrev}
                className="p-1 sm:p-1.5 border-2 border-black bg-white hover:bg-neutral-100 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5"
                title="Sebelumnya"
              >
                <CaretLeft size={14} weight="bold" />
              </button>
              <button
                suppressHydrationWarning
                type="button"
                onClick={handleNext}
                className="p-1 sm:p-1.5 border-2 border-black bg-white hover:bg-neutral-100 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5"
                title="Berikutnya"
              >
                <CaretRight size={14} weight="bold" />
              </button>
              <button
                suppressHydrationWarning
                type="button"
                onClick={handleToday}
                className="px-2 py-1 text-[11px] sm:text-xs font-black border-2 border-black bg-yellow-400 hover:bg-yellow-300 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ml-0.5"
              >
                Hari Ini
              </button>
            </div>
          </div>

          {/* Right Controls: Views, Filter toggle, and + Event Button */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {/* View Switcher */}
            <div className="inline-flex border-2 border-black bg-neutral-100 p-0.5 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
              <button
                suppressHydrationWarning
                type="button"
                onClick={() => handleViewChange("dayGridMonth")}
                className={`flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs font-bold transition-colors ${
                  currentView === "dayGridMonth"
                    ? "bg-yellow-400 text-black border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                    : "text-neutral-600 hover:text-black"
                }`}
              >
                <CalendarBlank size={13} weight="bold" />
                <span className="hidden xs:inline sm:inline">Bulan</span>
              </button>
              <button
                suppressHydrationWarning
                type="button"
                onClick={() => handleViewChange("timeGridWeek")}
                className={`flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs font-bold transition-colors ${
                  currentView === "timeGridWeek"
                    ? "bg-yellow-400 text-black border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                    : "text-neutral-600 hover:text-black"
                }`}
              >
                <Columns size={13} weight="bold" />
                <span className="hidden xs:inline sm:inline">Minggu</span>
              </button>
              <button
                suppressHydrationWarning
                type="button"
                onClick={() => handleViewChange("timeGridDay")}
                className={`flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs font-bold transition-colors ${
                  currentView === "timeGridDay"
                    ? "bg-yellow-400 text-black border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                    : "text-neutral-600 hover:text-black"
                }`}
              >
                <CalendarCheck size={13} weight="bold" />
                <span className="hidden xs:inline sm:inline">Hari</span>
              </button>
            </div>

            {/* Filter Show/Hide Toggle Button */}
            <button
              suppressHydrationWarning
              type="button"
              onClick={() => setShowFiltersBar((v) => !v)}
              className={`p-1 sm:p-1.5 text-xs font-bold border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-transform flex items-center gap-1 ${
                showFiltersBar ? "bg-purple-300 text-black" : "bg-white text-neutral-700"
              }`}
              title="Filter Kategori Kalender"
            >
              <Funnel size={15} weight="bold" />
              <span className="hidden md:inline">Filter</span>
            </button>

            {/* Add Event Button */}
            <button
              suppressHydrationWarning
              type="button"
              onClick={() => {
                setForm(emptyForm());
                setFormOpen(true);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-yellow-400 hover:bg-yellow-300 border-2 border-black font-black text-xs sm:text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5"
            >
              <Plus size={15} weight="bold" />
              <span className="hidden xs:inline">Tambah Event</span>
              <span className="xs:hidden">Event</span>
            </button>
          </div>
        </div>

        {/* 2. Collapsible Show/Hide Filter Chips */}
        {showFiltersBar && (
          <div className="flex items-center gap-1.5 pt-2 border-t border-black/10 flex-wrap text-[11px] animate-in fade-in slide-in-from-top-1 duration-150">
            <span className="font-black text-neutral-500 mr-1">Tampilkan:</span>

            {/* Kanban Toggle */}
            <button
              suppressHydrationWarning
              type="button"
              onClick={() => setShowKanban((v) => !v)}
              className={`inline-flex items-center gap-1 px-2 py-0.5 font-black border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all ${
                showKanban
                  ? "bg-blue-100 text-blue-900 border-blue-900"
                  : "bg-neutral-100 text-neutral-400 opacity-60 line-through"
              }`}
            >
              <Kanban size={13} weight="bold" />
              <span>Deadline Kanban</span>
              {showKanban ? <Eye size={11} weight="bold" /> : <EyeSlash size={11} />}
            </button>

            {/* Checklist Toggle */}
            <button
              suppressHydrationWarning
              type="button"
              onClick={() => setShowChecklist((v) => !v)}
              className={`inline-flex items-center gap-1 px-2 py-0.5 font-black border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all ${
                showChecklist
                  ? "bg-emerald-100 text-emerald-900 border-emerald-900"
                  : "bg-neutral-100 text-neutral-400 opacity-60 line-through"
              }`}
            >
              <CheckSquare size={13} weight="bold" />
              <span>Deadline Checklist</span>
              {showChecklist ? <Eye size={11} weight="bold" /> : <EyeSlash size={11} />}
            </button>

            {/* Timeline Toggle */}
            <button
              suppressHydrationWarning
              type="button"
              onClick={() => setShowTimeline((v) => !v)}
              className={`inline-flex items-center gap-1 px-2 py-0.5 font-black border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all ${
                showTimeline
                  ? "bg-pink-100 text-pink-900 border-pink-900"
                  : "bg-neutral-100 text-neutral-400 opacity-60 line-through"
              }`}
            >
              <Flag size={13} weight="bold" />
              <span>Event Timeline</span>
              {showTimeline ? <Eye size={11} weight="bold" /> : <EyeSlash size={11} />}
            </button>
          </div>
        )}
      </div>

      {/* 3. FullCalendar Grid Container with Solid Neobrutalism Multi-Day Block Support */}
      <div className="flex-1 overflow-auto p-2 sm:p-4 
        [&_.fc]:!font-sans
        [&_.fc-theme-standard_td]:!border-black/20 
        [&_.fc-theme-standard_th]:!border-black/30 
        [&_.fc-col-header-cell]:!bg-neutral-100 
        [&_.fc-col-header-cell]:!py-1.5 
        [&_.fc-col-header-cell-cushion]:!font-black 
        [&_.fc-col-header-cell-cushion]:!text-xs 
        [&_.fc-col-header-cell-cushion]:!text-black 
        [&_.fc-daygrid-day-number]:!font-black 
        [&_.fc-daygrid-day-number]:!text-[11px] sm:[&_.fc-daygrid-day-number]:!text-xs 
        [&_.fc-daygrid-day-number]:!p-1 
        [&_.fc-day-today]:!bg-yellow-50/80 
        [&_.fc-daygrid-day-frame]:!overflow-hidden
        [&_.fc-daygrid-day-events]:!overflow-hidden
        [&_.fc-daygrid-event-harness]:!max-w-full
        [&_.fc-daygrid-event-harness]:!mb-1
        [&_.fc-daygrid-event]:!border-2
        [&_.fc-daygrid-event]:!border-black
        [&_.fc-daygrid-event]:!shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]
        [&_.fc-daygrid-event]:!rounded-xs
        [&_.fc-daygrid-event]:!overflow-hidden
        [&_.fc-daygrid-block-event]:!border-2
        [&_.fc-daygrid-block-event]:!border-black
        [&_.fc-daygrid-block-event]:!shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]
        [&_.fc-daygrid-block-event]:!rounded-xs
        [&_.fc-daygrid-block-event]:!min-h-[20px]
        [&_.fc-daygrid-dot-event]:!border-2
        [&_.fc-daygrid-dot-event]:!border-black
        [&_.fc-daygrid-dot-event]:!shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]
        [&_.fc-daygrid-dot-event]:!rounded-xs
        [&_.fc-daygrid-dot]:!hidden
        [&_.fc-timegrid-event]:!border-2
        [&_.fc-timegrid-event]:!border-black
        [&_.fc-timegrid-event]:!shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
        [&_.fc-timegrid-event]:!rounded-xs
        [&_.fc-daygrid-day]:!cursor-pointer 
        [&_.fc-more-link]:!font-black 
        [&_.fc-more-link]:!text-[10px] 
        [&_.fc-more-link]:!text-black 
        [&_.fc-more-link]:!bg-neutral-200 
        [&_.fc-more-link]:!border 
        [&_.fc-more-link]:!border-black 
        [&_.fc-more-link]:!px-1.5 
        [&_.fc-more-link]:!py-0.5 
        [&_.fc-more-link]:!rounded-xs
        [&_.fc-more-link]:!inline-block
        [&_.fc-more-link]:!mt-0.5
        [&_.fc-popover]:!border-2 
        [&_.fc-popover]:!border-black 
        [&_.fc-popover]:!shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] 
        [&_.fc-popover]:!bg-white
        [&_.fc-popover-header]:!bg-yellow-400 
        [&_.fc-popover-header]:!font-black 
        [&_.fc-popover-header]:!border-b-2 
        [&_.fc-popover-header]:!border-black 
        [&_.fc-popover-header]:!p-2
        [&_.fc-popover-body]:!p-2
        [&_.fc-popover-body]:!space-y-1.5"
      >
        <FullCalendar
          ref={calRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale="id"
          headerToolbar={false}
          events={fetchEvents}
          eventClick={handleEventClick}
          dateClick={handleDateClick}
          height="100%"
          eventDisplay="block"
          nextDayThreshold="00:00:00"
          dayMaxEvents={isMobile ? 2 : 3}
          moreLinkContent={(args) => `+${args.num} lainnya`}
          eventContent={renderCustomEvent}
          nowIndicator
          editable={false}
          selectable
        />
      </div>

      {/* 4. Event Detail Modal */}
      {selectedEvent && (
        <Dialog open={!!selectedEvent} onOpenChange={(o) => !o && setSelectedEvent(null)}>
          <DialogContent className="border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] max-w-md bg-white p-5 space-y-4 animate-in fade-in zoom-in-95">
            <DialogHeader className="border-b-2 border-black pb-3">
              <div className="flex items-center gap-2">
                <span
                  className="p-1.5 border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                  style={{ backgroundColor: selectedEvent.color || "#FFD500" }}
                >
                  {selectedEvent.type === "kanban" ? (
                    <Kanban size={18} weight="bold" />
                  ) : selectedEvent.type === "checklist" ? (
                    <CheckSquare size={18} weight="bold" />
                  ) : (
                    <Flag size={18} weight="bold" />
                  )}
                </span>
                <div>
                  <span className="text-[10px] font-black uppercase text-neutral-500">
                    {selectedEvent.type === "kanban"
                      ? "Kartu Kanban"
                      : selectedEvent.type === "checklist"
                        ? "Checklist Item"
                        : "Event Timeline"}
                  </span>
                  <DialogTitle className="font-black text-base text-black">
                    {selectedEvent.title}
                  </DialogTitle>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2 text-neutral-700 bg-neutral-50 p-2.5 border border-black">
                <Clock size={16} weight="bold" className="shrink-0 text-black" />
                <div>
                  <p className="font-bold text-black">
                    {selectedEvent.start
                      ? new Date(selectedEvent.start).toLocaleString("id-ID", {
                          dateStyle: "full",
                          timeStyle: "short",
                        })
                      : "-"}
                  </p>
                  {selectedEvent.end && (
                    <p className="text-muted-foreground mt-0.5">
                      Sampai:{" "}
                      {new Date(selectedEvent.end).toLocaleString("id-ID", {
                        dateStyle: "full",
                        timeStyle: "short",
                      })}
                    </p>
                  )}
                </div>
              </div>

              {selectedEvent.description && (
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Deskripsi:</label>
                  <p className="p-2.5 bg-neutral-50 border border-black leading-relaxed whitespace-pre-wrap font-medium">
                    {selectedEvent.description}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t-2 border-black/10">
              {selectedEvent.type === "timeline" ? (
                <button
                  suppressHydrationWarning
                  type="button"
                  onClick={() => handleDeleteTimelineEvent(selectedEvent.id, selectedEvent.title)}
                  disabled={isPending}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 border-2 border-red-600"
                >
                  <Trash size={14} weight="bold" />
                  <span>Hapus Event</span>
                </button>
              ) : selectedEvent.url ? (
                <a
                  href={selectedEvent.url}
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-black bg-yellow-400 hover:bg-yellow-300 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                  <span>Buka Sumber</span>
                  <ArrowSquareOut size={14} weight="bold" />
                </a>
              ) : (
                <div />
              )}

              <button
                suppressHydrationWarning
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-1.5 text-xs font-bold bg-neutral-100 hover:bg-neutral-200 border-2 border-black"
              >
                Tutup
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 5. Add Timeline Event Dialog */}
      <Dialog open={formOpen} onOpenChange={(o) => !o && setFormOpen(false)}>
        <DialogContent className="border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] max-w-md bg-white p-5">
          <DialogHeader className="border-b-2 border-black pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-yellow-400 border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                <Flag size={18} weight="bold" />
              </span>
              <DialogTitle className="font-black text-base text-black">
                Tambah Event Timeline
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="space-y-3 mt-3">
            <div>
              <label className="block text-xs font-bold mb-1 text-black">Judul Event *</label>
              <input
                suppressHydrationWarning
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Nama kegiatan atau event..."
                className="w-full border-2 border-black px-3 py-2 text-xs focus:outline-none focus:bg-yellow-50"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold mb-1 text-black">Waktu Mulai *</label>
                <input
                  suppressHydrationWarning
                  type="datetime-local"
                  value={form.startAt}
                  onChange={(e) => setForm((f) => ({ ...f, startAt: e.target.value }))}
                  className="w-full border-2 border-black px-2.5 py-1.5 text-xs focus:outline-none focus:bg-yellow-50"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-black">Waktu Selesai</label>
                <input
                  suppressHydrationWarning
                  type="datetime-local"
                  value={form.endAt}
                  onChange={(e) => setForm((f) => ({ ...f, endAt: e.target.value }))}
                  className="w-full border-2 border-black px-2.5 py-1.5 text-xs focus:outline-none focus:bg-yellow-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1 text-black">Deskripsi</label>
              <textarea
                suppressHydrationWarning
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                placeholder="Catatan tambahan (opsional)..."
                className="w-full border-2 border-black px-3 py-2 text-xs focus:outline-none focus:bg-yellow-50 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1.5 text-black">Pilihan Warna</label>
              <div className="flex gap-1.5 flex-wrap">
                {EVENT_COLORS.map((c) => (
                  <button
                    suppressHydrationWarning
                    key={c}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, color: c }))}
                    style={{ backgroundColor: c }}
                    className={`w-6 h-6 border-2 transition-transform ${
                      form.color === c
                        ? "border-black scale-125 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        : "border-transparent hover:border-black"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t-2 border-black/10">
              <button
                suppressHydrationWarning
                type="button"
                onClick={() => setFormOpen(false)}
                className="px-3 py-1.5 text-xs font-bold border-2 border-black bg-neutral-100 hover:bg-neutral-200"
              >
                Batal
              </button>
              <button
                suppressHydrationWarning
                type="button"
                onClick={handleSubmit}
                disabled={isPending || !form.title.trim() || !form.startAt}
                className="px-4 py-1.5 text-xs font-black bg-yellow-400 hover:bg-yellow-300 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50"
              >
                {isPending ? "Menyimpan…" : "Simpan Event"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
