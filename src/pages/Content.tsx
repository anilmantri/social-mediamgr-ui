import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Plus, RefreshCw, CheckCircle, XCircle, Eye, Clock, Loader2, MessageSquare, Hash, Zap } from "lucide-react";
import { useAppStore } from "@/stores/app";
import { useDrafts, useGenerateContent, useJob, useApprove, useReject } from "@/hooks";
import { fmt, contentStatusConfig, toneConfig, cn, contentTypeLabels } from "@/lib/utils";
import { StatusBadge, EmptyState, PageSpinner } from "@/components/shared";
import toast from "react-hot-toast";
import type { DraftContent, ToneType, ContentType, ContentStatus } from "@/types";

const TABS: { label: string; value: ContentStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Drafts", value: "draft" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Scheduled", value: "scheduled" },
  { label: "Published", value: "published" },
];

// ── Generate panel ─────────────────────────────────────────────────────────────
function GeneratePanel({ wsId, onClose }: { wsId: string; onClose: () => void }) {
  const [topic, setTopic]       = useState("");
  const [tone, setTone]         = useState<ToneType>("professional");
  const [type, setType]         = useState<ContentType>("feed_image");
  const [withImg, setWithImg]   = useState(true);
  const [jobId, setJobId]       = useState<string | null>(null);
  const generate = useGenerateContent();
  const { data: job }           = useJob(jobId);

  useEffect(() => {
    if (job?.status === "success") { toast.success("Content generated!"); onClose(); }
    if (job?.status === "failed")  { toast.error(job.error_message || "Generation failed"); }
  }, [job?.status]);

  const busy = generate.isPending || (!!jobId && job && !["success","failed"].includes(job.status));

  const submit = async () => {
    if (!topic.trim()) return toast.error("Enter a topic first");
    try {
      const r = await generate.mutateAsync({ workspace_id: wsId, topic: topic.trim(), content_type: type, tone, include_image: withImg });
      setJobId(r.data.job_id);
    } catch { toast.error("Failed to start generation"); }
  };

  return (
    <div className="card p-5 mb-5 border-pink-200 dark:border-pink-900/40 animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-pink-500" /> Generate content
        </h2>
        <button onClick={onClose} className="btn-ghost text-xs">Cancel</button>
      </div>
      <div className="space-y-3">
        <div>
          <label className="label">Topic / idea</label>
          <textarea className="textarea h-20" placeholder="e.g. 5 tips for better morning workouts…" value={topic} onChange={e => setTopic(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Tone</label>
            <select className="select" value={tone} onChange={e => setTone(e.target.value as ToneType)}>
              {Object.entries(toneConfig).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Format</label>
            <select className="select" value={type} onChange={e => setType(e.target.value as ContentType)}>
              {Object.entries(contentTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
          <input type="checkbox" checked={withImg} onChange={e => setWithImg(e.target.checked)} className="w-4 h-4 accent-pink-500 rounded" />
          Generate image with DALL-E 3
        </label>

        <button onClick={submit} disabled={!!busy} className="btn-primary w-full">
          {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> {job?.progress_pct ? `${job.progress_pct}%` : "Generating…"}</> : <><Sparkles className="w-4 h-4" /> Generate</>}
        </button>

        {busy && (
          <div className="bg-violet-50 rounded-lg p-3 space-y-1.5">
            <p className="text-xs text-violet-700 font-medium flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> AI is working…</p>
            <div className="w-full bg-violet-200 rounded-full h-1">
              <div className="bg-violet-600 h-1 rounded-full transition-all duration-500" style={{ width: `${job?.progress_pct ?? 15}%` }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Draft card ────────────────────────────────────────────────────────────────
function DraftCard({ draft, wsId }: { draft: DraftContent; wsId: string }) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason]       = useState("");
  const approve = useApprove();
  const reject  = useReject();
  const v = draft.current_version;

  const handleApprove = async () => {
    try { await approve.mutateAsync({ id: draft.id }); toast.success("Approved!"); }
    catch { toast.error("Failed to approve"); }
  };
  const handleReject = async () => {
    if (reason.length < 10) return toast.error("Reason must be at least 10 characters");
    try { await reject.mutateAsync({ id: draft.id, reason }); toast.success("Rejected"); setRejecting(false); }
    catch { toast.error("Failed to reject"); }
  };

  return (
    <div className={cn("card overflow-hidden hover:shadow-card-hover transition-shadow", draft.status === "pending" && "border-amber-200 dark:border-amber-900/40")}>
      <div className="flex gap-4 p-4">
        {v?.image_url
          ? <img src={v.image_url} alt="" className="w-20 h-20 rounded-lg object-cover flex-shrink-0 bg-gray-100" />
          : <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-violet-100 to-pink-100 flex items-center justify-center flex-shrink-0"><Sparkles className="w-6 h-6 text-violet-400" /></div>
        }
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-2 leading-snug">
              {v?.caption ?? draft.generation_prompt ?? "No caption yet"}
            </p>
            <StatusBadge status={draft.status} />
          </div>
          {v?.hashtags && v.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {v.hashtags.slice(0, 4).map(h => <span key={h} className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded text-xs">#{h}</span>)}
              {v.hashtags.length > 4 && <span className="text-xs text-gray-400">+{v.hashtags.length - 4}</span>}
            </div>
          )}
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{fmt.relative(draft.created_at)}</span>
            {draft.brand_voice_score != null && <span className="flex items-center gap-1 text-violet-600"><Zap className="w-3 h-3" />{fmt.score(draft.brand_voice_score)}</span>}
          </div>
        </div>
      </div>

      {rejecting && (
        <div className="px-4 pb-3 space-y-2 border-t border-gray-100 pt-3">
          <textarea className="textarea h-16 text-sm" placeholder="Reason for rejection…" value={reason} onChange={e => setReason(e.target.value)} />
          <div className="flex gap-2">
            <button onClick={handleReject} disabled={reject.isPending} className="btn-danger text-xs py-1.5">
              {reject.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />} Confirm
            </button>
            <button onClick={() => setRejecting(false)} className="btn-ghost text-xs">Cancel</button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50/50 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800">
        <Link to={`/content/${draft.id}`} className="btn-ghost text-xs"><Eye className="w-3.5 h-3.5" /> View</Link>
        {draft.status === "pending" && (
          <>
            <button onClick={handleApprove} disabled={approve.isPending} className="btn-primary text-xs py-1.5">
              {approve.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />} Approve
            </button>
            <button onClick={() => setRejecting(true)} className="text-xs px-2.5 py-1.5 rounded-lg font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-1 transition-colors">
              <XCircle className="w-3 h-3" /> Reject
            </button>
          </>
        )}
        {draft.status === "approved" && (
          <Link to={`/calendar?draft=${draft.id}`} className="btn-primary text-xs py-1.5"><Clock className="w-3 h-3" /> Schedule</Link>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function ContentPage() {
  const { workspaceId } = useAppStore();
  const [tab, setTab]   = useState<ContentStatus | "all">("all");
  const [showGen, setShowGen] = useState(false);
  const [page, setPage] = useState(1);
  const { data, isLoading, refetch } = useDrafts(workspaceId, tab === "all" ? undefined : tab, page);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Content Studio</h1>
          <p className="text-sm text-gray-500 mt-0.5">{data?.total ?? 0} posts</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()} className="btn-ghost p-2"><RefreshCw className="w-4 h-4" /></button>
          <button onClick={() => setShowGen(!showGen)} className="btn-primary"><Plus className="w-4 h-4" /> Generate</button>
        </div>
      </div>

      {showGen && <GeneratePanel wsId={workspaceId} onClose={() => setShowGen(false)} />}

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.value} onClick={() => { setTab(t.value); setPage(1); }}
            className={cn("px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors",
              tab === t.value ? "border-pink-500 text-pink-600" : "border-transparent text-gray-500 hover:text-gray-700")}>
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? <PageSpinner /> : data?.items.length === 0 ? (
        <EmptyState icon={Sparkles} title="No content here" desc="Click Generate to create your first AI post"
          action={<button onClick={() => setShowGen(true)} className="btn-primary"><Plus className="w-4 h-4" /> Create post</button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {data!.items.map(d => <DraftCard key={d.id} draft={d} wsId={workspaceId} />)}
        </div>
      )}

      {data && data.total > 20 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-sm">← Prev</button>
          <span className="text-sm text-gray-500">Page {page}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={!data.has_next} className="btn-secondary text-sm">Next →</button>
        </div>
      )}
    </div>
  );
}
