"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDraft, useApprove, useReject, useEditContent, useRegenerate, useSchedulePost, useOptimalTime } from "@/hooks";
import { useAppStore } from "@/stores/app";
import { fmt, contentStatusConfig, toneConfig, cn, contentTypeLabels } from "@/lib/utils";
import toast from "react-hot-toast";
import {
  ArrowLeft, CheckCircle, XCircle, Edit3, RefreshCw, Clock,
  Hash, Zap, MessageSquare, History, Eye, Loader2, Save,
  Instagram, Star, Copy, ExternalLink, AlertCircle
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import type { ApprovalAction, ContentVersion } from "@/types";

// ── Version pill ───────────────────────────────────────────────────────────────
function VersionPill({ v, active, onClick }: { v: ContentVersion; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
        active
          ? "border-pink-400 bg-pink-50 dark:bg-pink-950/20 text-pink-700 dark:text-pink-300"
          : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300"
      )}
    >
      v{v.version_number}
      {!v.is_ai_generated && <span className="ml-1 text-gray-400">✏️</span>}
    </button>
  );
}

// ── Audit log entry ────────────────────────────────────────────────────────────
function AuditEntry({ action }: { action: ApprovalAction }) {
  const icons: Record<string, React.ReactNode> = {
    approved:           <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />,
    rejected:           <XCircle className="w-3.5 h-3.5 text-rose-500" />,
    submitted:          <MessageSquare className="w-3.5 h-3.5 text-blue-500" />,
    commented:          <MessageSquare className="w-3.5 h-3.5 text-gray-400" />,
    edited:             <Edit3 className="w-3.5 h-3.5 text-amber-500" />,
    regenerated:        <RefreshCw className="w-3.5 h-3.5 text-violet-500" />,
    revision_requested: <AlertCircle className="w-3.5 h-3.5 text-orange-400" />,
  };
  return (
    <div className="flex items-start gap-2.5 py-2.5">
      <div className="mt-0.5 flex-shrink-0">{icons[action.action] ?? <div className="w-3.5 h-3.5" />}</div>
      <div className="flex-1 min-w-0">
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 capitalize">
          {action.action.replace("_", " ")}
        </span>
        {action.comment && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{action.comment}</p>
        )}
      </div>
      <span className="text-xs text-gray-400 flex-shrink-0">{fmt.relative(action.created_at)}</span>
    </div>
  );
}

