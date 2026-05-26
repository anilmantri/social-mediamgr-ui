import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import type { ContentStatus, PublishStatus, ToneType } from "@/types";

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

export const contentStatusConfig: Record<ContentStatus, { label: string; color: string; bg: string; dot: string }> = {
  draft:     { label: "Draft",     color: "text-gray-600",    bg: "bg-gray-100",    dot: "bg-gray-400" },
  pending:   { label: "Pending",   color: "text-amber-700",   bg: "bg-amber-100",   dot: "bg-amber-500" },
  approved:  { label: "Approved",  color: "text-emerald-700", bg: "bg-emerald-100", dot: "bg-emerald-500" },
  rejected:  { label: "Rejected",  color: "text-rose-700",    bg: "bg-rose-100",    dot: "bg-rose-500" },
  scheduled: { label: "Scheduled", color: "text-blue-700",    bg: "bg-blue-100",    dot: "bg-blue-500" },
  published: { label: "Published", color: "text-violet-700",  bg: "bg-violet-100",  dot: "bg-violet-500" },
  failed:    { label: "Failed",    color: "text-rose-700",    bg: "bg-rose-100",    dot: "bg-rose-500" },
};

export const publishStatusConfig: Record<PublishStatus, { label: string; color: string; bg: string }> = {
  scheduled:   { label: "Scheduled",   color: "text-blue-700",    bg: "bg-blue-100" },
  publishing:  { label: "Publishing…", color: "text-amber-700",   bg: "bg-amber-100" },
  published:   { label: "Published",   color: "text-emerald-700", bg: "bg-emerald-100" },
  failed:      { label: "Failed",      color: "text-rose-700",    bg: "bg-rose-100" },
  cancelled:   { label: "Cancelled",   color: "text-gray-600",    bg: "bg-gray-100" },
  unscheduled: { label: "Unscheduled", color: "text-gray-600",    bg: "bg-gray-100" },
};

export const toneConfig: Record<ToneType, { label: string; emoji: string; desc: string }> = {
  professional: { label: "Professional", emoji: "💼", desc: "Polished & authoritative" },
  inspiring:    { label: "Inspiring",    emoji: "✨", desc: "Motivational & uplifting" },
  witty:        { label: "Witty",        emoji: "😄", desc: "Clever & playful" },
  casual:       { label: "Casual",       emoji: "👋", desc: "Conversational & relaxed" },
  educational:  { label: "Educational",  emoji: "📚", desc: "Informative & clear" },
  promotional:  { label: "Promotional",  emoji: "🚀", desc: "Persuasive & benefit-focused" },
};

export const contentTypeLabels: Record<string, string> = {
  feed_image: "Feed Image", feed_carousel: "Carousel", story: "Story", reel: "Reel",
};

export const fmt = {
  date:     (iso: string) => format(parseISO(iso), "MMM d, yyyy"),
  datetime: (iso: string) => format(parseISO(iso), "MMM d 'at' h:mm a"),
  time:     (iso: string) => format(parseISO(iso), "h:mm a"),
  relative: (iso: string) => formatDistanceToNow(parseISO(iso), { addSuffix: true }),
  number:   (n: number)   => n >= 1_000_000 ? `${(n/1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n/1_000).toFixed(1)}K` : String(n),
  pct:      (n: number)   => `${(n * 100).toFixed(1)}%`,
  score:    (n: number)   => `${Math.round(n * 100)}%`,
};

export const HOUR_LABELS = Array.from({ length: 24 }, (_, i) =>
  i === 0 ? "12am" : i < 12 ? `${i}am` : i === 12 ? "12pm" : `${i - 12}pm`
);
export const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
