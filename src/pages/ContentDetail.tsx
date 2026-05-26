import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, CheckCircle, XCircle, Edit3, RefreshCw, Clock, Hash, Zap, Loader2, Save, Copy, ExternalLink, History } from "lucide-react";
import { useDraft, useApprove, useReject, useEditContent, useRegenerate, useSchedulePost, useOptimalTime } from "@/hooks";
import { useAppStore } from "@/stores/app";
import { fmt, toneConfig, cn, contentTypeLabels, HOUR_LABELS } from "@/lib/utils";
import { StatusBadge, Modal, PageSpinner } from "@/components/shared";
import toast from "react-hot-toast";
import type { ContentVersion } from "@/types";

function VersionPill({ v, active, onClick }: { v: ContentVersion; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn("px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors",
      active ? "border-pink-400 bg-pink-50 text-pink-700" : "border-gray-200 text-gray-500 hover:border-gray-300")}>
      v{v.version_number}{!v.is_ai_generated && " ✏️"}
    </button>
  );
}

export function ContentDetailPage() {
  const { id }          = useParams<{ id: string }>();
  const navigate        = useNavigate();
  const { workspaceId } = useAppStore();
  const { data: draft, isLoading, refetch } = useDraft(id!);
  const { data: optimal } = useOptimalTime(workspaceId);

  const [vIdx, setVIdx]           = useState<number | null>(null);
  const [showEdit, setShowEdit]   = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [editCaption, setEditCaption]   = useState("");
  const [editTags, setEditTags]         = useState("");
  const [editSummary, setEditSummary]   = useState("");
  const [schedHour, setSchedHour]       = useState(9);
  const [useAI, setUseAI]               = useState(false);

  const approve  = useApprove();
  const reject   = useReject();
  const edit     = useEditContent();
  const regen    = useRegenerate();
  const schedule = useSchedulePost();

  if (isLoading) return <PageSpinner />;
  if (!draft) return <div className="p-8 text-center text-gray-500">Draft not found. <Link to="/content" className="text-pink-600">Go back</Link></div>;

  const versions = draft.versions ?? (draft.current_version ? [draft.current_version] : []);
  const activeV  = versions[vIdx ?? versions.length - 1] ?? draft.current_version;

  const handleApprove = async () => {
    try { await approve.mutateAsync({ id: draft.id }); toast.success("Approved!"); refetch(); }
    catch { toast.error("Failed to approve"); }
  };
  const handleReject = async () => {
    if (rejectReason.length < 10) return toast.error("Reason needs 10+ characters");
    try { await reject.mutateAsync({ id: draft.id, reason: rejectReason }); toast.success("Rejected"); setShowReject(false); refetch(); }
    catch { toast.error("Failed to reject"); }
  };
  const handleEdit = async () => {
    if (!editSummary.trim()) return toast.error("Add a change summary");
    try {
      await edit.mutateAsync({ id: draft.id, caption: editCaption || undefined, hashtags: editTags ? editTags.split(",").map(t => t.trim()) : undefined, change_summary: editSummary });
      toast.success("New version saved"); setShowEdit(false); refetch();
    } catch { toast.error("Failed to save"); }
  };
  const handleSchedule = async () => {
    const dt = new Date(); dt.setDate(dt.getDate() + 1); dt.setHours(schedHour, 0, 0, 0);
    try {
      await schedule.mutateAsync({ workspace_id: workspaceId, draft_content_id: draft.id, scheduled_at: dt.toISOString(), use_optimal_time: useAI });
      toast.success("Scheduled!"); setShowSchedule(false); navigate("/calendar");
    } catch (e: any) { toast.error(e?.response?.data?.detail || "Failed to schedule"); }
  };
  const startEdit = () => { setEditCaption(activeV?.caption ?? ""); setEditTags((activeV?.hashtags ?? []).join(", ")); setEditSummary(""); setShowEdit(true); };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/content" className="btn-ghost p-2"><ArrowLeft className="w-4 h-4" /></Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">{draft.generation_prompt ?? "Content detail"}</h1>
            <StatusBadge status={draft.status} />
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{contentTypeLabels[draft.content_type]} · v{draft.version_count} · {fmt.relative(draft.created_at)}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {draft.status === "pending" && (
            <>
              <button onClick={handleApprove} disabled={approve.isPending} className="btn-primary text-sm">
                {approve.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />} Approve
              </button>
              <button onClick={() => setShowReject(true)} className="btn-danger text-sm"><XCircle className="w-3.5 h-3.5" /> Reject</button>
            </>
          )}
          {draft.status === "approved" && (
            <button onClick={() => setShowSchedule(true)} className="btn-primary text-sm"><Clock className="w-3.5 h-3.5" /> Schedule</button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Left: image + caption */}
        <div className="lg:col-span-3 space-y-4">
          {activeV?.image_url && (
            <div className="relative rounded-2xl overflow-hidden bg-gray-100 aspect-square max-w-sm">
              <img src={activeV.image_url} alt={activeV.image_alt_text ?? ""} className="w-full h-full object-cover" />
              <a href={activeV.image_url} target="_blank" rel="noreferrer" className="absolute top-3 right-3 p-2 bg-white/90 rounded-lg hover:bg-white transition-colors">
                <ExternalLink className="w-4 h-4 text-gray-700" />
              </a>
              {activeV.is_ai_generated && (
                <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/50 rounded-lg text-white text-xs flex items-center gap-1">
                  <Zap className="w-3 h-3" /> AI generated
                </div>
              )}
            </div>
          )}

          {activeV && (
            <div className="card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Caption</p>
                <button onClick={() => { navigator.clipboard.writeText(activeV.caption); toast.success("Copied!"); }} className="btn-ghost p-1.5">
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-line">{activeV.caption}</p>
              {activeV.cta && <div className="pt-2 border-t border-gray-100"><p className="text-xs text-gray-400 mb-1">CTA</p><p className="text-sm font-medium text-violet-700">{activeV.cta}</p></div>}
              {activeV.hashtags.length > 0 && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-400 mb-2 flex items-center gap-1"><Hash className="w-3 h-3" />{activeV.hashtags.length} hashtags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {activeV.hashtags.map(h => <span key={h} className="px-2 py-0.5 bg-violet-50 text-violet-700 rounded-md text-xs font-medium">#{h}</span>)}
                  </div>
                </div>
              )}
              {draft.brand_voice_score != null && (
                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                  <Zap className="w-3.5 h-3.5 text-violet-500" />
                  <span className="text-xs text-gray-500">Brand voice</span>
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-pink-500" style={{ width: `${draft.brand_voice_score * 100}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-violet-600">{fmt.score(draft.brand_voice_score)}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={startEdit} className="btn-secondary text-sm"><Edit3 className="w-3.5 h-3.5" /> Edit</button>
            <button onClick={() => { regen.mutateAsync({ id: draft.id, regenerate_caption: true, regenerate_image: false }); toast.success("Regenerating…"); }} disabled={regen.isPending} className="btn-secondary text-sm">
              {regen.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Regenerate
            </button>
          </div>

          {showEdit && activeV && (
            <div className="card p-4 space-y-3 border-amber-200">
              <p className="text-xs font-semibold text-gray-500 uppercase">Editing — creates new version</p>
              <div><label className="label">Caption</label><textarea className="textarea h-28 text-sm" value={editCaption} onChange={e => setEditCaption(e.target.value)} /></div>
              <div><label className="label">Hashtags (comma separated)</label><input className="input text-sm" value={editTags} onChange={e => setEditTags(e.target.value)} /></div>
              <div><label className="label">Change summary *</label><input className="input text-sm" value={editSummary} onChange={e => setEditSummary(e.target.value)} placeholder="e.g. Adjusted tone" /></div>
              <div className="flex gap-2">
                <button onClick={handleEdit} disabled={edit.isPending} className="btn-primary text-sm">{edit.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save</button>
                <button onClick={() => setShowEdit(false)} className="btn-ghost text-sm">Cancel</button>
              </div>
            </div>
          )}
        </div>

        {/* Right: metadata + history */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-4 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Details</p>
            {[
              ["Format", contentTypeLabels[draft.content_type]],
              activeV?.tone ? ["Tone", `${toneConfig[activeV.tone]?.emoji} ${toneConfig[activeV.tone]?.label}`] : null,
              ["Versions", String(draft.version_count)],
              ["Created", fmt.date(draft.created_at)],
              draft.scheduled_at ? ["Scheduled", fmt.datetime(draft.scheduled_at)] : null,
              draft.published_at ? ["Published", fmt.datetime(draft.published_at)] : null,
            ].filter(Boolean).map(([k, v]: any) => (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-gray-500">{k}</span>
                <span className="text-gray-900 dark:text-gray-100 font-medium">{v}</span>
              </div>
            ))}
          </div>

          {versions.length > 1 && (
            <div className="card p-4 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1"><History className="w-3.5 h-3.5" /> Version history</p>
              <div className="flex flex-wrap gap-1.5">
                {versions.map((v, i) => <VersionPill key={v.id} v={v} active={i === (vIdx ?? versions.length - 1)} onClick={() => setVIdx(i)} />)}
              </div>
            </div>
          )}

          {draft.approval_actions.length > 0 && (
            <div className="card p-4 space-y-1">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Activity</p>
              {draft.approval_actions.map(a => (
                <div key={a.id} className="flex items-start gap-2 py-2 border-b border-gray-50 last:border-0">
                  <span className="text-xs font-semibold text-gray-700 capitalize">{a.action.replace("_", " ")}</span>
                  {a.comment && <p className="text-xs text-gray-500 flex-1">{a.comment}</p>}
                  <span className="text-xs text-gray-400 flex-shrink-0">{fmt.relative(a.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reject modal */}
      {showReject && (
        <Modal title="Reject content" onClose={() => setShowReject(false)}>
          <textarea className="textarea h-24 text-sm" placeholder="Reason for rejection (10+ chars)…" value={rejectReason} onChange={e => setRejectReason(e.target.value)} autoFocus />
          <div className="flex gap-2">
            <button onClick={handleReject} disabled={reject.isPending} className="btn-danger flex-1">
              {reject.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />} Reject
            </button>
            <button onClick={() => setShowReject(false)} className="btn-secondary px-4">Cancel</button>
          </div>
        </Modal>
      )}

      {/* Schedule modal */}
      {showSchedule && (
        <Modal title="Schedule post" onClose={() => setShowSchedule(false)}>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
            <input type="checkbox" checked={useAI} onChange={e => setUseAI(e.target.checked)} className="w-4 h-4 accent-violet-500" />
            <Zap className="w-3.5 h-3.5 text-violet-500" /> Use AI optimal time
          </label>
          {!useAI && (
            <div><p className="text-sm text-gray-600 mb-2">Tomorrow at:</p>
              <select className="select" value={schedHour} onChange={e => setSchedHour(+e.target.value)}>
                {HOUR_LABELS.map((l, i) => <option key={i} value={i}>{l}</option>)}
              </select>
            </div>
          )}
          {useAI && optimal?.next_suggested_at && (
            <p className="text-xs text-violet-700 bg-violet-50 px-3 py-2 rounded-lg">AI recommends: {fmt.datetime(optimal.next_suggested_at)}</p>
          )}
          <div className="flex gap-2">
            <button onClick={handleSchedule} disabled={schedule.isPending} className="btn-primary flex-1">
              {schedule.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />} Confirm
            </button>
            <button onClick={() => setShowSchedule(false)} className="btn-secondary px-4">Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