// ── Edit panel ────────────────────────────────────────────────────────────────
function EditPanel({ draftId, version, onDone }: {
  draftId: string; version: ContentVersion; onDone: () => void;
}) {
  const [caption, setCaption] = useState(version.caption);
  const [tags, setTags]       = useState(version.hashtags.join(", "));
  const [cta, setCta]         = useState(version.cta ?? "");
  const [summary, setSummary] = useState("");
  const edit = useEditContent();

  const handleSave = async () => {
    if (!summary.trim()) return toast.error("Add a change summary");
    try {
      await edit.mutateAsync({
        id: draftId,
        caption: caption !== version.caption ? caption : undefined,
        hashtags: tags !== version.hashtags.join(", ")
          ? tags.split(",").map(t => t.trim()).filter(Boolean)
          : undefined,
        cta: cta !== (version.cta ?? "") ? cta : undefined,
        change_summary: summary,
      });
      toast.success("Changes saved — new version created");
      onDone();
    } catch { toast.error("Failed to save edits"); }
  };

  return (
    <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Editing — creates new version</p>

      <div>
        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Caption</label>
        <textarea
          className="textarea h-28 text-sm"
          value={caption}
          onChange={e => setCaption(e.target.value)}
          maxLength={2200}
        />
        <p className="text-xs text-gray-400 mt-0.5 text-right">{caption.length}/2200</p>
      </div>

      <div>
        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Hashtags</label>
        <input
          className="input text-sm"
          value={tags}
          onChange={e => setTags(e.target.value)}
          placeholder="fitness, health, motivation"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">CTA</label>
        <input
          className="input text-sm"
          value={cta}
          onChange={e => setCta(e.target.value)}
          placeholder="Drop a 💪 below!"
          maxLength={120}
        />
      </div>

      <div>
        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Change summary <span className="text-rose-400">*</span></label>
        <input
          className="input text-sm"
          value={summary}
          onChange={e => setSummary(e.target.value)}
          placeholder="e.g. Adjusted tone to be more casual"
        />
      </div>

      <div className="flex gap-2">
        <button onClick={handleSave} disabled={edit.isPending} className="btn-primary flex items-center gap-2 text-sm">
          {edit.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Save version
        </button>
        <button onClick={onDone} className="btn-ghost text-sm">Cancel</button>
      </div>
    </div>
  );
}

// ── Reject modal ───────────────────────────────────────────────────────────────
function RejectModal({ draftId, onDone }: { draftId: string; onDone: () => void }) {
  const [reason, setReason] = useState("");
  const reject = useReject();

  const handleSubmit = async () => {
    if (reason.length < 10) return toast.error("Reason must be at least 10 characters");
    try {
      await reject.mutateAsync({ id: draftId, reason });
      toast.success("Post rejected");
      onDone();
    } catch { toast.error("Failed to reject"); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onDone}>
      <div className="card max-w-sm w-full p-5 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2">
          <XCircle className="w-5 h-5 text-rose-500" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Reject content</h3>
        </div>
        <textarea
          className="textarea h-24 text-sm"
          placeholder="Tell the creator what needs to change (min 10 characters)…"
          value={reason}
          onChange={e => setReason(e.target.value)}
          autoFocus
        />
        <div className="flex gap-2">
          <button onClick={handleSubmit} disabled={reject.isPending} className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-rose-600 text-white hover:bg-rose-700 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
            {reject.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
            Reject
          </button>
          <button onClick={onDone} className="btn-secondary px-4 text-sm">Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function ContentDetailPage() {
  const { id }          = useParams<{ id: string }>();
  const router          = useRouter();
  const { workspaceId } = useAppStore();
  const { data: draft, isLoading, refetch } = useDraft(id);
  const { data: optimal } = useOptimalTime(workspaceId);

  const [activeVersionIdx, setActiveVersionIdx] = useState<number | null>(null);
  const [showEdit, setShowEdit]     = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [schedHour, setSchedHour]   = useState(9);
  const [useAI, setUseAI]           = useState(false);

  const approve  = useApprove();
  const regen    = useRegenerate();
  const schedule = useSchedulePost();

  if (isLoading) return (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
    </div>
  );
  if (!draft) return (
    <div className="p-8 text-center text-gray-500">Draft not found. <Link href="/content" className="text-pink-600 hover:underline">Back to content</Link></div>
  );

  const cfg = contentStatusConfig[draft.status];
  const versions = draft.versions ?? (draft.current_version ? [draft.current_version] : []);
  const activeVersion = versions[activeVersionIdx ?? versions.length - 1] ?? draft.current_version;

  const handleApprove = async () => {
    try {
      await approve.mutateAsync({ id: draft.id });
      toast.success("Approved!");
      refetch();
    } catch { toast.error("Failed to approve"); }
  };

  const handleRegenerate = async () => {
    try {
      await regen.mutateAsync({ id: draft.id, regenerate_caption: true, regenerate_image: false });
      toast.success("Regeneration queued");
    } catch { toast.error("Failed to regenerate"); }
  };

  const handleSchedule = async () => {
    const dt = new Date();
    dt.setDate(dt.getDate() + 1);
    dt.setHours(schedHour, 0, 0, 0);
    try {
      await schedule.mutateAsync({
        workspace_id: workspaceId,
        draft_content_id: draft.id,
        scheduled_at: dt.toISOString(),
        use_optimal_time: useAI,
      });
      toast.success("Scheduled!");
      setShowSchedule(false);
      router.push("/calendar");
    } catch (e: any) { toast.error(e?.response?.data?.detail || "Failed to schedule"); }
  };

  const copyCaption = () => {
    if (activeVersion?.caption) {
      navigator.clipboard.writeText(activeVersion.caption);
      toast.success("Caption copied");
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5 animate-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/content" className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
              {draft.generation_prompt ?? "Content detail"}
            </h1>
            <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-semibold", cfg.bg, cfg.color)}>
              {cfg.label}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {contentTypeLabels[draft.content_type]} · v{draft.version_count} · {fmt.relative(draft.created_at)}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {draft.status === "draft" && (
            <button
              onClick={() => toast("Submit flow: use the API directly for now")}
              className="btn-secondary text-sm flex items-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5" /> Submit
            </button>
          )}
          {draft.status === "pending" && (
            <>
              <button onClick={handleApprove} disabled={approve.isPending} className="btn-primary text-sm flex items-center gap-1.5">
                {approve.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                Approve
              </button>
              <button onClick={() => setShowReject(true)} className="px-3 py-2 rounded-lg text-sm font-medium text-rose-600 border border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center gap-1.5 transition-colors">
                <XCircle className="w-3.5 h-3.5" /> Reject
              </button>
            </>
          )}
          {draft.status === "approved" && (
            <button onClick={() => setShowSchedule(true)} className="btn-primary text-sm flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Schedule
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Left: image + caption */}
        <div className="lg:col-span-3 space-y-4">
          {/* Image */}
          {activeVersion?.image_url && (
            <div className="relative rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 aspect-square max-w-md">
              <img
                src={activeVersion.image_url}
                alt={activeVersion.image_alt_text ?? "Generated post image"}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 right-3 flex gap-2">
                <a
                  href={activeVersion.image_url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 bg-white/90 dark:bg-gray-900/90 rounded-lg backdrop-blur-sm hover:bg-white transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-gray-700" />
                </a>
              </div>
              {activeVersion.is_ai_generated && (
                <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/50 rounded-lg text-white text-xs flex items-center gap-1 backdrop-blur-sm">
                  <Zap className="w-3 h-3" /> AI generated
                </div>
              )}
            </div>
          )}

          {/* Caption */}
          {activeVersion && (
            <div className="card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Caption</p>
                <button onClick={copyCaption} className="btn-ghost p-1.5">
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-line">
                {activeVersion.caption}
              </p>

              {activeVersion.cta && (
                <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                  <p className="text-xs text-gray-500 mb-1">CTA</p>
                  <p className="text-sm font-medium text-violet-700 dark:text-violet-400">{activeVersion.cta}</p>
                </div>
              )}

              {/* Hashtags */}
              {activeVersion.hashtags.length > 0 && (
                <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                  <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                    <Hash className="w-3 h-3" /> {activeVersion.hashtags.length} hashtags
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {activeVersion.hashtags.map(h => (
                      <span key={h} className="px-2 py-0.5 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 rounded-md text-xs font-medium">
                        #{h}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Brand voice score */}
              {draft.brand_voice_score != null && (
                <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <Star className="w-3.5 h-3.5 text-violet-500" />
                  <span className="text-xs text-gray-500">Brand voice</span>
                  <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-pink-500 transition-all"
                      style={{ width: `${draft.brand_voice_score * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-violet-600">{fmt.score(draft.brand_voice_score)}</span>
                </div>
              )}
            </div>
          )}

          {/* Edit / regenerate actions */}
          <div className="flex gap-2">
            <button onClick={() => { setShowEdit(!showEdit); }} className="btn-secondary text-sm flex items-center gap-1.5">
              <Edit3 className="w-3.5 h-3.5" /> Edit
            </button>
            <button onClick={handleRegenerate} disabled={regen.isPending} className="btn-secondary text-sm flex items-center gap-1.5">
              {regen.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Regenerate caption
            </button>
          </div>

          {showEdit && activeVersion && (
            <EditPanel
              draftId={draft.id}
              version={activeVersion}
              onDone={() => { setShowEdit(false); refetch(); }}
            />
          )}
        </div>

        {/* Right: metadata + history */}
        <div className="lg:col-span-2 space-y-4">
          {/* Metadata */}
          <div className="card p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Details</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Format</span>
                <span className="text-gray-900 dark:text-gray-100 font-medium">{contentTypeLabels[draft.content_type]}</span>
              </div>
              {activeVersion?.tone && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Tone</span>
                  <span className="text-gray-900 dark:text-gray-100 font-medium">
                    {toneConfig[activeVersion.tone]?.emoji} {toneConfig[activeVersion.tone]?.label}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Versions</span>
                <span className="text-gray-900 dark:text-gray-100 font-medium">{draft.version_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Created</span>
                <span className="text-gray-900 dark:text-gray-100">{fmt.date(draft.created_at)}</span>
              </div>
              {draft.scheduled_at && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Scheduled</span>
                  <span className="text-blue-600 dark:text-blue-400 font-medium">{fmt.datetime(draft.scheduled_at)}</span>
                </div>
              )}
              {draft.published_at && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Published</span>
                  <span className="text-emerald-600 font-medium">{fmt.datetime(draft.published_at)}</span>
                </div>
              )}
              {draft.instagram_post_id && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Instagram</span>
                  <a
                    href={`https://www.instagram.com/p/${draft.instagram_post_id}/`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-pink-600 hover:text-pink-700 flex items-center gap-1 text-xs"
                  >
                    <Instagram className="w-3 h-3" /> View post
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Version history */}
          {versions.length > 1 && (
            <div className="card p-4 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                <History className="w-3.5 h-3.5" /> Version history
              </p>
              <div className="flex flex-wrap gap-1.5">
                {versions.map((v, i) => (
                  <VersionPill
                    key={v.id}
                    v={v}
                    active={i === (activeVersionIdx ?? versions.length - 1)}
                    onClick={() => setActiveVersionIdx(i)}
                  />
                ))}
              </div>
              {activeVersionIdx !== null && activeVersionIdx !== versions.length - 1 && (
                <p className="text-xs text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded">
                  Viewing v{versions[activeVersionIdx]?.version_number} — not the current version
                </p>
              )}
            </div>
          )}

          {/* Audit log */}
          {draft.approval_actions.length > 0 && (
            <div className="card p-4 space-y-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Activity</p>
              <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
                {draft.approval_actions.map(a => <AuditEntry key={a.id} action={a} />)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Schedule inline panel */}
      {showSchedule && draft.status === "approved" && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowSchedule(false)}>
          <div className="card max-w-sm w-full p-5 space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" /> Schedule this post
            </h3>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={useAI} onChange={e => setUseAI(e.target.checked)} className="accent-violet-500 w-4 h-4" />
              <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-violet-500" /> Use AI optimal time
              </span>
            </label>

            {!useAI && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">Tomorrow at:</p>
                <select className="input text-sm" value={schedHour} onChange={e => setSchedHour(+e.target.value)}>
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>{String(i).padStart(2, "0")}:00</option>
                  ))}
                </select>
              </div>
            )}

            {useAI && optimal?.next_suggested_at && (
              <p className="text-xs text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-900/20 px-3 py-2 rounded-lg">
                AI recommends: {fmt.datetime(optimal.next_suggested_at)}
                {optimal.is_reliable
                  ? <span className="ml-1 text-emerald-600">(reliable)</span>
                  : <span className="ml-1 text-amber-600">(limited data)</span>
                }
              </p>
            )}

            <div className="flex gap-2">
              <button onClick={handleSchedule} disabled={schedule.isPending} className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm">
                {schedule.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
                Confirm schedule
              </button>
              <button onClick={() => setShowSchedule(false)} className="btn-secondary px-4 text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showReject && (
        <RejectModal draftId={draft.id} onDone={() => { setShowReject(false); refetch(); }} />
      )}
    </div>
  );
}
