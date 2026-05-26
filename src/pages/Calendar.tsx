import { useState } from "react";
import { ChevronLeft, ChevronRight, Zap, Plus, Loader2, CheckCircle } from "lucide-react";
import { format, getDaysInMonth, startOfMonth, getDay, addMonths, subMonths, parseISO } from "date-fns";
import { useAppStore } from "@/stores/app";
import { useCalendarMonth, useOptimalTime, useSchedulePost, useDrafts } from "@/hooks";
import { fmt, publishStatusConfig, cn, HOUR_LABELS, DAY_LABELS } from "@/lib/utils";
import { PageSpinner, Modal, PublishBadge } from "@/components/shared";
import toast from "react-hot-toast";
import type { CalendarDay, ScheduledPost, DraftContent } from "@/types";

function CalendarCell({ day, isToday, isOptimal, posts, onAdd }: {
  day: CalendarDay | null; isToday: boolean; isOptimal: boolean;
  posts: ScheduledPost[]; onAdd: (date: string) => void;
}) {
  if (!day) return <div className="h-28 rounded-lg" />;
  return (
    <div className={cn("h-28 rounded-xl border p-2 flex flex-col gap-1 group transition-colors",
      isToday ? "border-pink-300 bg-pink-50/50" : isOptimal ? "border-violet-200 bg-violet-50/30" : "border-gray-100 hover:border-gray-200")}>
      <div className="flex items-center justify-between">
        <span className={cn("text-xs font-semibold", isToday ? "text-pink-600" : isOptimal ? "text-violet-600" : "text-gray-500")}>
          {parseInt(day.date.split("-")[2])}
        </span>
        <div className="flex items-center gap-1">
          {isOptimal && <Zap className="w-3 h-3 text-violet-400" />}
          <button onClick={() => onAdd(day.date)} className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-gray-100 transition-all">
            <Plus className="w-3 h-3 text-gray-400" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto space-y-0.5">
        {posts.slice(0, 3).map(p => {
          const cfg = publishStatusConfig[p.publish_status];
          return (
            <div key={p.id} className={cn("px-1.5 py-0.5 rounded text-xs truncate font-medium", cfg.bg, cfg.color)}>
              {fmt.time(p.scheduled_at)} · {p.caption_snapshot.slice(0, 16)}…
            </div>
          );
        })}
        {posts.length > 3 && <p className="text-xs text-gray-400 px-1">+{posts.length - 3}</p>}
      </div>
    </div>
  );
}

