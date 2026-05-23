"use client";
import { useAppStore } from "@/stores/app";
import { useDrafts, useScheduledPosts, useInstagramAccount, useOptimalTime } from "@/hooks";
import { fmt, contentStatusConfig, cn } from "@/lib/utils";
import { format, addDays } from "date-fns";
import {
  Sparkles, Clock, CheckCircle, TrendingUp,
  Instagram, Calendar, Zap, ArrowRight, Users, Eye
} from "lucide-react";
import Link from "next/link";
import type { DraftContent, ScheduledPost } from "@/types";

function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div className="card p-5 flex items-start gap-4">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", color)}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function DraftRow({ draft }: { draft: DraftContent }) {
  const cfg = contentStatusConfig[draft.status];
  return (
    <Link
      href={`/content/${draft.id}`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors rounded-lg group"
    >
      {draft.current_version?.image_url ? (
        <img
          src={draft.current_version.image_url}
          alt=""
          className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-gray-100"
        />
      ) : (
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-100 to-pink-100 dark:from-violet-900/30 dark:to-pink-900/30 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-violet-500" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900 dark:text-gray-100 truncate font-medium">
          {draft.generation_prompt || draft.current_version?.caption?.slice(0, 60) || "Untitled"}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">{fmt.relative(draft.created_at)}</p>
      </div>
      <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0", cfg.bg, cfg.color)}>
        {cfg.label}
      </span>
      <ArrowRight className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
    </Link>
  );
}

function ScheduledRow({ post }: { post: ScheduledPost }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {post.image_url_snapshot ? (
        <img src={post.image_url_snapshot} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-gray-100" />
      ) : (
        <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
          <Calendar className="w-4 h-4 text-blue-500" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
          {post.caption_snapshot.slice(0, 55)}…
        </p>
        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-0.5">
          {fmt.datetime(post.scheduled_at)}
        </p>
      </div>
      {post.is_ai_optimised_time && (
        <span className="px-2 py-0.5 rounded-full text-xs bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 font-medium flex-shrink-0 flex items-center gap-1">
          <Zap className="w-3 h-3" /> AI time
        </span>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { workspaceId, workspaceName } = useAppStore();
  const { data: drafts }    = useDrafts(workspaceId);
  const { data: pending }   = useDrafts(workspaceId, "pending");
  const { data: scheduled } = useScheduledPosts(workspaceId, "scheduled");
  const { data: account }   = useInstagramAccount(workspaceId);
  const { data: optTime }   = useOptimalTime(workspaceId);

  const pendingCount  = pending?.total  ?? 0;
  const draftCount    = drafts?.total   ?? 0;
  const scheduledCount = scheduled?.total ?? 0;

  const today = format(new Date(), "EEEE, MMMM d");

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Good morning 👋
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{today} · {workspaceName}</p>
        </div>
        {account && (
          <Link href="/settings" className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-violet-50 to-pink-50 dark:from-violet-950/40 dark:to-pink-950/40 border border-pink-100 dark:border-pink-900/30 hover:shadow-ig transition-shadow">
            <div className="w-7 h-7 rounded-full ig-gradient flex items-center justify-center">
              <Instagram className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">@{account.instagram_username}</p>
              <p className="text-xs text-gray-500">{fmt.number(account.followers_count)} followers</p>
            </div>
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total drafts"
          value={draftCount}
          sub="all time"
          icon={Sparkles}
          color="bg-violet-50 dark:bg-violet-900/20 text-violet-600"
        />
        <StatCard
          label="Awaiting review"
          value={pendingCount}
          sub={pendingCount > 0 ? "needs your attention" : "all clear"}
          icon={Clock}
          color={cn(
            pendingCount > 0
              ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600"
              : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600"
          )}
        />
        <StatCard
          label="Scheduled"
          value={scheduledCount}
          sub="upcoming posts"
          icon={Calendar}
          color="bg-blue-50 dark:bg-blue-900/20 text-blue-600"
        />
        <StatCard
          label="Followers"
          value={account ? fmt.number(account.followers_count) : "—"}
          sub={account ? `@${account.instagram_username}` : "Connect Instagram"}
          icon={Users}
          color="bg-pink-50 dark:bg-pink-900/20 text-pink-600"
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent drafts */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Recent content</h2>
            <Link href="/content" className="text-xs text-pink-600 hover:text-pink-700 font-medium flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
            {drafts?.items.slice(0, 5).map(d => <DraftRow key={d.id} draft={d} />) ?? (
              <p className="px-5 py-8 text-sm text-center text-gray-400">No content yet. <Link href="/content" className="text-pink-600 hover:underline">Create your first post →</Link></p>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Upcoming scheduled */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Upcoming</h2>
              <Link href="/calendar" className="text-xs text-pink-600 hover:text-pink-700 font-medium">Calendar →</Link>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
              {scheduled?.items.slice(0, 3).map(p => <ScheduledRow key={p.id} post={p} />) ?? (
                <p className="px-4 py-6 text-sm text-center text-gray-400">No scheduled posts</p>
              )}
            </div>
          </div>

          {/* Best time to post */}
          {optTime && (
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-violet-500" />
                <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Best time to post</h2>
              </div>
              {optTime.suggested_slots.slice(0, 3).map((slot, i) => (
                <div key={i} className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{slot.day_name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {slot.hour_of_day}:00
                    </span>
                    <div className="w-16 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-pink-500"
                        style={{ width: `${slot.confidence_score * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              {!optTime.is_reliable && (
                <p className="text-xs text-amber-600 dark:text-amber-500 mt-2 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded">
                  Need {10 - optTime.based_on_posts} more posts for accurate suggestions
                </p>
              )}
            </div>
          )}

          {/* Quick actions */}
          <div className="card p-4 space-y-2">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-3">Quick actions</h2>
            <Link href="/content?action=generate" className="btn-primary w-full flex items-center justify-center gap-2 text-sm py-2.5">
              <Sparkles className="w-4 h-4" /> Generate content
            </Link>
            <Link href="/calendar" className="btn-secondary w-full flex items-center justify-center gap-2 text-sm py-2.5">
              <Calendar className="w-4 h-4" /> View calendar
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
