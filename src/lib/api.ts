import axios from "axios";
import type {
  DraftContent, DraftContentList, GenerationJobResponse, JobResult,
  InstagramAccount, ScheduledPost, ScheduledPostList,
  OptimalTimeSuggestion, CalendarMonth, HealthCheck,
  ContentType, ToneType, PublishStatus,
} from "@/types";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: `${BASE}/api/v1`,
  headers: { "Content-Type": "application/json" },
  timeout: 30_000,
});

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
