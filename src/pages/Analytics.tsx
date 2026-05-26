import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { analyzerApi } from "@/lib/api";
import { useAppStore } from "@/stores/app";
import { fmt, cn } from "@/lib/utils";
import {
  BarChart2, TrendingUp, TrendingDown, Hash, Clock,
  Zap, Sparkles, Heart, Eye, Bookmark,
  ArrowUpRight, ArrowDownRight, RefreshCw, Image,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { Link } from "react-router-dom";
import { PageSpinner } from "@/components/shared";

const DAY_LABELS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const HOUR_LABELS = ["12am","1am","2am","3am","4am","5am","6am","7am","8am","9am","10am","11am",
  "12pm","1pm","2pm","3pm","4pm","5pm","6pm","7pm","8pm","9pm","10pm","11pm"];

const IMPACT_COLOR: Record<string, string> = {
  high:   "bg-rose-50 text-rose-700 border-rose-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low:    "bg-blue-50 text-blue-700 border-blue-200",
};
const PERF_COLOR: Record<string, string> = {
  excellent: "text-emerald-600 bg-emerald-50",
  good:      "text-blue-600 bg-blue-50",
  average:   "text-amber-600 bg-amber-50",
  poor:      "text-rose-600 bg-rose-50",
};
const CATEGORY_ICON: Record<string, React.ElementType> = {
  content: Sparkles, timing: Clock, hashtags: Hash,
  engagement: Heart, growth: TrendingUp,
};

function PeriodSelector({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
      {[7, 30, 60, 90].map(d => (
        <button key={d} onClick={() => onChange(d)}
          className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
            value === d ? "bg-white dark:bg-gray-900 shadow text-gray-900" : "text-gray-500 hover:text-gray-700")}>
          {d}d
        </button>
      ))}
    </div>
  );
}

function Metric({ label, value, sub, trend, icon: Icon }: {
  label: string; value: string; sub?: string;
  trend?: { value: number; label: string }; icon: React.ElementType;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</span>
        <Icon className="w-4 h-4 text-gray-400" />
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      {trend && (
        <div className={cn("flex items-center gap-1 mt-1.5 text-xs font-medium",
          trend.value >= 0 ? "text-emerald-600" : "text-rose-500")}>
          {trend.value >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {Math.abs(trend.value)}% {trend.label}
        </div>
      )}
    </div>
  );
}

function PostRow({ post, rank, worst }: { post: any; rank: number; worst?: boolean }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50 dark:border-gray-800/50 last:border-0">
      <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
        worst ? "bg-rose-50 text-rose-500" :
        rank === 1 ? "bg-violet-100 text-violet-700" : "bg-gray-100 text-gray-500")}>
        {worst ? "↓" : `#${rank}`}
      </span>
      <div className="flex-1 min-w-0 grid grid-cols-4 gap-2 text-xs">
        <span className="text-gray-500">{post.published_at ? fmt.date(post.published_at) : "—"}</span>
        <span className="flex items-center gap-1 text-gray-600"><Heart className="w-3 h-3" />{fmt.number(post.likes)}</span>
        <span className="flex items-center gap-1 text-gray-600"><Eye className="w-3 h-3" />{fmt.number(post.reach)}</span>
        <span className={cn("font-bold", worst ? "text-rose-600" : "text-emerald-600")}>{post.engagement_rate}%</span>
      </div>
    </div>
  );
}

