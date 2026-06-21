"use client";
import { useAppStore } from "@/stores/app";
import { useAuthStore } from "@/stores/auth";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/lib/api";
import { fmt, cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import {
  Sparkles, Clock, Calendar, Users, ArrowRight, Zap,
  TrendingUp, CheckCircle, AlertCircle, Heart, Eye,
  Bookmark, Instagram, BarChart2, RefreshCw, Loader2,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { PageSpinner } from "@/components/shared";
import { OnboardingChecklist } from "@/components/shared/OnboardingChecklist";

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, color, href }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string; href?: string;
}) {
  const inner = (
    <div className={cn("card p-5 flex items-start gap-4 transition-shadow", href && "hover:shadow-card-hover cursor-pointer")}>
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", color)}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  );
  return href ? <Link to={href}>{inner}</Link> : inner;
}

// ── Health score ring ─────────────────────────────────────────────────────────
function HealthScore({ health }: { health: any }) {
  if (!health) return null;
  const colorMap: Record<string, string> = {
    emerald: "text-emerald-600", blue: "text-blue-600",
    amber: "text-amber-600", rose: "text-rose-600",
  };
  const bgMap: Record<string, string> = {
    emerald: "bg-emerald-50", blue: "bg-blue-50",
    amber: "bg-amber-50", rose: "bg-rose-50",
  };
  const col = health.color || "blue";

  return (
    <div className={cn("card p-5", bgMap[col])}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Account health</h2>
        <span className={cn("text-2xl font-bold", colorMap[col])}>{health.score}/100</span>
      </div>
      <p className={cn("text-sm font-medium mb-3", colorMap[col])}>{health.label}</p>
      <div className="w-full h-2 bg-white/60 rounded-full overflow-hidden mb-3">
        <div
          className={cn("h-full rounded-full transition-all", {
            "bg-emerald-500": col === "emerald",
            "bg-blue-500":    col === "blue",
            "bg-amber-500":   col === "amber",
            "bg-rose-500":    col === "rose",
          })}
          style={{ width: `${health.score}%` }}
        />
      </div>
      <div className="space-y-1.5">
        {Object.entries(health.breakdown || {}).map(([key, pts]: [string, any]) => (
          <div key={key} className="flex items-center justify-between text-xs">
            <span className="text-gray-600 capitalize">{key.replace(/_/g, " ")}</span>
            <span className={pts > 0 ? "text-emerald-600 font-medium" : "text-gray-400"}>
              {pts > 0 ? `+${pts}` : "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Pipeline bar ──────────────────────────────────────────────────────────────
function PipelineCard({ pipeline }: { pipeline: any }) {
  if (!pipeline) return null;
  const stages = [
    { label: "Draft",     key: "draft",     color: "bg-gray-300" },
    { label: "Pending",   key: "pending",   color: "bg-amber-400" },
    { label: "Approved",  key: "approved",  color: "bg-emerald-400" },
    { label: "Scheduled", key: "scheduled", color: "bg-blue-400" },
    { label: "Published", key: "published", color: "bg-violet-500" },
  ];
  const total = pipeline.total || 1;
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Content pipeline</h2>
        <Link to="/content" className="text-xs text-pink-600 hover:text-pink-700 flex items-center gap-1">
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      {/* Stacked bar */}
      <div className="flex h-3 rounded-full overflow-hidden gap-0.5 mb-4">
        {stages.map(s => {
          const pct = (pipeline[s.key] || 0) / total * 100;
          return pct > 0 ? (
            <div key={s.key} className={cn("h-full rounded-full", s.color)} style={{ width: `${pct}%` }} />
          ) : null;
        })}
      </div>
      <div className="grid grid-cols-5 gap-2">
        {stages.map(s => (
          <div key={s.key} className="text-center">
            <div className={cn("w-2.5 h-2.5 rounded-full mx-auto mb-1", s.color)} />
            <p className="text-xs font-semibold text-gray-900">{pipeline[s.key] || 0}</p>
            <p className="text-xs text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>
      {pipeline.pending > 0 && (
        <Link to="/content?status=pending"
          className="mt-3 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">
          <AlertCircle className="w-3.5 h-3.5" />
          {pipeline.pending} post{pipeline.pending > 1 ? "s" : ""} awaiting review
        </Link>
      )}
    </div>
  );
}

// ── Recent posts list ─────────────────────────────────────────────────────────
function RecentPost({ post }: { post: any }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50 dark:border-gray-800/50 last:border-0">
      {post.image_url
        ? <img src={post.image_url} alt="" className="w-11 h-11 rounded-lg object-cover flex-shrink-0 bg-gray-100" />
        : <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-violet-100 to-pink-100 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-violet-400" />
          </div>
      }
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-800 dark:text-gray-200 truncate">{post.caption}</p>
        <p className="text-xs text-gray-400 mt-0.5">{post.published_at ? fmt.relative(post.published_at) : "—"}</p>
      </div>
      {post.metrics && (
        <div className="flex items-center gap-3 flex-shrink-0 text-xs text-gray-500">
          <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{fmt.number(post.metrics.likes)}</span>
          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{fmt.number(post.metrics.reach)}</span>
        </div>
      )}
      {post.ig_permalink && (
        <a href={post.ig_permalink} target="_blank" rel="noreferrer"
          className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-pink-500 hover:bg-pink-50 transition-colors">
          <Instagram className="w-3.5 h-3.5" />
        </a>
      )}
    </div>
  );
}

// ── Scheduled row ─────────────────────────────────────────────────────────────
function ScheduledRow({ post }: { post: any }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 dark:border-gray-800/50 last:border-0">
      {post.image_url
        ? <img src={post.image_url} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
        : <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Calendar className="w-4 h-4 text-blue-400" />
          </div>
      }
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-800 dark:text-gray-200 truncate">{post.caption}</p>
        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-0.5">{fmt.datetime(post.scheduled_at)}</p>
      </div>
      {post.is_ai_time && (
        <span className="px-2 py-0.5 text-xs bg-violet-50 text-violet-600 rounded-full flex items-center gap-1 flex-shrink-0">
          <Zap className="w-3 h-3" /> AI
        </span>
      )}
    </div>
  );
}

// ── Credits widget ────────────────────────────────────────────────────────────
function CreditsCard({ credits }: { credits: any }) {
  if (!credits) return null;
  const pct = Math.min(credits.pct_used, 100);
  const remaining = 100 - pct;
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-violet-500" />
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">AI Credits</span>
          <span className="text-xs bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full">{credits.plan_name}</span>
        </div>
        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
          {credits.balance} <span className="text-gray-400 font-normal text-xs">left</span>
        </span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-1">
        <div
          className={cn("h-full rounded-full transition-all", pct > 80 ? "bg-rose-500" : "bg-gradient-to-r from-violet-500 to-pink-500")}
          style={{ width: `${Math.max(2, remaining)}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-400">
        <span>{credits.used} used of {credits.allocated >= 999999 ? "∞" : credits.allocated}</span>
        {pct > 80 && (
          <Link to="/billing" className="text-rose-500 font-medium">Upgrade →</Link>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function DashboardPage() {
  const { workspaceId } = useAppStore();
  const { user } = useAuthStore();

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["dashboard-overview", workspaceId],
    queryFn:  () => dashboardApi.getOverview(workspaceId).then(r => r.data),
    enabled:  !!workspaceId,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  if (isLoading) return <PageSpinner />;

  const pipeline   = data?.content_pipeline;
  const health     = data?.health_score;
  const recent     = data?.recent_published || [];
  const scheduled  = data?.scheduled_queue || [];
  const account    = data?.instagram_account;
  const engagement = data?.engagement_trend;
  const credits    = data?.credit_usage;
  const optimal    = data?.optimal_time;
  const pending    = data?.pending_approvals;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {greeting()}{user?.name ? `, ${user.name.split(" ")[0]}` : ""} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()} disabled={isFetching} className="btn-ghost p-2">
            <RefreshCw className={cn("w-4 h-4", isFetching && "animate-spin")} />
          </button>
          {account && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-violet-50 to-pink-50 border border-pink-100">
              <div className="w-7 h-7 rounded-full ig-gradient flex items-center justify-center">
                <Instagram className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-800">@{account.username}</p>
                <p className="text-xs text-gray-500">{fmt.number(account.followers_count)} followers</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pending alert banner */}
      {pending?.needs_attention && (
        <Link to="/content?status=pending"
          className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">
              {pending.count} post{pending.count > 1 ? "s" : ""} waiting for your approval
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-amber-600 flex-shrink-0" />
        </Link>
      )}

      {/* Onboarding checklist */}
      <OnboardingChecklist />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total posts"    value={pipeline?.total ?? 0}     sub="all content"        icon={Sparkles}   color="bg-violet-50 text-violet-600"  href="/content" />
        <StatCard label="Needs review"   value={pipeline?.pending ?? 0}   sub={pipeline?.pending ? "action needed" : "all clear"} icon={Clock} color={pipeline?.pending ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"} href="/content?status=pending" />
        <StatCard label="Scheduled"      value={pipeline?.scheduled ?? 0} sub="upcoming posts"     icon={Calendar}   color="bg-blue-50 text-blue-600"      href="/calendar" />
        <StatCard label="Published"      value={pipeline?.published ?? 0} sub="total published"    icon={CheckCircle} color="bg-emerald-50 text-emerald-600" href="/analytics" />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left 2/3 */}
        <div className="lg:col-span-2 space-y-5">

          {/* Engagement chart */}
          {engagement?.has_data && engagement.daily?.length > 0 && (
            <div className="card p-5">
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-semibold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-pink-500" /> Engagement rate — last 30 days
                </h2>
                <span className="text-xs text-gray-500">avg {engagement.avg_engagement_rate}%</span>
              </div>
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart data={engagement.daily} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="erGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#ec4899" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} unit="%" />
                  <Tooltip formatter={(v: number) => [`${v}%`, "Engagement"]} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="avg_er" stroke="#ec4899" strokeWidth={2} fill="url(#erGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Pipeline */}
          <PipelineCard pipeline={pipeline} />

          {/* Recent published */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Recently published</h2>
              <Link to="/analytics" className="text-xs text-pink-600 hover:text-pink-700 flex items-center gap-1">
                Analytics <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="px-5">
              {recent.length > 0
                ? recent.map((p: any) => <RecentPost key={p.id} post={p} />)
                : <p className="py-8 text-sm text-center text-gray-400">No published posts yet. <Link to="/content" className="text-pink-600 hover:underline">Create your first →</Link></p>
              }
            </div>
          </div>
        </div>

        {/* Right 1/3 */}
        <div className="space-y-4">
          {/* Health score */}
          <HealthScore health={health} />

          {/* Credits */}
          <CreditsCard credits={credits} />

          {/* Upcoming */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Upcoming</h2>
              <Link to="/calendar" className="text-xs text-pink-600 hover:text-pink-700">Calendar →</Link>
            </div>
            <div className="px-4">
              {scheduled.length > 0
                ? scheduled.map((p: any) => <ScheduledRow key={p.id} post={p} />)
                : <p className="py-5 text-sm text-center text-gray-400">No scheduled posts</p>
              }
            </div>
          </div>

          {/* Best time */}
          {optimal && (
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-violet-500" />
                <h2 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Best time to post</h2>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{optimal.day_name} at {optimal.hour_label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {optimal.is_reliable ? `${(optimal.avg_engagement_rate * 100).toFixed(1)}% avg ER` : "Industry default — keep posting"}
                  </p>
                </div>
                {optimal.next_suggested_at && (
                  <Link to="/calendar" className="btn-primary text-xs py-1.5">Schedule</Link>
                )}
              </div>
              {!optimal.is_reliable && (
                <p className="mt-2 text-xs text-amber-600 bg-amber-50 px-2 py-1.5 rounded-lg">
                  Publish more posts to get personalized times
                </p>
              )}
            </div>
          )}

          {/* Quick actions */}
          <div className="card p-4 space-y-2">
            <h2 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-3">Quick actions</h2>
            <Link to="/content" className="btn-primary w-full">
              <Sparkles className="w-4 h-4" /> Generate content
            </Link>
            <Link to="/calendar" className="btn-secondary w-full">
              <Calendar className="w-4 h-4" /> View calendar
            </Link>
            <Link to="/analytics" className="btn-secondary w-full">
              <BarChart2 className="w-4 h-4" /> Analytics
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
