"use client";
import { useState, useEffect } from "react";
import { useAppStore } from "@/stores/app";
import { useDrafts, useGenerateContent, useJob, useApprove, useReject } from "@/hooks";
import { fmt, contentStatusConfig, toneConfig, cn, contentTypeLabels } from "@/lib/utils";
import toast from "react-hot-toast";
import {
  Sparkles, Filter, RefreshCw, CheckCircle, XCircle,
  Eye, Clock, Image as ImageIcon, Hash, Zap, ChevronDown,
  Plus, Loader2, MessageSquare, Edit3
} from "lucide-react";
import Link from "next/link";
import type { DraftContent, ToneType, ContentType, ContentStatus, JobStatus2 } from "@/types";

const STATUS_TABS: { label: string; value: ContentStatus | "all" }[] = [
  { label: "All",       value: "all" },
  { label: "Drafts",    value: "draft" },
  { label: "Pending",   value: "pending" },
  { label: "Approved",  value: "approved" },
  { label: "Scheduled", value: "scheduled" },
  { label: "Published", value: "published" },
];

// ── Generate form ──────────────────────────────────────────────────────────────
function GeneratePanel({ workspaceId, onClose }: { workspaceId: string; onClose: () => void }) {
  const [topic, setTopic]     = useState("");
  const [tone, setTone]       = useState<ToneType>("professional");
  const [type, setType]       = useState<ContentType>("feed_image");
  const [withImage, setWithImage] = useState(true);
  const [jobId, setJobId]     = useState<string | null>(null);

  const generate = useGenerateContent();
  const { data: job } = useJob(jobId);

  const busy = generate.isPending || (job && !["success", "failed"].includes(job.status));

  useEffect(() => {
    if (job?.status === "success") {
      toast.success("Content generated!");
      onClose();
    }
    if (job?.status === "failed") {
      toast.error(job.error_message || "Generation failed");
    }
  }, [job?.status]);

  const submit = async () => {
    if (!topic.trim()) return toast.error("Enter a topic");
    try {
      const r = await generate.mutateAsync({
        workspace_id: workspaceId,
        topic: topic.trim(),
        content_type: type,
        tone,
        include_image: withImage,
      });
      setJobId(r.data.job_id);
    } catch { toast.error("Failed to start generation"); }
  };

  return (
    <div className="card p-5 mb-5 border-pink-200 dark:border-pink-900/40 bg-gradient-to-br from-white to-pink-50/30 dark:from-gray-900 dark:to-pink-950/10 animate-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-pink-500" /> Generate content
        </h2>
        <button onClick={onClose} className="btn-ghost text-xs">Cancel</button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">Topic / idea</label>
          <textarea
            className="textarea h-20"
            placeholder="e.g. 5 tips for better morning workouts..."
            value={topic}
            onChange={e => setTopic(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">Tone</label>
            <select className="input text-sm" value={tone} onChange={e => setTone(e.target.value as ToneType)}>
              {Object.entries(toneConfig).map(([k, v]) => (
                <option key={k} value={k}>{v.emoji} {v.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">Format</label>
            <select className="input text-sm" value={type} onChange={e => setType(e.target.value as ContentType)}>
              {Object.entries(contentTypeLabels).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={withImage} onChange={e => setWithImage(e.target.checked)}
            className="w-4 h-4 accent-pink-500 rounded" />
          <span className="text-sm text-gray-700 dark:text-gray-300">Generate image with DALL-E 3</span>
        </label>

        <button onClick={submit} disabled={!!busy} className="btn-primary w-full flex items-center justify-center gap-2">
          {busy
            ? <><Loader2 className="w-4 h-4 animate-spin" /> {job?.progress_pct ? `${job.progress_pct}%` : "Generating…"}</>
            : <><Sparkles className="w-4 h-4" /> Generate</>
          }
        </button>

        {busy && (
          <div className="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-3 text-xs text-violet-700 dark:text-violet-300">
            <div className="flex items-center gap-2 mb-1.5">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span className="font-medium">AI is working…</span>
            </div>
            <div className="w-full bg-violet-200 dark:bg-violet-800 rounded-full h-1">
              <div
                className="bg-violet-600 h-1 rounded-full transition-all duration-500"
                style={{ width: `${job?.progress_pct ?? 10}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Draft card ─────────────────────────────────────────────────────────────────
function DraftCard({ draft, workspaceId }: { draft: DraftContent; workspaceId: string }) {
  const cfg     = contentStatusConfig[draft.status];
  const approve = useApprove();
  const reject  = useReject();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  const handleApprove = async () => {
    try {
      await approve.mutateAsync({ id: draft.id });
      toast.success("Approved!");
    } catch { toast.error("Failed to approve"); }
  };

  const handleReject = async () => {
    if (reason.length < 10) return toast.error("Please give a reason (min 10 chars)");
    try {
      await reject.mutateAsync({ id: draft.id, reason });
      toast.success("Rejected");
      setRejecting(false);
    } catch { toast.error("Failed to reject"); }
  };

  const v = draft.current_version;

  return (
    <div className={cn("card overflow-hidden transition-shadow hover:shadow-card-hover", {
      "border-amber-200 dark:border-amber-900/40": draft.status === "pending",
    })}>
      <div className="flex gap-4 p-4">
        {/* Image */}
        <div className="flex-shrink-0">
          {v?.image_url ? (
            <img src={v.image_url} alt="" className="w-20 h-20 rounded-lg object-cover bg-gray-100" />
          ) : (
            <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-violet-100 to-pink-100 dark:from-violet-900/20 dark:to-pink-900/20 flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-violet-400" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-2 leading-snug">
              {v?.caption ?? draft.generation_prompt ?? "No caption yet"}
            </p>
            <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0", cfg.bg, cfg.color)}>
              {cfg.label}
            </span>
          </div>

          {v?.hashtags && v.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {v.hashtags.slice(0, 5).map(h => (
                <span key={h} className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded text-xs">
                  #{h}
                </span>
              ))}
              {v.hashtags.length > 5 && (
                <span className="px-1.5 py-0.5 text-gray-400 text-xs">+{v.hashtags.length - 5}</span>
              )}
            </div>
          )}

          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {fmt.relative(draft.created_at)}
            </span>
            {draft.brand_voice_score != null && (
              <span className="flex items-center gap-1 text-violet-600">
                <Zap className="w-3 h-3" /> Voice {fmt.score(draft.brand_voice_score)}
              </span>
            )}
            <span>{contentTypeLabels[draft.content_type]}</span>
          </div>
        </div>
      </div>

      {/* Reject reason input */}
      {rejecting && (
        <div className="px-4 pb-3 pt-0 space-y-2 border-t border-gray-100 dark:border-gray-800">
          <textarea
            className="textarea h-16 text-sm"
            placeholder="Reason for rejection (min 10 characters)…"
            value={reason}
            onChange={e => setReason(e.target.value)}
          />
          <div className="flex gap-2">
            <button onClick={handleReject} disabled={reject.isPending} className="btn-primary text-xs py-1.5 flex items-center gap-1">
              {reject.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />} Confirm reject
            </button>
            <button onClick={() => setRejecting(false)} className="btn-ghost text-xs py-1.5">Cancel</button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50/50 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800">
        <Link href={`/content/${draft.id}`} className="btn-ghost text-xs flex items-center gap-1">
          <Eye className="w-3.5 h-3.5" /> View
        </Link>
        {draft.status === "draft" && (
          <Link href={`/content/${draft.id}?action=submit`} className="btn-ghost text-xs flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5" /> Submit
          </Link>
        )}
        {draft.status === "pending" && (
          <>
            <button
              onClick={handleApprove}
              disabled={approve.isPending}
              className="btn-primary text-xs py-1.5 flex items-center gap-1"
            >
              {approve.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />} Approve
            </button>
            <button
              onClick={() => setRejecting(true)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center gap-1 transition-colors"
            >
              <XCircle className="w-3 h-3" /> Reject
            </button>
          </>
        )}
        {draft.status === "approved" && (
          <Link href={`/calendar?draft=${draft.id}`} className="btn-primary text-xs py-1.5 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Schedule
          </Link>
        )}
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function ContentPage() {
  const { workspaceId } = useAppStore();
  const [activeTab, setActiveTab]       = useState<ContentStatus | "all">("all");
  const [showGenerate, setShowGenerate] = useState(false);
  const [page, setPage]                 = useState(1);

  const { data, isLoading, refetch } = useDrafts(
    workspaceId,
    activeTab === "all" ? undefined : activeTab,
    page,
  );

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Content Studio</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {data?.total ?? 0} posts · AI-powered generation & approval
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()} className="btn-ghost p-2">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setShowGenerate(!showGenerate)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Generate
          </button>
        </div>
      </div>

      {/* Generate panel */}
      {showGenerate && (
        <GeneratePanel workspaceId={workspaceId} onClose={() => setShowGenerate(false)} />
      )}

      {/* Status tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => { setActiveTab(tab.value); setPage(1); }}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors",
              activeTab === tab.value
                ? "border-pink-500 text-pink-600 dark:text-pink-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
        </div>
      ) : data?.items.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <div className="w-16 h-16 rounded-2xl ig-gradient flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">No content here yet</p>
          <p className="text-sm text-gray-400">Click Generate to create your first AI post</p>
          <button onClick={() => setShowGenerate(true)} className="btn-primary mx-auto">
            <Plus className="w-4 h-4" /> Create first post
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {data!.items.map(d => (
            <DraftCard key={d.id} draft={d} workspaceId={workspaceId} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.total > 20 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="btn-secondary text-sm">← Prev</button>
          <span className="text-sm text-gray-500">Page {page}</span>
          <button onClick={() => setPage(p => p+1)} disabled={!data.has_next} className="btn-secondary text-sm">Next →</button>
        </div>
      )}
    </div>
  );
}