export function CalendarPage() {
  const { workspaceId }  = useAppStore();
  const [cur, setCur]    = useState(new Date());
  const [schedDate, setSchedDate]     = useState<string | null>(null);
  const [selectedDraft, setSelectedDraft] = useState<DraftContent | null>(null);
  const [schedHour, setSchedHour]     = useState(9);
  const [useAI, setUseAI]             = useState(false);

  const year = cur.getFullYear(), month = cur.getMonth() + 1;
  const { data: calendar, isLoading } = useCalendarMonth(workspaceId, year, month);
  const { data: approved }            = useDrafts(workspaceId, "approved");
  const { data: optimal }             = useOptimalTime(workspaceId);
  const schedule                      = useSchedulePost();

  const optimalDays = new Set(optimal?.suggested_slots.map(s => s.day_of_week) ?? []);
  const today       = format(new Date(), "yyyy-MM-dd");
  const firstDow    = getDay(startOfMonth(cur));
  const daysCount   = getDaysInMonth(cur);
  const cells: (CalendarDay | null)[] = [
    ...Array(firstDow).fill(null),
    ...(calendar?.days ?? []),
    ...Array(Math.max(0, 42 - firstDow - daysCount)).fill(null),
  ];

  const handleAdd = (date: string) => {
    if (!approved?.items.length) return toast("No approved drafts to schedule", { icon: "ℹ️" });
    setSchedDate(date);
    setSelectedDraft(approved.items[0]);
  };

  const handleSchedule = async () => {
    if (!schedDate || !selectedDraft) return;
    const dt = parseISO(schedDate);
    dt.setHours(schedHour, 0, 0, 0);
    try {
      await schedule.mutateAsync({ workspace_id: workspaceId, draft_content_id: selectedDraft.id, scheduled_at: dt.toISOString(), use_optimal_time: useAI });
      toast.success("Scheduled!"); setSchedDate(null); setSelectedDraft(null);
    } catch (e: any) { toast.error(e?.response?.data?.detail || "Failed to schedule"); }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Calendar</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {calendar?.total_scheduled ?? 0} scheduled · {calendar?.total_published ?? 0} published · {calendar?.total_failed ?? 0} failed
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCur(d => subMonths(d, 1))} className="btn-ghost p-2"><ChevronLeft className="w-5 h-5" /></button>
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 min-w-[130px] text-center">{format(cur, "MMMM yyyy")}</span>
          <button onClick={() => setCur(d => addMonths(d, 1))} className="btn-ghost p-2"><ChevronRight className="w-5 h-5" /></button>
          <button onClick={() => setCur(new Date())} className="btn-secondary text-xs">Today</button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border border-pink-300 bg-pink-50" /> Today</span>
        <span className="flex items-center gap-1.5"><Zap className="w-3 h-3 text-violet-400" /> Optimal day</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-100" /> Scheduled</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-100" /> Published</span>
      </div>

      {isLoading ? <PageSpinner /> : (
        <>
          <div className="grid grid-cols-7 gap-1.5 mb-1">
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {cells.map((day, i) => {
              const posts = day ? (calendar?.days.find(d => d.date === day.date)?.scheduled_posts ?? []) : [];
              const dt    = day ? parseISO(day.date) : null;
              const dow   = dt ? (dt.getDay() === 0 ? 6 : dt.getDay() - 1) : -1;
              return <CalendarCell key={i} day={day} isToday={day?.date === today} isOptimal={optimalDays.has(dow)} posts={posts} onAdd={handleAdd} />;
            })}
          </div>
        </>
      )}

      {/* Schedule modal */}
      {schedDate && selectedDraft && (
        <Modal title={`Schedule for ${format(parseISO(schedDate), "MMMM d")}`} onClose={() => { setSchedDate(null); setSelectedDraft(null); }}>
          {/* Draft picker */}
          {approved && approved.items.length > 1 && (
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {approved.items.slice(0, 5).map(d => (
                <button key={d.id} onClick={() => setSelectedDraft(d)}
                  className={cn("w-full flex items-center gap-2 p-2.5 rounded-lg border text-left transition-colors",
                    selectedDraft?.id === d.id ? "border-pink-400 bg-pink-50" : "border-gray-200 hover:border-gray-300")}>
                  {d.current_version?.image_url && <img src={d.current_version.image_url} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />}
                  <p className="text-sm text-gray-700 line-clamp-2 flex-1">{d.current_version?.caption?.slice(0, 60)}</p>
                  {selectedDraft?.id === d.id && <CheckCircle className="w-4 h-4 text-pink-500 flex-shrink-0" />}
                </button>
              ))}
            </div>
          )}

          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
            <input type="checkbox" checked={useAI} onChange={e => setUseAI(e.target.checked)} className="w-4 h-4 accent-violet-500" />
            <Zap className="w-3.5 h-3.5 text-violet-500" /> Use AI optimal time
          </label>
          {!useAI && (
            <select className="select text-sm" value={schedHour} onChange={e => setSchedHour(+e.target.value)}>
              {HOUR_LABELS.map((l, i) => <option key={i} value={i}>{l}</option>)}
            </select>
          )}
          {useAI && optimal?.next_suggested_at && (
            <p className="text-xs bg-violet-50 text-violet-700 px-3 py-2 rounded-lg">AI recommends: {fmt.datetime(optimal.next_suggested_at)}</p>
          )}
          <div className="flex gap-2">
            <button onClick={handleSchedule} disabled={schedule.isPending} className="btn-primary flex-1">
              {schedule.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null} Schedule
            </button>
            <button onClick={() => { setSchedDate(null); setSelectedDraft(null); }} className="btn-secondary px-4">Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
