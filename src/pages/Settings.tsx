import { useState } from "react";
import { Link } from "react-router-dom";
import { Save, Loader2, ExternalLink, CheckCircle, AlertCircle, Link2Off } from "lucide-react";
import { useAppStore } from "@/stores/app";
import { useInstagramAccount } from "@/hooks";
import { schedulerApi, contentApi } from "@/lib/api";
import { toneConfig, cn, fmt } from "@/lib/utils";
import toast from "react-hot-toast";
import type { ToneType } from "@/types";

function Section({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="card p-6 space-y-4">
      <div><h2 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
        <p className="text-sm text-gray-500 mt-0.5">{desc}</p></div>
      {children}
    </div>
  );
}

export function SettingsPage() {
  const { workspaceId, workspaceName, setWorkspace } = useAppStore();
  const { data: account, refetch } = useInstagramAccount(workspaceId);

  const [niche, setNiche]         = useState("Fitness & Wellness");
  const [tone, setTone]           = useState<ToneType>("professional");
  const [brandTags, setBrandTags] = useState("fitlife, wellness");
  const [nicheTags, setNicheTags] = useState("fitness, gym, health");
  const [blocklist, setBlocklist] = useState("");
  const [savingBrand, setSavingBrand]         = useState(false);
  const [connectingIG, setConnectingIG]       = useState(false);
  const [disconnectingIG, setDisconnectingIG] = useState(false);

  const handleSaveBrand = async () => {
    setSavingBrand(true);
    try {
      await contentApi.upsertBrandProfile(workspaceId, {
        niche, default_tone: tone,
        brand_hashtags: brandTags.split(",").map(t => t.trim()).filter(Boolean),
        niche_hashtags: nicheTags.split(",").map(t => t.trim()).filter(Boolean),
        topic_blocklist: blocklist.split(",").map(t => t.trim()).filter(Boolean),
      });
      toast.success("Brand profile saved!");
    } catch { toast.error("Failed to save"); }
    setSavingBrand(false);
  };

  const handleConnectIG = async () => {
    setConnectingIG(true);
    try {
      const r = await schedulerApi.getAuthUrl(workspaceId);
      window.open(r.data.auth_url, "_blank");
      toast("Complete Instagram auth in the new tab, then come back.", { icon: "🔗" });
    } catch { toast.error("Could not get auth URL"); }
    setConnectingIG(false);
  };

  const handleDisconnect = async () => {
    if (!confirm("Disconnect Instagram?")) return;
    setDisconnectingIG(true);
    try { await schedulerApi.disconnectAccount(workspaceId); await refetch(); toast.success("Disconnected"); }
    catch { toast.error("Failed to disconnect"); }
    setDisconnectingIG(false);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div><h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Configure your workspace and connections</p></div>

      {/* Instagram */}
      <Section title="Instagram Account" desc="Connect your Instagram Business account to publish posts">
        {account ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-violet-50 to-pink-50 rounded-xl border border-pink-100">
              <div className="w-12 h-12 rounded-full ig-gradient flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold">IG</span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">@{account.instagram_username}</p>
                <p className="text-sm text-gray-500">{fmt.number(account.followers_count)} followers · {fmt.number(account.media_count)} posts</p>
                {account.token_expires_at && <p className="text-xs text-gray-400 mt-0.5">Token expires {fmt.date(account.token_expires_at)}</p>}
              </div>
              <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            </div>
            <button onClick={handleDisconnect} disabled={disconnectingIG} className="btn-secondary text-sm">
              {disconnectingIG ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2Off className="w-4 h-4" />} Disconnect
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700">No Instagram account connected. Connect to enable scheduling and analytics.</p>
            </div>
            <button onClick={handleConnectIG} disabled={connectingIG} className="btn-primary">
              {connectingIG ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Connect Instagram <ExternalLink className="w-3.5 h-3.5" />
            </button>
            <p className="text-xs text-gray-400">Requires a Facebook Page linked to an Instagram Business account.</p>
          </div>
        )}
      </Section>

      {/* Brand voice */}
      <Section title="Brand Voice" desc="Define your brand identity to guide AI content generation">
        <div className="space-y-3">
          <div><label className="label">Niche / industry</label>
            <input className="input" value={niche} onChange={e => setNiche(e.target.value)} placeholder="e.g. Fitness & Wellness" /></div>

          <div><label className="label">Default tone</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(toneConfig).map(([k, v]) => (
                <button key={k} onClick={() => setTone(k as ToneType)}
                  className={cn("flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm text-left transition-colors",
                    tone === k ? "border-pink-400 bg-pink-50 text-pink-700" : "border-gray-200 text-gray-700 hover:border-gray-300")}>
                  <span className="text-lg">{v.emoji}</span>
                  <div><p className="font-medium text-xs">{v.label}</p><p className="text-xs opacity-60">{v.desc}</p></div>
                </button>
              ))}
            </div>
          </div>

          <div><label className="label">Brand hashtags (always included)</label>
            <input className="input" value={brandTags} onChange={e => setBrandTags(e.target.value)} placeholder="mybrand, official" /></div>
          <div><label className="label">Niche hashtags</label>
            <input className="input" value={nicheTags} onChange={e => setNicheTags(e.target.value)} placeholder="fitness, gym, health" /></div>
          <div><label className="label">Topic blocklist (AI will avoid these)</label>
            <input className="input" value={blocklist} onChange={e => setBlocklist(e.target.value)} placeholder="competitors, controversial…" /></div>

          <button onClick={handleSaveBrand} disabled={savingBrand} className="btn-primary">
            {savingBrand ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save brand profile
          </button>
        </div>
      </Section>

      {/* Workspace */}
      <Section title="Workspace" desc="Basic workspace configuration">
        <div className="space-y-3">
          <div><label className="label">Workspace name</label>
            <input className="input" defaultValue={workspaceName} onBlur={e => setWorkspace(workspaceId, e.target.value)} /></div>
          <div><label className="label">Workspace ID</label>
            <input className="input font-mono text-xs" value={workspaceId} readOnly /></div>
          <p className="text-xs text-gray-400">The workspace ID scopes all your content. Share it with team members.</p>
        </div>
      </Section>
    </div>
  );
}
