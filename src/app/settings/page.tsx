"use client";
import { useState } from "react";
import { useAppStore } from "@/stores/app";
import { useInstagramAccount } from "@/hooks";
import { schedulerApi, contentApi } from "@/lib/api";
import { fmt, toneConfig, cn } from "@/lib/utils";
import toast from "react-hot-toast";
import {
  Instagram, Link2, Link2Off, Zap, Hash, Palette,
  Save, ExternalLink, CheckCircle, AlertCircle, Loader2, User
} from "lucide-react";
import type { ToneType } from "@/types";

function Section({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="card p-6 space-y-4">
      <div>
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{desc}</p>
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const { workspaceId, workspaceName, setWorkspace } = useAppStore();
  const { data: account, refetch: refetchAccount }   = useInstagramAccount(workspaceId);

  // Brand profile state
  const [niche, setNiche]                     = useState("Fitness & Wellness");
  const [tone, setTone]                       = useState<ToneType>("professional");
  const [brandTags, setBrandTags]             = useState("fitlife, wellness");
  const [nicheTags, setNicheTags]             = useState("fitness, gym, health");
  const [blocklist, setBlocklist]             = useState("");
  const [savingBrand, setSavingBrand]         = useState(false);
  const [connectingIG, setConnectingIG]       = useState(false);
  const [disconnectingIG, setDisconnectingIG] = useState(false);

  const handleSaveBrand = async () => {
    setSavingBrand(true);
    try {
      await contentApi.upsertBrandProfile(workspaceId, {
        niche,
        default_tone: tone,
        brand_hashtags: brandTags.split(",").map(t => t.trim()).filter(Boolean),
        niche_hashtags: nicheTags.split(",").map(t => t.trim()).filter(Boolean),
        topic_blocklist: blocklist.split(",").map(t => t.trim()).filter(Boolean),
      });
      toast.success("Brand profile saved!");
    } catch { toast.error("Failed to save brand profile"); }
    setSavingBrand(false);
  };

  const handleConnectIG = async () => {
    setConnectingIG(true);
    try {
      const r = await schedulerApi.getAuthUrl(workspaceId);
      window.open(r.data.auth_url, "_blank");
      toast("Complete the Instagram auth in the new tab, then come back.", { icon: "🔗" });
    } catch { toast.error("Could not get auth URL"); }
    setConnectingIG(false);
  };

  const handleDisconnectIG = async () => {
    if (!confirm("Disconnect Instagram? Scheduled posts will still be processed.")) return;
    setDisconnectingIG(true);
    try {
      await schedulerApi.disconnectAccount(workspaceId);
      await refetchAccount();
      toast.success("Instagram disconnected");
    } catch { toast.error("Failed to disconnect"); }
    setDisconnectingIG(false);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6 animate-in">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Configure your workspace and connections</p>
      </div>

      {/* Instagram connection */}
      <Section
        title="Instagram Account"
        desc="Connect your Instagram Business account to publish posts"
      >
        {account ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-violet-50 to-pink-50 dark:from-violet-950/30 dark:to-pink-950/30 rounded-xl border border-pink-100 dark:border-pink-900/30">
              <div className="w-12 h-12 rounded-full ig-gradient flex items-center justify-center flex-shrink-0">
                <Instagram className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-gray-100">@{account.instagram_username}</p>
                <p className="text-sm text-gray-500">
                  {fmt.number(account.followers_count)} followers · {fmt.number(account.media_count)} posts
                </p>
                {account.token_expires_at && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Token expires {fmt.date(account.token_expires_at)}
                  </p>
                )}
              </div>
              <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            </div>
            <button
              onClick={handleDisconnectIG}
              disabled={disconnectingIG}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              {disconnectingIG ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2Off className="w-4 h-4" />}
              Disconnect account
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800/40">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <p className="text-sm text-amber-700 dark:text-amber-400">
                No Instagram account connected. Connect to enable scheduling and analytics.
              </p>
            </div>
            <button
              onClick={handleConnectIG}
              disabled={connectingIG}
              className="btn-primary flex items-center gap-2"
            >
              {connectingIG ? <Loader2 className="w-4 h-4 animate-spin" /> : <Instagram className="w-4 h-4" />}
              Connect Instagram
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </button>
            <p className="text-xs text-gray-400">
              Requires a Facebook Page linked to an Instagram Business account.
            </p>
          </div>
        )}
      </Section>

      {/* Brand voice */}
      <Section
        title="Brand Voice"
        desc="Define your brand identity to guide AI content generation"
      >
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Niche / industry</label>
            <input className="input" value={niche} onChange={e => setNiche(e.target.value)} placeholder="e.g. Fitness & Wellness" />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Default tone</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(toneConfig).map(([k, v]) => (
                <button
                  key={k}
                  onClick={() => setTone(k as ToneType)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm text-left transition-colors",
                    tone === k
                      ? "border-pink-400 bg-pink-50 dark:bg-pink-950/20 text-pink-700 dark:text-pink-300"
                      : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300"
                  )}
                >
                  <span className="text-lg">{v.emoji}</span>
                  <div>
                    <p className="font-medium text-xs">{v.label}</p>
                    <p className="text-xs opacity-60">{v.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
              Brand hashtags <span className="text-gray-400 font-normal">(always included)</span>
            </label>
            <input className="input" value={brandTags} onChange={e => setBrandTags(e.target.value)}
              placeholder="mybrand, officialpage" />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
              Niche hashtags
            </label>
            <input className="input" value={nicheTags} onChange={e => setNicheTags(e.target.value)}
              placeholder="fitness, gym, health, motivation" />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
              Topic blocklist <span className="text-gray-400 font-normal">(AI will avoid these)</span>
            </label>
            <input className="input" value={blocklist} onChange={e => setBlocklist(e.target.value)}
              placeholder="competitors, controversial topics…" />
          </div>

          <button onClick={handleSaveBrand} disabled={savingBrand} className="btn-primary flex items-center gap-2">
            {savingBrand ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save brand profile
          </button>
        </div>
      </Section>

      {/* Workspace */}
      <Section title="Workspace" desc="Basic workspace configuration">
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Workspace name</label>
            <input
              className="input"
              defaultValue={workspaceName}
              onBlur={e => setWorkspace(workspaceId, e.target.value)}
              placeholder="My Brand"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Workspace ID</label>
            <input className="input font-mono text-xs" value={workspaceId} readOnly />
          </div>
          <p className="text-xs text-gray-400">
            The workspace ID is used to scope all your content and settings. Share it with team members.
          </p>
        </div>
      </Section>
    </div>
  );
}