function HeatmapGrid({ heatmap }: { heatmap: any[] }) {
  if (!heatmap?.length) return <p className="text-sm text-gray-400 text-center py-6">Not enough data yet</p>;
  const maxEr = Math.max(...heatmap.map(c => c.avg_er), 0.01);
  const cellMap: Record<string, number> = {};
  heatmap.forEach(c => { cellMap[`${c.day_of_week}-${c.hour_of_day}`] = c.avg_er; });
  return (
    <div className="overflow-x-auto">
      <div className="min-w-max">
        <div className="flex mb-1 ml-10">
          {Array.from({ length: 24 }, (_, h) => (
            <div key={h} className="w-6 text-center text-xs text-gray-400">{h % 6 === 0 ? HOUR_LABELS[h] : ""}</div>
          ))}
        </div>
        {DAY_LABELS.map((day, d) => (
          <div key={d} className="flex items-center mb-0.5">
            <span className="w-9 text-xs text-gray-400 text-right pr-1 flex-shrink-0">{day}</span>
            {Array.from({ length: 24 }, (_, h) => {
              const er = cellMap[`${d}-${h}`] || 0;
              return (
                <div key={h} title={er ? `${er}% ER` : "No data"}
                  className="w-6 h-5 rounded-sm mr-0.5"
                  style={{ backgroundColor: er ? `rgba(139,92,246,${0.1 + (er/maxEr)*0.85})` : "rgba(0,0,0,0.04)" }}
                />
              );
            })}
          </div>
        ))}
        <div className="flex items-center gap-2 mt-2 ml-10">
          <span className="text-xs text-gray-400">Low</span>
          {[0.1,0.3,0.5,0.7,0.9].map(o => (
            <div key={o} className="w-5 h-3 rounded-sm" style={{ backgroundColor: `rgba(139,92,246,${o})` }} />
          ))}
          <span className="text-xs text-gray-400">High</span>
        </div>
      </div>
    </div>
  );
}

function SuggestionCard({ s }: { s: any }) {
  const Icon = CATEGORY_ICON[s.category] || Zap;
  return (
    <div className={cn("border rounded-xl p-4 space-y-2", IMPACT_COLOR[s.impact] || "border-gray-200 bg-gray-50")}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 flex-shrink-0" />
          <p className="font-semibold text-sm">{s.title}</p>
        </div>
        <span className="text-xs font-medium capitalize px-2 py-0.5 rounded-full bg-white/60 flex-shrink-0">{s.impact}</span>
      </div>
      <p className="text-sm opacity-80 leading-relaxed">{s.description}</p>
    </div>
  );
}

