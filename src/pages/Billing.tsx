import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { billingApi } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import { useAppStore } from "@/stores/app";
import { cn } from "@/lib/utils";
import { CheckCircle, Zap, Loader2, ExternalLink, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import type { Plan, BillingInterval } from "@/types";

const PLAN_COLORS: Record<string, string> = {
  free:    "border-gray-200",
  starter: "border-blue-200",
  pro:     "border-violet-300 shadow-lg shadow-violet-100",
  agency:  "border-pink-200",
};
const PLAN_BADGES: Record<string, string | null> = {
  free: null, starter: null, pro: "Most popular", agency: null,
};

function PlanCard({
  plan, current, interval, onUpgrade, loading,
}: {
  plan: Plan; current: boolean; interval: BillingInterval;
  onUpgrade: (tier: string) => void; loading: boolean;
}) {
  const price = interval === "monthly" ? plan.monthly_price_usd : plan.annual_price_usd / 12;
  const badge = PLAN_BADGES[plan.tier];
  const isFree = plan.tier === "free";

  const features = [
    `${plan.monthly_credits >= 999999 ? "Unlimited" : plan.monthly_credits} AI credits/month`,
    `${plan.max_instagram_accounts} Instagram account${plan.max_instagram_accounts > 1 ? "s" : ""}`,
    `${plan.max_team_members >= 999 ? "Unlimited" : plan.max_team_members} team member${plan.max_team_members > 1 ? "s" : ""}`,
    plan.can_schedule ? "Post scheduling" : null,
    plan.can_use_analytics ? "Analytics dashboard" : null,
    plan.can_bulk_generate ? "30-day calendar generation" : null,
    plan.can_export ? "Export & reports" : null,
  ].filter(Boolean) as string[];

  return (
    <div className={cn(
      "card p-6 flex flex-col gap-4 relative border-2 transition-shadow hover:shadow-card-hover",
      PLAN_COLORS[plan.tier],
      plan.tier === "pro" && "scale-105",
    )}>
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-semibold bg-violet-600 text-white">
          {badge}
        </div>
      )}
      <div>
        <p className="font-semibold text-gray-900 text-lg">{plan.name}</p>
        <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
      </div>
      <div>
        <span className="text-3xl font-bold text-gray-900">
          {isFree ? "Free" : `$${price.toFixed(0)}`}
        </span>
        {!isFree && <span className="text-sm text-gray-500 ml-1">/month</span>}
        {!isFree && interval === "annual" && (
          <p className="text-xs text-emerald-600 font-medium mt-0.5">
            ${plan.annual_price_usd}/year · 2 months free
          </p>
        )}
      </div>
      <ul className="space-y-2 flex-1">
        {features.map(f => (
          <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
            <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            {f}
          </li>
        ))}
      </ul>
      {current ? (
        <div className="w-full py-2.5 rounded-xl text-center text-sm font-medium bg-gray-100 text-gray-500">
          Current plan
        </div>
      ) : isFree ? (
        <div className="w-full py-2.5 rounded-xl text-center text-sm font-medium bg-gray-50 text-gray-400 border border-gray-200">
          Free forever
        </div>
      ) : (
        <button
          onClick={() => onUpgrade(plan.tier)}
          disabled={loading}
          className={cn(
            "w-full py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95",
            plan.tier === "pro"
              ? "btn-primary"
              : "border-2 border-gray-200 text-gray-700 hover:border-violet-300 hover:bg-violet-50"
          )}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : `Upgrade to ${plan.name}`}
        </button>
      )}
    </div>
  );
}

