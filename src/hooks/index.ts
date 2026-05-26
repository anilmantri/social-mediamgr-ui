import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { contentApi, schedulerApi } from "@/lib/api";
import type { ContentStatus, PublishStatus } from "@/types";

// ── Content ───────────────────────────────────────────────────────────────────
export const useDrafts = (wsId: string, status?: ContentStatus, page = 1) =>
  useQuery({
    queryKey: ["drafts", wsId, status, page],
    queryFn:  () => contentApi.list({ workspace_id: wsId, status, page, page_size: 20 }).then(r => r.data),
    enabled:  !!wsId,
    staleTime: 30_000,
  });

export const useDraft = (id: string) =>
  useQuery({
    queryKey: ["draft", id],
    queryFn:  () => contentApi.get(id).then(r => r.data),
    enabled:  !!id,
  });

export const useJob = (jobId: string | null) =>
  useQuery({
    queryKey: ["job", jobId],
    queryFn:  () => contentApi.pollJob(jobId!).then(r => r.data),
    enabled:  !!jobId,
    refetchInterval: (q) => {
      const s = q.state.data?.status;
      return (!s || s === "queued" || s === "running" || s === "retrying") ? 2000 : false;
    },
  });

export const useGenerateContent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: contentApi.generate,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["drafts"] }),
  });
};

export const useApprove = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) => contentApi.approve(id, comment),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ["drafts"] }); qc.invalidateQueries({ queryKey: ["draft"] }); },
  });
};

export const useReject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => contentApi.reject(id, reason),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ["drafts"] }); qc.invalidateQueries({ queryKey: ["draft"] }); },
  });
};

export const useEditContent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...d }: { id: string; caption?: string; hashtags?: string[]; cta?: string; change_summary: string }) =>
      contentApi.edit(id, d),
    onSuccess: (_,{ id }) => { qc.invalidateQueries({ queryKey: ["drafts"] }); qc.invalidateQueries({ queryKey: ["draft", id] }); },
  });
};

export const useRegenerate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...d }: { id: string; regenerate_caption: boolean; regenerate_image: boolean; additional_instructions?: string }) =>
      contentApi.regenerate(id, d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["drafts"] }),
  });
};

// ── Scheduler ─────────────────────────────────────────────────────────────────
export const useInstagramAccount = (wsId: string) =>
  useQuery({
    queryKey: ["ig-account", wsId],
    queryFn:  () => schedulerApi.getAccount(wsId).then(r => r.data),
    enabled:  !!wsId,
    retry:    false,
  });

export const useScheduledPosts = (wsId: string, status?: PublishStatus) =>
  useQuery({
    queryKey: ["scheduled", wsId, status],
    queryFn:  () => schedulerApi.listScheduled({ workspace_id: wsId, publish_status: status, page_size: 50 }).then(r => r.data),
    enabled:  !!wsId,
    staleTime: 30_000,
  });

export const useCalendarMonth = (wsId: string, year: number, month: number) =>
  useQuery({
    queryKey: ["calendar", wsId, year, month],
    queryFn:  () => schedulerApi.getCalendarMonth(wsId, year, month).then(r => r.data),
    enabled:  !!wsId,
    staleTime: 60_000,
  });

export const useOptimalTime = (wsId: string) =>
  useQuery({
    queryKey: ["optimal-time", wsId],
    queryFn:  () => schedulerApi.getOptimalTime(wsId).then(r => r.data),
    enabled:  !!wsId,
    staleTime: 3_600_000,
  });

export const useSchedulePost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: schedulerApi.schedule,
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ["scheduled"] }); qc.invalidateQueries({ queryKey: ["calendar"] }); qc.invalidateQueries({ queryKey: ["drafts"] }); },
  });
};

export const useUnschedule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, wsId }: { id: string; wsId: string }) => schedulerApi.unschedule(id, wsId),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ["scheduled"] }); qc.invalidateQueries({ queryKey: ["calendar"] }); },
  });
};

export const useHealth = () =>
  useQuery({
    queryKey: ["health"],
    queryFn:  () => schedulerApi.health().then(r => r.data),
    refetchInterval: 30_000,
    retry: false,
  });