export function AnalyticsPage() {
  const { workspaceId } = useAppStore();
  const [days, setDays] = useState(30);

  const { data, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: ["analyzer-report", workspaceId, days],
    queryFn:  () => analyzerApi.getReport(workspaceId, days).then(r => r.data),
    enabled:  !!workspaceId,
    staleTime: 300_000,
    retry: false,
  });

  if ((error as any)?.response?.status === 402) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center">
          <BarChart2 className="w-7 h-7 text-violet-500" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">Analytics requires Starter plan</h2>
        <p className="text-sm text-gray-500 text-center max-w-sm">
          Unlock deep performance analytics, hashtag scoring, AI suggestions and posting time heatmaps.
        </p>
        <Link to="/billing" className="btn-primary">Upgrade now →</Link>
      </div>
    );
  }

  const s = data?.summary;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Deep performance analysis · synced every 6 hours</p>
        </div>
        <div className="flex items-center gap-2">
          <PeriodSelector value={days} onChange={setDays} />
          <button onClick={() => refetch()} disabled={isFetching} className="btn-ghost p-2">
            <RefreshCw className={cn("w-4 h-4", isFetching && "animate-spin")} />
          </button>
        </div>
      </div>

      {isLoading ? <PageSpinner /> : !data?.has_data ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
            <BarChart2 className="w-7 h-7 text-gray-400" />
          </div>
          <p className="font-semibold text-gray-700">No analytics data yet</p>
          <p className="text-sm text-gray-400 text-center max-w-sm">{data?.message}</p>
          <Link to="/content" className="btn-primary"><Sparkles className="w-4 h-4" /> Create content</Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Metric label="Avg engagement" value={`${s?.avg_engagement_rate ?? 0}%`}
              trend={{ value: s?.er_change_pct ?? 0, label: "vs prev" }} icon={TrendingUp} />
            <Metric label="Avg reach"  value={fmt.number(s?.avg_reach ?? 0)} sub="per post" icon={Eye} />
            <Metric label="Avg likes"  value={fmt.number(s?.avg_likes ?? 0)} sub="per post" icon={Heart} />
            <Metric label="Avg saves"  value={fmt.number(s?.avg_saves ?? 0)} sub="per post" icon={Bookmark} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-5">

              {data?.content_type_breakdown?.length > 0 && (
                <div className="card p-5">
                  <h2 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <Image className="w-4 h-4 text-violet-500" /> Content format performance
                  </h2>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={data.content_type_breakdown} barSize={36}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                      <XAxis dataKey="content_type" tick={{ fontSize: 12 }} axisLine={false} tickLine={false}
                        tickFormatter={(v: string) => v.replace("_", " ")} />
                      <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} unit="%" />
                      <Tooltip formatter={(v: number) => [`${v}%`, "Avg ER"]} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="avg_engagement_rate" radius={[6, 6, 0, 0]} fill="#8b5cf6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="card p-5">
                <h2 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-pink-500" /> Posting time heatmap
                  <span className="text-xs text-gray-400 font-normal">engagement by day & hour</span>
                </h2>
                <HeatmapGrid heatmap={data?.time_heatmap} />
                {data?.time_heatmap?.[0] && (
                  <p className="text-xs text-violet-700 bg-violet-50 px-3 py-2 rounded-lg mt-3">
                    Best slot: {DAY_LABELS[data.time_heatmap[0].day_of_week]} at {HOUR_LABELS[data.time_heatmap[0].hour_of_day]} — {data.time_heatmap[0].avg_er}% avg ER
                  </p>
                )}
              </div>

              {data?.top_posts?.length > 0 && (
                <div className="card overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <h2 className="font-semibold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-500" /> Post performance ranking
                    </h2>
                    <div className="text-xs text-gray-400 grid grid-cols-4 gap-2 w-48">
                      <span>Date</span><span>Likes</span><span>Reach</span><span>ER</span>
                    </div>
                  </div>
                  <div className="px-5">
                    {data.top_posts.map((p: any, i: number) => <PostRow key={p.scheduled_post_id} post={p} rank={i + 1} />)}
                  </div>
                  {data?.worst_posts?.length > 0 && (
                    <>
                      <div className="px-5 py-2 border-t border-gray-100 dark:border-gray-800">
                        <p className="text-xs font-medium text-rose-500 flex items-center gap-1">
                          <TrendingDown className="w-3.5 h-3.5" /> Lowest performers
                        </p>
                      </div>
                      <div className="px-5">
                        {data.worst_posts.map((p: any, i: number) => <PostRow key={p.scheduled_post_id} post={p} rank={i + 1} worst />)}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-5">
              {data?.ai_suggestions?.length > 0 && (
                <div className="space-y-3">
                  <h2 className="font-semibold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-violet-500" /> AI suggestions
                  </h2>
                  {data.ai_suggestions.map((s: any, i: number) => <SuggestionCard key={i} s={s} />)}
                </div>
              )}

              {data?.hashtag_analysis?.length > 0 && (
                <div className="card p-4">
                  <h2 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                    <Hash className="w-4 h-4 text-blue-500" /> Hashtag performance
                  </h2>
                  <div className="space-y-2">
                    {data.hashtag_analysis.slice(0, 10).map((h: any) => (
                      <div key={h.hashtag} className="flex items-center justify-between gap-2">
                        <span className="text-xs text-gray-700 dark:text-gray-300 truncate">{h.hashtag}</span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-blue-500"
                              style={{ width: `${Math.min(h.avg_engagement_rate * 10, 100)}%` }} />
                          </div>
                          <span className={cn("text-xs font-medium px-1.5 py-0.5 rounded-full", PERF_COLOR[h.performance] || "text-gray-500 bg-gray-50")}>
                            {h.avg_engagement_rate}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data?.caption_analysis?.buckets && Object.keys(data.caption_analysis.buckets).length > 0 && (
                <div className="card p-4">
                  <h2 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-3">Caption length</h2>
                  {Object.entries(data.caption_analysis.buckets).map(([bucket, stats]: [string, any]) => (
                    <div key={bucket} className={cn("p-2.5 rounded-lg mb-2 text-xs",
                      data.caption_analysis.best_length === bucket ? "bg-emerald-50 border border-emerald-200" : "bg-gray-50")}>
                      <div className="flex justify-between">
                        <span className="text-gray-700 font-medium">{bucket}</span>
                        <span className={cn("font-bold", data.caption_analysis.best_length === bucket ? "text-emerald-600" : "text-gray-600")}>
                          {stats.avg_engagement_rate}%
                        </span>
                      </div>
                      <p className="text-gray-400 mt-0.5">{stats.post_count} posts</p>
                    </div>
                  ))}
                  {data.caption_analysis.recommendation && (
                    <p className="text-xs text-violet-600 bg-violet-50 px-2 py-1.5 rounded-lg mt-1">
                      💡 {data.caption_analysis.recommendation}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