export function BillingPage() {
  const { user, usage } = useAuthStore();
  const { workspaceId } = useAppStore();
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const [upgrading, setUpgrading] = useState<string | null>(null);

  const { data: plans } = useQuery({
    queryKey: ["plans"],
    queryFn:  () => billingApi.getPlans().then(r => r.data),
  });

  const { data: currentUsage, refetch: refetchUsage } = useQuery({
    queryKey: ["usage", workspaceId],
    queryFn:  () => billingApi.getUsage(workspaceId).then(r => r.data),
    enabled:  !!workspaceId,
  });

  const { data: transactions } = useQuery({
    queryKey: ["transactions", workspaceId],
    queryFn:  () => billingApi.getTransactions(workspaceId).then(r => r.data),
    enabled:  !!workspaceId,
  });

  const handleUpgrade = async (planTier: string) => {
    setUpgrading(planTier);
    try {
      const r = await billingApi.createCheckout({
        plan_tier: planTier as any,
        billing_interval: interval,
        workspace_id: workspaceId,
      });
      window.location.href = r.data.checkout_url;
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Could not create checkout session");
    }
    setUpgrading(null);
  };

  const handleManageBilling = async () => {
    try {
      const r = await billingApi.getPortalUrl();
      window.open(r.data.portal_url, "_blank");
    } catch { toast.error("Billing portal not available"); }
  };

  const u = currentUsage || usage;
  const creditPct = u ? Math.min(u.credits_pct_used, 100) : 0;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Plans & Billing</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your subscription and credits</p>
        </div>
        {u?.subscription_status === "active" && (
          <button onClick={handleManageBilling} className="btn-secondary text-sm flex items-center gap-2">
            <ExternalLink className="w-4 h-4" /> Manage billing
          </button>
        )}
      </div>

      {/* Credit usage widget */}
      {u && (
        <div className="card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-violet-500" />
              <span className="font-semibold text-gray-900">AI Credits</span>
              <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium",
                u.subscription_status === "freemium" ? "bg-gray-100 text-gray-600" : "bg-violet-100 text-violet-700")}>
                {u.plan_name}
              </span>
            </div>
            <span className="text-sm font-semibold text-gray-900">
              {u.credits_balance} <span className="text-gray-400 font-normal">/ {u.credits_allocated >= 999999 ? "∞" : u.credits_allocated} remaining</span>
            </span>
          </div>
          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", creditPct > 80 ? "bg-rose-500" : "bg-gradient-to-r from-violet-500 to-pink-500")}
              style={{ width: `${creditPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>{u.credits_used} used</span>
            {creditPct > 80 && (
              <span className="flex items-center gap-1 text-rose-500">
                <AlertCircle className="w-3 h-3" /> Running low — upgrade for more
              </span>
            )}
          </div>
          {!u.can_schedule && (
            <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
              Scheduling requires Starter plan or above.
            </p>
          )}
        </div>
      )}

      {/* Billing interval toggle */}
      <div className="flex items-center justify-center gap-1 bg-gray-100 rounded-xl p-1 w-fit mx-auto">
        {(["monthly", "annual"] as BillingInterval[]).map(i => (
          <button
            key={i}
            onClick={() => setInterval(i)}
            className={cn("px-5 py-2 rounded-lg text-sm font-medium transition-all",
              interval === i ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700")}
          >
            {i === "monthly" ? "Monthly" : "Annual"}{i === "annual" && <span className="ml-1.5 text-xs text-emerald-600 font-semibold">−17%</span>}
          </button>
        ))}
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        {plans?.map(plan => (
          <PlanCard
            key={plan.id}
            plan={plan}
            current={u?.plan_tier === plan.tier}
            interval={interval}
            onUpgrade={handleUpgrade}
            loading={upgrading === plan.tier}
          />
        ))}
      </div>

      {/* Transaction history */}
      {transactions && transactions.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-sm text-gray-900">Credit history</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {transactions.slice(0, 10).map(tx => (
              <div key={tx.id} className="flex items-center gap-3 px-5 py-3">
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0",
                  tx.credits_delta > 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>
                  {tx.credits_delta > 0 ? "+" : ""}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800">{tx.description || tx.action_type}</p>
                  <p className="text-xs text-gray-400">{new Date(tx.created_at).toLocaleString()}</p>
                </div>
                <span className={cn("text-sm font-semibold", tx.credits_delta > 0 ? "text-emerald-600" : "text-rose-600")}>
                  {tx.credits_delta > 0 ? "+" : ""}{tx.credits_delta}
                </span>
                <span className="text-xs text-gray-400">{tx.balance_after} left</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
