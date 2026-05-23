import { useAppStore } from "@/stores/app";
import { useScheduledPosts, useOptimalTime, useInstagramAccount } from "@/hooks";
import { fmt, DAY_LABELS, HOUR_LABELS, cn } from "@/lib/utils";
import { BarChart2, TrendingUp, Zap, Clock, AlertCircle, CheckCircle2, Share2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Link } from "react-router-dom";

export function AnalyticsPage() {
  const { workspaceId } = useAppStore();
  const { data: posts }   = useScheduledPosts(workspaceId, "published");
  const { data: optimal } = useOptimalTime(workspaceId);
  const { data: account } = useInstagramAccount(workspaceId);

  const dowData = DAY_LABELS.map((day, i) => {
    const slots = optimal?.suggested_slots.filter(s => s.day_of_week === i) ?? [];
    const avg   = slots.reduce((a, s) => a + s.avg_engagement_rate, 0) / Math.max(slots.length, 1);
    return { day, er: +(avg * 100).toFixed(2) };
  });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Analytics</h1>
        <p className="text-sm text-gray-500 mt-0.5">Data synced every 6 hours from Instagram Insights</p>
      </div>

      {!account && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">Instagram not connected</p>
            <p className="text-sm text-amber-700 mt-0.5">Connect in <Link to="/settings" className="underline">Settings</Link> to see real analytics.</p>
          </div>
        </div>
      )}

      {/* Account summary */}
      {account && (
        <div className="card p-5 flex items-center gap-5 bg-gradient-to-r from-violet-50 to-pink-50 border-pink-100">
          <div className="w-12 h-12 rounded-full ig-gradient flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">IG</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
            {[
              ["Followers", fmt.number(account.followers_count)],
              ["Posts",     fmt.number(account.media_count)],
              ["Published (SMM)", String(posts?.total ?? 0)],
              ["Account",   "@" + account.instagram_username],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-5">
          <h2 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-pink-500" /> Engagement by day of week
          </h2>
          <p className="text-xs text-gray-400 mb-4">{optimal?.is_reliable ? `Based on ${optimal.based_on_posts} posts` : "Collecting data…"}</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={dowData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} unit="%" />
              <Tooltip formatter={(v: number) => [`${v}%`, "Avg ER"]} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="er" radius={[6, 6, 0, 0]}>
                {dowData.map((_, i) => <Cell key={i} fill={i === dowData.reduce((mi, v, ci, a) => v.er > a[mi].er ? ci : mi, 0) ? "#E1306C" : "#c4b5fd"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1 flex items-center gap-2">
            <Zap className="w-4 h-4 text-violet-500" /> Best posting times
          </h2>
          <p className="text-xs text-gray-400 mb-4">
            {optimal?.is_reliable ? `Reliable — ${optimal.based_on_posts} posts` : `Learning — ${Math.max(0, 10 - (optimal?.based_on_posts ?? 0))} more posts needed`}
          </p>
          {optimal?.suggested_slots.length ? (
            <div className="space-y-2.5">
              {optimal.suggested_slots.slice(0, 5).map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                    i === 0 ? "bg-violet-100 text-violet-700" : "bg-gray-100 text-gray-500")}>#{i + 1}</span>
                  <span className="text-sm font-medium text-gray-700 w-20 flex-shrink-0">{DAY_LABELS[s.day_of_week]}</span>
                  <span className="text-sm text-gray-500 w-14 flex-shrink-0">{HOUR_LABELS[s.hour_of_day]}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-pink-500" style={{ width: `${s.confidence_score * 100}%` }} />
                  </div>
                  <span className="text-xs text-gray-400 w-16 text-right">{(s.avg_engagement_rate * 100).toFixed(1)}% ER</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <Clock className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <p className="text-sm text-gray-500">Publish posts to start learning your best times.</p>
            </div>
          )}
        </div>
      </div>

      {/* Published posts */}
      {posts && posts.items.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <h2 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Published posts</h2>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
            {posts.items.slice(0, 8).map(p => (
              <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                {p.image_url_snapshot && <img src={p.image_url_snapshot} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 dark:text-gray-200 truncate">{p.caption_snapshot.slice(0, 60)}…</p>
                  <p className="text-xs text-gray-400 mt-0.5">{p.published_at ? fmt.datetime(p.published_at) : "Published"}</p>
                </div>
                {p.ig_permalink && (
                  <a href={p.ig_permalink} target="_blank" rel="noreferrer" className="btn-ghost p-1.5 flex-shrink-0">
                    <Share2 className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
