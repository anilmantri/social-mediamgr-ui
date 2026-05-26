import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import { Navigate } from "react-router-dom";
import { cn, fmt } from "@/lib/utils";
import {
  Users, DollarSign, TrendingUp, Activity, Search,
  CheckCircle, XCircle, Zap, Shield, RefreshCw,
  ChevronLeft, ChevronRight, AlertCircle, Server,
} from "lucide-react";
import toast from "react-hot-toast";
import { PageSpinner } from "@/components/shared";

// ── Stat card ─────────────────────────────────────────────────────────────────
function AdminStat({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div className="card p-5 flex items-start gap-4">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", color)}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── User row ──────────────────────────────────────────────────────────────────
function UserRow({ user, onOverridePlan, onToggle, onGrantCredits }: {
  user: any;
  onOverridePlan: (id: string, currentPlan: string) => void;
  onToggle: (id: string, active: boolean) => void;
  onGrantCredits: (wsId: string, name: string) => void;
}) {
  const planColor: Record<string, string> = {
    free:    "bg-gray-100 text-gray-600",
    starter: "bg-blue-50 text-blue-700",
    pro:     "bg-violet-50 text-violet-700",
    agency:  "bg-pink-50 text-pink-700",
  };

  return (
    <tr className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
      <td className="px-4 py-3">
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</p>
          <p className="text-xs text-gray-400">{user.email}</p>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", planColor[user.plan_tier] || "bg-gray-100 text-gray-600")}>
          {user.plan}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium",
          user.subscription_status === "active" ? "bg-emerald-50 text-emerald-700" :
          user.subscription_status === "freemium" ? "bg-gray-100 text-gray-600" :
          "bg-amber-50 text-amber-700")}>
          {user.subscription_status}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        <span className={cn("font-medium", user.credits_balance < 2 ? "text-rose-600" : "text-gray-900")}>
          {user.credits_balance}
        </span>
        <span className="text-gray-400"> / {user.credits_used} used</span>
      </td>
      <td className="px-4 py-3 text-xs text-gray-400">
        {user.last_login_at ? fmt.relative(user.last_login_at) : "Never"}
      </td>
      <td className="px-4 py-3 text-xs text-gray-400">
        {user.created_at ? fmt.date(user.created_at) : "—"}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onOverridePlan(user.id, user.plan_tier)}
            className="btn-ghost text-xs py-1 px-2"
            title="Override plan"
          >
            <Shield className="w-3 h-3" />
          </button>
          <button
            onClick={() => onToggle(user.id, !user.is_active)}
            className={cn("btn-ghost text-xs py-1 px-2", !user.is_active && "text-emerald-600")}
            title={user.is_active ? "Disable user" : "Enable user"}
          >
            {user.is_active ? <XCircle className="w-3 h-3 text-rose-500" /> : <CheckCircle className="w-3 h-3 text-emerald-500" />}
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export function AdminPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [search, setSearch]   = useState("");
  const [page, setPage]       = useState(1);
  const [activeTab, setActiveTab] = useState<"overview" | "users">("overview");

  // Redirect non-admins
  if (!user?.is_admin) return <Navigate to="/" replace />;

  const { data: overview, isLoading } = useQuery({
    queryKey: ["admin-overview"],
    queryFn:  () => adminApi.getOverview().then(r => r.data),
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["admin-users", page, search],
    queryFn:  () => adminApi.listUsers({ page, search: search || undefined }).then(r => r.data),
    enabled:  activeTab === "users",
    staleTime: 30_000,
  });

  const toggleUser = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      adminApi.toggleUser(id, active),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); toast.success("User updated"); },
    onError: () => toast.error("Failed to update user"),
  });

  const overridePlan = useMutation({
    mutationFn: ({ id, plan }: { id: string; plan: string }) =>
      adminApi.overridePlan(id, plan),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); toast.success("Plan overridden"); },
    onError: () => toast.error("Failed to override plan"),
  });

  const handleOverridePlan = (id: string, currentPlan: string) => {
    const plans = ["free", "starter", "pro", "agency"];
    const next = plans[(plans.indexOf(currentPlan) + 1) % plans.length];
    if (confirm(`Change plan to ${next}?`)) {
      overridePlan.mutate({ id, plan: next });
    }
  };

  const handleGrantCredits = (wsId: string, name: string) => {
    const amount = parseInt(prompt(`Grant credits to ${name}:\nAmount:`) || "0");
    const reason = prompt("Reason:") || "Admin grant";
    if (amount > 0) {
      adminApi.grantCredits(wsId, amount, reason)
        .then(() => toast.success(`${amount} credits granted`))
        .catch(() => toast.error("Failed to grant credits"));
    }
  };

  const r = overview?.revenue;
  const h = overview?.health;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Shield className="w-6 h-6 text-violet-500" /> Admin Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Internal — visible to admins only</p>
        </div>
        <button onClick={() => qc.invalidateQueries({ queryKey: ["admin-overview"] })} className="btn-ghost p-2">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200 dark:border-gray-800">
        {(["overview", "users"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={cn("px-4 py-2.5 text-sm font-medium border-b-2 -mb-px capitalize transition-colors",
              activeTab === tab ? "border-violet-500 text-violet-600" : "border-transparent text-gray-500 hover:text-gray-700")}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <>
          {isLoading ? <PageSpinner /> : (
            <>
              {/* Revenue metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <AdminStat label="MRR" value={`$${r?.mrr_usd ?? 0}`} sub="monthly recurring" icon={DollarSign} color="bg-emerald-50 text-emerald-600" />
                <AdminStat label="ARR" value={`$${r?.arr_usd ?? 0}`} sub="annualised" icon={TrendingUp} color="bg-blue-50 text-blue-600" />
                <AdminStat label="Total users" value={r?.total_users ?? 0} sub={`${r?.paid_users ?? 0} paid`} icon={Users} color="bg-violet-50 text-violet-600" />
                <AdminStat label="Conversion" value={`${r?.conversion_rate_pct ?? 0}%`} sub="free → paid" icon={TrendingUp} color="bg-pink-50 text-pink-600" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <AdminStat label="New users (30d)" value={r?.new_users_30d ?? 0} icon={Users} color="bg-gray-50 text-gray-600" />
                <AdminStat label="Posts published (30d)" value={r?.published_30d ?? 0} icon={Activity} color="bg-gray-50 text-gray-600" />
                <AdminStat label="Failed posts (24h)" value={h?.failed_posts_24h ?? 0}
                  icon={AlertCircle} color={h?.failed_posts_24h > 0 ? "bg-rose-50 text-rose-600" : "bg-gray-50 text-gray-500"} />
                <AdminStat label="Pending scheduled" value={h?.pending_scheduled_posts ?? 0}
                  icon={Activity} color="bg-gray-50 text-gray-600" />
              </div>

              {/* Plan breakdown */}
              {r?.by_plan && (
                <div className="card p-5">
                  <h2 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-4">Users by plan</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {Object.entries(r.by_plan).map(([plan, count]: [string, any]) => (
                      <div key={plan} className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{count}</p>
                        <p className="text-xs text-gray-500 capitalize mt-0.5">{plan}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* System health */}
              <div className="card p-5">
                <h2 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                  <Server className="w-4 h-4 text-gray-500" /> System health
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Database", value: h?.db_status },
                    { label: "Redis", value: h?.redis_status },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <div className={cn("w-2 h-2 rounded-full flex-shrink-0",
                        item.value === "ok" ? "bg-emerald-500" : "bg-rose-500")} />
                      <div>
                        <p className="text-xs text-gray-500">{item.label}</p>
                        <p className={cn("text-xs font-semibold capitalize", item.value === "ok" ? "text-emerald-600" : "text-rose-600")}>
                          {item.value}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl col-span-2">
                    <p className="text-xs text-gray-500">Total content records</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-0.5">
                      {fmt.number(h?.total_content_records ?? 0)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Recent users */}
              {overview?.recent_users?.length > 0 && (
                <div className="card overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <h2 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Recent signups</h2>
                    <button onClick={() => setActiveTab("users")} className="text-xs text-violet-600 hover:text-violet-700">
                      View all →
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-800/50">
                        <tr>
                          {["User","Plan","Status","Credits","Last login","Joined","Actions"].map(h => (
                            <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {overview.recent_users.map((u: any) => (
                          <UserRow key={u.id} user={u}
                            onOverridePlan={handleOverridePlan}
                            onToggle={(id, active) => toggleUser.mutate({ id, active })}
                            onGrantCredits={handleGrantCredits}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {activeTab === "users" && (
        <div className="space-y-4">
          {/* Search */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className="input pl-9" placeholder="Search by name or email…"
                value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <span className="text-sm text-gray-500">{users?.total ?? 0} users</span>
          </div>

          {/* Table */}
          {usersLoading ? <PageSpinner /> : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      {["User","Plan","Status","Credits","Last login","Joined","Actions"].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users?.users.map((u: any) => (
                      <UserRow key={u.id} user={u}
                        onOverridePlan={handleOverridePlan}
                        onToggle={(id, active) => toggleUser.mutate({ id, active })}
                        onGrantCredits={handleGrantCredits}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {users && users.total > users.page_size && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-gray-800">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost text-sm flex items-center gap-1">
                    <ChevronLeft className="w-4 h-4" /> Prev
                  </button>
                  <span className="text-sm text-gray-500">Page {page}</span>
                  <button onClick={() => setPage(p => p + 1)} disabled={!users.has_next} className="btn-ghost text-sm flex items-center gap-1">
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
