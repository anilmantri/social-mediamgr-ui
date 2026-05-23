import { Link } from "react-router-dom";
import { Sparkles, Clock, Calendar, Users, ArrowRight, Zap } from "lucide-react";
import { useAppStore } from "@/stores/app";
import { useDrafts, useScheduledPosts, useInstagramAccount, useOptimalTime } from "@/hooks";
import { fmt, contentStatusConfig, cn, DAY_LABELS, HOUR_LABELS } from "@/lib/utils";
import { StatusBadge, PageSpinner } from "@/components/shared";
import type { DraftContent, ScheduledPost } from "@/types";

function StatCard({ label, value, sub, icon: Icon, color }: { label: string; value: string|number; sub?: string; icon: React.ElementType; color: string }) {
  return (
    <div className="card p-5 flex items-start gap-4">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", color)}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function DraftRow({ d }: { d: DraftContent }) {
  return (
    <Link to={`/content/${d.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors group">
      {d.current_version?.image_url
        ? <img src={d.current_version.image_url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-gray-100" />
        : <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-100 to-pink-100 flex items-center justify-center flex-shrink-0"><Sparkles className="w-4 h-4 text-violet-500" /></div>
      }
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900 dark:text-gray-100 truncate font-medium">
          {d.generation_prompt || d.current_version?.caption?.slice(0, 55) || "Untitled"}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">{fmt.relative(d.created_at)}</p>
      </div>
      <StatusBadge status={d.status} />
      <ArrowRight className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
    </Link>
  );
}

function ScheduledRow({ p }: { p: ScheduledPost }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {p.image_url_snapshot
        ? <img src={p.image_url_snapshot} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
        : <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0"><Calendar className="w-4 h-4 text-blue-500" /></div>
      }
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900 dark:text-gray-100 truncate">{p.caption_snapshot.slice(0, 50)}…</p>
        <p className="text-xs text-blue-600 font-medium mt-0.5">{fmt.datetime(p.scheduled_at)}</p>
      </div>
      {p.is_ai_optimised_time && (
        <span className="px-2 py-0.5 rounded-full text-xs bg-violet-50 text-violet-600 font-medium flex items-center gap-1 flex-shrink-0">
          <Zap className="w-3 h-3" /> AI
        </span>
      )}
    </div>
  );
}

export function DashboardPage() {
  const { workspaceId, workspaceName } = useAppStore();
  const { data: drafts }    = useDrafts(workspaceId);
  const { data: pending }   = useDrafts(workspaceId, "pending");
  const { data: scheduled } = useScheduledPosts(workspaceId, "scheduled");
  const { data: account }   = useInstagramAccount(workspaceId);
  const { data: optimal }   = useOptimalTime(workspaceId);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Good morning 👋</h1>
          <p className="text-sm text-gray-500 mt-0.5">{workspaceName}</p>
        </div>
        {account && (
          <Link to="/settings" className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-violet-50 to-pink-50 border border-pink-100 hover:shadow-md transition-shadow">
            <div className="w-7 h-7 rounded-full ig-gradient flex items-center justify-center">
              <span className="text-white text-xs font-bold">IG</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-800">@{account.instagram_username}</p>
              <p className="text-xs text-gray-500">{fmt.number(account.followers_count)} followers</p>
            </div>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total posts"     value={drafts?.total ?? 0}    sub="all content" icon={Sparkles} color="bg-violet-50 text-violet-600" />
        <StatCard label="Needs review"    value={pending?.total ?? 0}   sub={pending?.total ? "action needed" : "all clear"} icon={Clock}     color={pending?.total ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"} />
        <StatCard label="Scheduled"       value={scheduled?.total ?? 0} sub="upcoming"    icon={Calendar} color="bg-blue-50 text-blue-600" />
        <StatCard label="Followers"       value={account ? fmt.number(account.followers_count) : "—"} sub={account ? "@" + account.instagram_username : "Connect Instagram"} icon={Users} color="bg-pink-50 text-pink-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent drafts */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Recent content</h2>
            <Link to="/content" className="text-xs text-pink-600 hover:text-pink-700 font-medium flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></Link>
          </div>
          {drafts?.items.length ? (
            <div>{drafts.items.slice(0, 5).map(d => <DraftRow key={d.id} d={d} />)}</div>
          ) : (
            <p className="px-5 py-10 text-sm text-center text-gray-400">
              No content yet. <Link to="/content" className="text-pink-600 hover:underline">Create your first post →</Link>
            </p>
          )}
        </div>

        <div className="space-y-4">
          {/* Upcoming */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Upcoming</h2>
              <Link to="/calendar" className="text-xs text-pink-600 hover:text-pink-700 font-medium">Calendar →</Link>
            </div>
            {scheduled?.items.length
              ? <div>{scheduled.items.slice(0, 3).map(p => <ScheduledRow key={p.id} p={p} />)}</div>
              : <p className="px-4 py-6 text-sm text-center text-gray-400">No scheduled posts</p>
            }
          </div>

          {/* Best times */}
          {optimal && optimal.suggested_slots.length > 0 && (
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-violet-500" />
                <h2 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Best time to post</h2>
              </div>
              {optimal.suggested_slots.slice(0, 3).map((s, i) => (
                <div key={i} className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-gray-600">{DAY_LABELS[s.day_of_week]}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{HOUR_LABELS[s.hour_of_day]}</span>
                    <div className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-pink-500" style={{ width: `${s.confidence_score * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick actions */}
          <div className="card p-4 space-y-2">
            <h2 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-3">Quick actions</h2>
            <Link to="/content" className="btn-primary w-full"><Sparkles className="w-4 h-4" /> Generate content</Link>
            <Link to="/calendar" className="btn-secondary w-full"><Calendar className="w-4 h-4" /> View calendar</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
