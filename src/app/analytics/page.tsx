"use client";
import { useState } from "react";
import { useAppStore } from "@/stores/app";
import { useScheduledPosts, useOptimalTime, useInstagramAccount } from "@/hooks";
import { fmt, publishStatusConfig, cn } from "@/lib/utils";
import {
  BarChart2, TrendingUp, Eye, Heart, Bookmark,
  MessageCircle, Users, Zap, Clock, Share2, Loader2,
  AlertCircle, CheckCircle2, ArrowUpRight
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, RadarChart,
  PolarGrid, PolarAngleAxis, Radar, Cell
} from "recharts";

const HOUR_LABELS = ["12am","1am","2am","3am","4am","5am","6am","7am","8am","9am","10am","11am",
  "12pm","1pm","2pm","3pm","4pm","5pm","6pm","7pm","8pm","9pm","10pm","11pm"];
const DAY_LABELS  = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

function MetricCard({ label, value, sub, icon: Icon, trend, color }: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; trend?: number; color: string;
}) {
  return (
    <div className="card p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 font-medium">{label}</span>
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", color)}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{value}</p>
      <div className="flex items-center justify-between">
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
        {trend !== undefined && (
          <span className={cn("text-xs font-medium flex items-center gap-0.5",
            trend >= 0 ? "text-emerald-600" : "text-rose-500")}>
            <ArrowUpRight className={cn("w-3 h-3", trend < 0 && "rotate-180")} />
            {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const { workspaceId }  = useAppStore();
  const { data: posts }   = useScheduledPosts(workspaceId, "published");
  const { data: optimal } = useOptimalTime(workspaceId);
  const { data: account } = useInstagramAccount(workspaceId);

  // Build engagement data from published posts
  const publishedPosts = posts?.items ?? [];
  const totalPosts     = publishedPosts.length;

  // Aggregate metrics (placeholder until Insights API returns real data)
  const statusData = [
    { name: "Published", value: posts?.total ?? 0, fill: "#10b981" },
    { name: "Scheduled", value: 0, fill: "#3b82f6" },
    { name: "Failed",    value: 0, fill: "#ef4444" },
  ];

  // Optimal time heatmap data
  const heatmapData = optimal?.suggested_slots.map(s => ({
    day:  DAY_LABELS[s.day_of_week],
    hour: HOUR_LABELS[s.hour_of_day],
    er:   s.avg_engagement_rate,
    rank: s.rank,
    conf: s.confidence_score,
  })) ?? [];

  // Day-of-week bar chart
  const dowData = DAY_LABELS.map((day, i) => {
    const slots = optimal?.suggested_slots.filter(s => s.day_of_week === i) ?? [];
    const avgEr = slots.reduce((a, s) => a + s.avg_engagement_rate, 0) / Math.max(slots.length, 1);
    return { day, er: +(avgEr * 100).toFixed(2) };
  });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Analytics</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Performance overview — data synced every 6 hours from Instagram Insights
        </p>
      </div>

      {/* No account warning */}
      {!account && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800/40">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Instagram not connected</p>
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">
              Connect your Instagram account in Settings to see real analytics data.
            </p>
          </div>
        </div>
      )}

      {/* Account summary */}
      {account && (
        <div className="card p-4 flex items-center gap-5 bg-gradient-to-r from-violet-50 to-pink-50 dark:from-violet-950/20 dark:to-pink-950/20 border-pink-100 dark:border-pink-900/30">
          <div className="w-12 h-12 rounded-full ig-gradient flex items-center justify-center flex-shrink-0">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500">Followers</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{fmt.number(account.followers_count)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Posts</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{fmt.number(account.media_count)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Published (SMM)</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{totalPosts}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Account</p>
              <p className="text-sm font-semibold text-pink-600 dark:text-pink-400">@{account.instagram_username}</p>
            </div>
          </div>
        </div>
      )}

      {/* Metric cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard label="Avg reach"       value="—" sub="connect Instagram" icon={Eye}         color="bg-blue-50 dark:bg-blue-900/20 text-blue-500" />
        <MetricCard label="Avg engagement"  value="—" sub="connect Instagram" icon={Heart}       color="bg-pink-50 dark:bg-pink-900/20 text-pink-500" />
        <MetricCard label="Avg saves"       value="—" sub="connect Instagram" icon={Bookmark}    color="bg-violet-50 dark:bg-violet-900/20 text-violet-500" />
        <MetricCard label="Avg comments"    value="—" sub="connect Instagram" icon={MessageCircle} color="bg-amber-50 dark:bg-amber-900/20 text-amber-500" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Post status breakdown */}
        <div className="card p-5">
          <h2 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-violet-500" /> Post status breakdown
          </h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={statusData} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: "var(--tooltip-bg, #fff)",
                  border: "1px solid rgba(0,0,0,0.08)",
                  borderRadius: 8, fontSize: 12
                }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {statusData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Best days to post */}
        <div className="card p-5">
          <h2 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-pink-500" /> Engagement by day of week
          </h2>
          <p className="text-xs text-gray-400 mb-4">
            {optimal?.is_reliable ? `Based on ${optimal.based_on_posts} posts` : "Collecting data…"}
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={dowData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} unit="%" />
              <Tooltip
                formatter={(v: number) => [`${v}%`, "Avg engagement"]}
                contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid rgba(0,0,0,0.08)" }}
              />
              <Bar dataKey="er" radius={[6, 6, 0, 0]} fill="url(#igGrad)" />
              <defs>
                <linearGradient id="igGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#833AB4" />
                  <stop offset="100%" stopColor="#E1306C" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Optimal posting times */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Zap className="w-4 h-4 text-violet-500" /> Best posting times
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {optimal?.is_reliable
                ? `Reliable — based on ${optimal.based_on_posts} posts`
                : `Learning — need ${10 - (optimal?.based_on_posts ?? 0)} more published posts`
              }
            </p>
          </div>
          {optimal?.next_suggested_at && (
            <div className="text-right">
              <p className="text-xs text-gray-500">Next recommended</p>
              <p className="text-sm font-semibold text-violet-600 dark:text-violet-400">
                {fmt.datetime(optimal.next_suggested_at)}
              </p>
            </div>
          )}
        </div>

        {optimal?.suggested_slots && optimal.suggested_slots.length > 0 ? (
          <div className="space-y-2">
            {optimal.suggested_slots.map((slot, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                  i === 0 ? "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                )}>#{i + 1}</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-24 flex-shrink-0">
                  {slot.day_name}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400 w-16 flex-shrink-0">
                  {HOUR_LABELS[slot.hour_of_day]}
                </span>
                <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-pink-500"
                    style={{ width: `${slot.confidence_score * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0 w-20 text-right">
                  {(slot.avg_engagement_rate * 100).toFixed(1)}% ER
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
            <Clock className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <p className="text-sm text-gray-500">
              Post and publish content to start building your optimal time profile.
              The AI learns from your post performance automatically.
            </p>
          </div>
        )}
      </div>

      {/* Recent published posts */}
      {publishedPosts.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-semibold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Published posts
            </h2>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
            {publishedPosts.slice(0, 5).map(post => (
              <div key={post.id} className="flex items-center gap-3 px-5 py-3">
                {post.image_url_snapshot && (
                  <img src={post.image_url_snapshot} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 dark:text-gray-200 truncate">
                    {post.caption_snapshot.slice(0, 60)}…
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {post.published_at ? fmt.datetime(post.published_at) : "Published"}
                  </p>
                </div>
                {post.ig_permalink && (
                  <a href={post.ig_permalink} target="_blank" rel="noreferrer"
                    className="btn-ghost p-1.5 flex-shrink-0">
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
