"use client";
import { useState } from "react";
import { useAppStore } from "@/stores/app";
import { useCalendarMonth, useScheduledPosts, useOptimalTime, useSchedulePost, useUnschedule, useDrafts } from "@/hooks";
import { fmt, publishStatusConfig, cn } from "@/lib/utils";
import {
  ChevronLeft, ChevronRight, Calendar, Zap, Clock,
  CheckCircle, AlertCircle, Loader2, Plus, Instagram
} from "lucide-react";
import toast from "react-hot-toast";
import { format, getDaysInMonth, startOfMonth, getDay, addMonths, subMonths, parseISO } from "date-fns";
import type { CalendarDay, ScheduledPost, DraftContent } from "@/types";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ── Schedule modal ─────────────────────────────────────────────────────────────
function ScheduleModal({
  draft, date, workspaceId, onClose
}: {
  draft: DraftContent; date: Date; workspaceId: string; onClose: () => void
}) {
  const [hour, setHour]     = useState(9);
  const [minute, setMinute] = useState(0);
  const [useAI, setUseAI]   = useState(false);
  const schedule = useSchedulePost();
  const { data: optimal }   = useOptimalTime(workspaceId);

  const handleSchedule = async () => {
    const dt = new Date(date);
    dt.setHours(hour, minute, 0, 0);
    try {
      await schedule.mutateAsync({
        workspace_id: workspaceId,
        draft_content_id: draft.id,
        scheduled_at: dt.toISOString(),
        use_optimal_time: useAI,
      });
      toast.success("Post scheduled!");
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Failed to schedule");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="card max-w-sm w-full p-5 space-y-4" onClick={e => e.stopPropagation()}>
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Schedule post</h3>
        <p className="text-sm text-gray-500">{format(date, "EEEE, MMMM d, yyyy")}</p>

        {/* Caption preview */}
        {draft.current_version?.image_url && (
          <img src={draft.current_version.image_url} alt="" className="w-full h-32 object-cover rounded-lg" />
        )}
        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
          {draft.current_version?.caption}
        </p>

        {/* Time picker */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={useAI} onChange={e => setUseAI(e.target.checked)} className="accent-violet-500 w-4 h-4" />
            <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-violet-500" /> Use AI optimal time
            </span>
          </label>

          {!useAI && (
            <div className="flex items-center gap-2">
              <select className="input text-sm" value={hour} onChange={e => setHour(+e.target.value)}>
                {Array.from({length:24}, (_,i) => <option key={i} value={i}>{String(i).padStart(2,"0")}:00</option>)}
              </select>
              <span className="text-gray-400">:</span>
              <select className="input text-sm" value={minute} onChange={e => setMinute(+e.target.value)}>
                {[0,15,30,45].map(m => <option key={m} value={m}>{String(m).padStart(2,"0")}</option>)}
              </select>
            </div>
          )}

          {useAI && optimal?.next_suggested_at && (
            <p className="text-xs text-violet-600 bg-violet-50 dark:bg-violet-900/20 px-3 py-2 rounded-lg">
              AI suggests: {fmt.datetime(optimal.next_suggested_at)}
            </p>
          )}
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={handleSchedule} disabled={schedule.isPending} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {schedule.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
            Schedule
          </button>
          <button onClick={onClose} className="btn-secondary px-4">Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Calendar cell ──────────────────────────────────────────────────────────────
function CalendarCell({
  day, isToday, isOptimal, posts, onScheduleClick
}: {
  day: CalendarDay | null;
  isToday: boolean;
  isOptimal: boolean;
  posts: ScheduledPost[];
  onScheduleClick: (date: string) => void;
}) {
  if (!day) return <div className="h-28 rounded-lg" />;

  return (
    <div
      className={cn(
        "h-28 rounded-xl border p-2 flex flex-col gap-1 transition-colors group",
        isToday
          ? "border-pink-300 dark:border-pink-800 bg-pink-50/50 dark:bg-pink-950/20"
          : isOptimal
          ? "border-violet-200 dark:border-violet-800/50 bg-violet-50/30 dark:bg-violet-950/10"
          : "border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700"
      )}
    >
      <div className="flex items-center justify-between">
        <span className={cn(
          "text-xs font-semibold",
          isToday ? "text-pink-600 dark:text-pink-400"
            : isOptimal ? "text-violet-600 dark:text-violet-400"
            : "text-gray-500 dark:text-gray-500"
        )}>
          {parseInt(day.date.split("-")[2])}
        </span>
        <div className="flex items-center gap-1">
          {isOptimal && <Zap className="w-3 h-3 text-violet-400" />}
          <button
            onClick={() => onScheduleClick(day.date)}
            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
          >
            <Plus className="w-3 h-3 text-gray-400" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-0.5 no-scrollbar">
        {posts.slice(0, 3).map(p => {
          const cfg = publishStatusConfig[p.publish_status];
          return (
            <div key={p.id} className={cn("px-1.5 py-0.5 rounded text-xs truncate font-medium", cfg.bg, cfg.color)}>
              {fmt.time(p.scheduled_at)} · {p.caption_snapshot.slice(0, 18)}…
            </div>
          );
        })}
        {posts.length > 3 && (
          <div className="text-xs text-gray-400 px-1">+{posts.length - 3} more</div>
        )}
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function CalendarPage() {
  const { workspaceId }  = useAppStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedulingDate, setSchedulingDate] = useState<string | null>(null);
  const [selectedDraft, setSelectedDraft]   = useState<DraftContent | null>(null);

  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const { data: calendar, isLoading } = useCalendarMonth(workspaceId, year, month);
  const { data: approvedDrafts }       = useDrafts(workspaceId, "approved");
  const { data: optimal }              = useOptimalTime(workspaceId);

  const optimalDays = new Set(optimal?.suggested_slots.map(s => s.day_of_week) ?? []);

  // Build calendar grid (42 cells = 6 rows × 7 cols)
  const firstDow  = getDay(startOfMonth(currentDate));
  const daysCount = getDaysInMonth(currentDate);
  const cells: (CalendarDay | null)[] = [
    ...Array(firstDow).fill(null),
    ...(calendar?.days ?? []),
    ...Array(Math.max(0, 42 - firstDow - daysCount)).fill(null),
  ];

  const today = format(new Date(), "yyyy-MM-dd");

  const handleCellScheduleClick = (date: string) => {
    if (!approvedDrafts?.items.length) {
      toast("No approved drafts to schedule. Approve some content first.", { icon: "ℹ️" });
      return;
    }
    setSchedulingDate(date);
    setSelectedDraft(approvedDrafts.items[0]);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Calendar</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {calendar?.total_scheduled ?? 0} scheduled · {calendar?.total_published ?? 0} published · {calendar?.total_failed ?? 0} failed
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentDate(d => subMonths(d, 1))} className="btn-ghost p-2">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 min-w-[120px] text-center">
            {format(currentDate, "MMMM yyyy")}
          </span>
          <button onClick={() => setCurrentDate(d => addMonths(d, 1))} className="btn-ghost p-2">
            <ChevronRight className="w-5 h-5" />
          </button>
          <button onClick={() => setCurrentDate(new Date())} className="btn-secondary text-xs">Today</button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded border border-pink-300 bg-pink-50" /> Today
        </span>
        <span className="flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-violet-400" /> Optimal posting day
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-blue-100" /> Scheduled
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-emerald-100" /> Published
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
        </div>
      ) : (
        <>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1.5 mb-1">
            {DAY_NAMES.map(d => (
              <div key={d} className="text-center text-xs font-medium text-gray-400 dark:text-gray-600 py-1">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {cells.map((day, i) => {
              const dayPosts = day
                ? calendar?.days.find(d => d.date === day.date)?.scheduled_posts ?? []
                : [];
              const dateObj = day ? parseISO(day.date) : null;
              const isOptimal = dateObj ? optimalDays.has(dateObj.getDay() === 0 ? 6 : dateObj.getDay() - 1) : false;

              return (
                <CalendarCell
                  key={i}
                  day={day}
                  isToday={day?.date === today}
                  isOptimal={isOptimal}
                  posts={dayPosts}
                  onScheduleClick={handleCellScheduleClick}
                />
              );
            })}
          </div>
        </>
      )}

      {/* Draft selector for scheduling */}
      {schedulingDate && approvedDrafts && approvedDrafts.items.length > 0 && (
        <div className="card p-4 space-y-3 border-blue-200 dark:border-blue-900/40">
          <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100">
            Schedule for {format(parseISO(schedulingDate), "MMMM d")}
          </h3>
          <div className="grid gap-2">
            {approvedDrafts.items.slice(0, 4).map(d => (
              <button
                key={d.id}
                onClick={() => setSelectedDraft(d)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border text-left transition-colors",
                  selectedDraft?.id === d.id
                    ? "border-pink-400 bg-pink-50 dark:bg-pink-950/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                )}
              >
                {d.current_version?.image_url && (
                  <img src={d.current_version.image_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                )}
                <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-2 flex-1">
                  {d.current_version?.caption?.slice(0, 80)}
                </p>
                {selectedDraft?.id === d.id && <CheckCircle className="w-4 h-4 text-pink-500 flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Schedule modal */}
      {schedulingDate && selectedDraft && (
        <ScheduleModal
          draft={selectedDraft}
          date={parseISO(schedulingDate)}
          workspaceId={workspaceId}
          onClose={() => { setSchedulingDate(null); setSelectedDraft(null); }}
        />
      )}
    </div>
  );
}
