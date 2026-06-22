/// <reference types="vite/client" />
import axios from "axios";
import type {
  DraftContent, DraftContentList, GenerationJobResponse, JobResult,
  InstagramAccount, ScheduledPost, ScheduledPostList,
  OptimalTimeSuggestion, CalendarMonth, HealthCheck,
  ContentType, ToneType, PublishStatus,
  User, TokenResponse, Plan, Subscription, UsageSummary, CreditTransaction,
  PlanTier, BillingInterval,
} from "@/types";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: `${BASE}/api/v1`,
  headers: { "Content-Type": "application/json" },
  timeout: 30_000,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("smm-auth")
    ? JSON.parse(localStorage.getItem("smm-auth")!).state?.accessToken
    : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh token on 401
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const stored = localStorage.getItem("smm-auth");
        const refreshToken = stored ? JSON.parse(stored).state?.refreshToken : null;
        if (!refreshToken) throw new Error("No refresh token");
        const { data } = await axios.post(`${BASE}/api/v1/auth/refresh`, { refresh_token: refreshToken });
        // Update store
        const { useAuthStore } = await import("@/stores/auth");
        useAuthStore.getState().setTokens(data);
        original.headers.Authorization = `Bearer ${data.access_token}`;
        return api(original);
      } catch {
        const { useAuthStore } = await import("@/stores/auth");
        useAuthStore.getState().logout();
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

// ── Content ───────────────────────────────────────────────────────────────────
export const contentApi = {
  generate:       (d: { workspace_id: string; topic: string; content_type: ContentType; tone: ToneType; include_image: boolean; image_style?: string; extra_context?: string }) =>
                    api.post<GenerationJobResponse>("/content/generate", d),
  pollJob:        (jobId: string) => api.get<JobResult>(`/jobs/${jobId}`),
  list:           (p: { workspace_id: string; status?: string; page?: number; page_size?: number }) =>
                    api.get<DraftContentList>("/content", { params: p }),
  get:            (id: string) => api.get<DraftContent>(`/content/${id}`),
  submit:         (id: string, comment?: string) => api.post(`/content/${id}/submit`, { comment }),
  approve:        (id: string, comment?: string) => api.post(`/content/${id}/approve`, { comment }),
  reject:         (id: string, reason: string)  => api.post(`/content/${id}/reject`, { reason, request_revision: true }),
  edit:           (id: string, d: { caption?: string; hashtags?: string[]; cta?: string; change_summary: string }) =>
                    api.patch(`/content/${id}/edit`, d),
  regenerate:     (id: string, d: { regenerate_caption: boolean; regenerate_image: boolean; additional_instructions?: string }) =>
                    api.post<GenerationJobResponse>(`/content/${id}/regenerate`, d),
  comment:        (id: string, comment: string) => api.post(`/content/${id}/comment`, { comment }),
  planCalendar:   (d: { workspace_id: string; month: number; year: number; posts_per_week: number; theme_hints?: string[] }) =>
                    api.post("/content/calendar/plan", d),
  upsertBrandProfile: (wsId: string, d: Record<string, unknown>) => api.put(`/brand-profile/${wsId}`, d),
};

// ── Scheduler ─────────────────────────────────────────────────────────────────
export const schedulerApi = {
  getAuthUrl:       (wsId: string) => api.get<{ auth_url: string }>("/instagram/auth-url", { params: { workspace_id: wsId } }),
  getAccount:       (wsId: string) => api.get<InstagramAccount>(`/instagram/account/${wsId}`),
  disconnectAccount:(wsId: string) => api.delete(`/instagram/account/${wsId}`),
  schedule:         (d: { workspace_id: string; draft_content_id: string; scheduled_at: string; use_optimal_time: boolean }) =>
                      api.post<ScheduledPost>("/schedule", d),
  unschedule:       (id: string, wsId: string) => api.delete(`/schedule/${id}`, { params: { workspace_id: wsId } }),
  reschedule:       (id: string, wsId: string, new_scheduled_at: string) =>
                      api.patch<ScheduledPost>(`/schedule/${id}/reschedule`, { new_scheduled_at }, { params: { workspace_id: wsId } }),
  listScheduled:    (p: { workspace_id: string; publish_status?: PublishStatus; page?: number; page_size?: number }) =>
                      api.get<ScheduledPostList>("/schedule", { params: p }),
  getCalendarMonth: (wsId: string, year: number, month: number) =>
                      api.get<CalendarMonth>(`/calendar/${wsId}/${year}/${month}`),
  getOptimalTime:   (wsId: string) => api.get<OptimalTimeSuggestion>(`/optimal-time/${wsId}`),
  health:           () => axios.get<HealthCheck>(`${BASE}/health`),
};

// ── Auth API ──────────────────────────────────────────────────────────────────
export const authApi = {
  signup:          (d: { name: string; email: string; password: string }) =>
                     api.post<TokenResponse>("/auth/signup", d),
  login:           (d: { email: string; password: string }) =>
                     api.post<TokenResponse>("/auth/login", d),
  logout:          (refresh_token: string) =>
                     api.post("/auth/logout", { refresh_token }),
  refresh:         (refresh_token: string) =>
                     api.post<TokenResponse>("/auth/refresh", { refresh_token }),
  getGoogleUrl:    () =>
                     api.get<{ auth_url: string }>("/auth/google"),
  getMe:           () => api.get<User>("/auth/me"),
  updateMe:        (d: { name?: string; timezone?: string }) =>
                     api.patch<User>("/auth/me", d),
  verifyEmail:     (token: string) =>
                     api.post("/auth/verify-email", { token }),
  forgotPassword:  (email: string) =>
                     api.post("/auth/forgot-password", { email }),
  resetPassword:   (token: string, new_password: string) =>
                     api.post("/auth/reset-password", { token, new_password }),
};

// ── Billing API ───────────────────────────────────────────────────────────────
export const billingApi = {
  getPlans:        () => api.get<Plan[]>("/billing/plans"),
  getSubscription: () => api.get<Subscription>("/billing/subscription"),
  getUsage:        (wsId: string) => api.get<UsageSummary>(`/billing/usage/${wsId}`),
  getTransactions: (wsId: string) => api.get<CreditTransaction[]>(`/billing/transactions/${wsId}`),
  createCheckout:  (d: { plan_tier: PlanTier; billing_interval: BillingInterval; workspace_id: string }) =>
                     api.post<{ checkout_url: string; session_id: string }>("/billing/checkout", d),
  getPortalUrl:    () => api.get<{ portal_url: string }>("/billing/portal"),
};

// ── Dashboard API ─────────────────────────────────────────────────────────────
export const dashboardApi = {
  getOverview:   (wsId: string) => api.get(`/dashboard/${wsId}/overview`),
  getPipeline:   (wsId: string) => api.get(`/dashboard/${wsId}/pipeline`),
  getPublished:  (wsId: string) => api.get(`/dashboard/${wsId}/published`),
  getScheduled:  (wsId: string) => api.get(`/dashboard/${wsId}/scheduled`),
  getHealth:     (wsId: string) => api.get(`/dashboard/${wsId}/health`),
};

// ── Workspace API ─────────────────────────────────────────────────────────────
export const workspaceApi = {
  list:           () => api.get('/workspaces'),
  create:         (d: { name: string; slug: string }) => api.post('/workspaces', d),
  get:            (id: string) => api.get(`/workspaces/${id}`),
  update:         (id: string, d: { name?: string }) => api.patch(`/workspaces/${id}`, d),
  delete:         (id: string) => api.delete(`/workspaces/${id}`),
  getMembers:     (id: string) => api.get(`/workspaces/${id}/members`),
  inviteMember:   (id: string, d: { email: string; role: string }) => api.post(`/workspaces/${id}/members`, d),
  updateMember:   (id: string, uid: string, d: { role: string }) => api.patch(`/workspaces/${id}/members/${uid}`, d),
  removeMember:   (id: string, uid: string) => api.delete(`/workspaces/${id}/members/${uid}`),
  getUsage:       (id: string) => api.get(`/workspaces/${id}/usage`),
};

// ── Analyzer API ──────────────────────────────────────────────────────────────
export const analyzerApi = {
  getReport:       (wsId: string, days = 30) => api.get(`/analyzer/${wsId}/report?days=${days}`),
  getTopPosts:     (wsId: string, days = 30) => api.get(`/analyzer/${wsId}/top-posts?days=${days}`),
  getHashtags:     (wsId: string, days = 30) => api.get(`/analyzer/${wsId}/hashtags?days=${days}`),
  getHeatmap:      (wsId: string, days = 60) => api.get(`/analyzer/${wsId}/heatmap?days=${days}`),
  getContentTypes: (wsId: string, days = 30) => api.get(`/analyzer/${wsId}/content-types?days=${days}`),
  getSuggestions:  (wsId: string, days = 30) => api.get(`/analyzer/${wsId}/suggestions?days=${days}`),
};

// ── Admin API ─────────────────────────────────────────────────────────────────
export const adminApi = {
  getOverview:    () => api.get('/admin/metrics/overview'),
  getRevenue:     () => api.get('/admin/metrics/revenue'),
  getHealth:      () => api.get('/admin/metrics/health'),
  listUsers:      (p?: { page?: number; search?: string; plan_tier?: string }) =>
                    api.get('/admin/users', { params: p }),
  getUser:        (id: string) => api.get(`/admin/users/${id}`),
  overridePlan:   (id: string, plan_tier: string) =>
                    api.post(`/admin/users/${id}/plan`, { plan_tier }),
  toggleUser:     (id: string, active: boolean) =>
                    api.post(`/admin/users/${id}/toggle`, { active }),
  grantCredits:   (wsId: string, amount: number, reason: string) =>
                    api.post(`/admin/workspaces/${wsId}/credits`, { amount, reason }),
};
