import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAppStore } from "@/stores/app";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  CheckCircle, Circle, User, Instagram, Sparkles,
  Zap, Check, Calendar, Rocket, X, ChevronRight,
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  user:      User,
  instagram: Instagram,
  sparkles:  Sparkles,
  zap:       Zap,
  check:     Check,
  calendar:  Calendar,
  rocket:    Rocket,
};

interface OnboardingStatus {
  is_complete: boolean;
  progress_pct: number;
  completed_count: number;
  total_steps: number;
  steps: Array<{
    key: string;
    title: string;
    description: string;
    completed: boolean;
    action_url: string;
    action_label: string;
    icon: string;
  }>;
  next_step: {
    key: string;
    title: string;
    action_url: string;
    action_label: string;
  } | null;
  show_checklist: boolean;
}

// ── Full checklist panel (shown on Dashboard) ─────────────────────────────────
export function OnboardingChecklist({ onDismiss }: { onDismiss?: () => void }) {
  const { workspaceId } = useAppStore();

  const { data, isLoading } = useQuery<OnboardingStatus>({
    queryKey: ["onboarding", workspaceId],
    queryFn:  () => api.get(`/api/v1/onboarding/${workspaceId}/status`).then(r => r.data),
    enabled:  !!workspaceId,
    staleTime: 30_000,
  });

  if (isLoading || !data || data.is_complete) return null;

  return (
    <div className="card border-violet-200 dark:border-violet-800/40 bg-gradient-to-br from-violet-50/50 to-pink-50/30 dark:from-violet-950/20 dark:to-pink-950/10 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Rocket className="w-4 h-4 text-violet-500" />
            Get started
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {data.completed_count} of {data.total_steps} steps complete
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-violet-600">{data.progress_pct}%</span>
          {onDismiss && (
            <button onClick={onDismiss} className="btn-ghost p-1 text-gray-400">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-white/60 dark:bg-gray-800/60 rounded-full overflow-hidden mb-4">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-pink-500 transition-all duration-500"
          style={{ width: `${data.progress_pct}%` }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {data.steps.map((step, i) => {
          const Icon = ICON_MAP[step.icon] || Zap;
          return (
            <Link
              key={step.key}
              to={step.action_url}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl transition-all",
                step.completed
                  ? "opacity-60"
                  : "hover:bg-white/60 dark:hover:bg-gray-800/40 cursor-pointer"
              )}
            >
              {/* Step icon */}
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                step.completed
                  ? "bg-emerald-100 dark:bg-emerald-900/30"
                  : i === data.completed_count
                  ? "bg-violet-100 dark:bg-violet-900/30"
                  : "bg-gray-100 dark:bg-gray-800"
              )}>
                {step.completed
                  ? <CheckCircle className="w-4 h-4 text-emerald-600" />
                  : <Icon className={cn("w-4 h-4",
                      i === data.completed_count ? "text-violet-600" : "text-gray-400"
                    )} />
                }
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm font-medium",
                  step.completed ? "line-through text-gray-400" : "text-gray-900 dark:text-gray-100"
                )}>
                  {step.title}
                </p>
                {!step.completed && (
                  <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
                )}
              </div>

              {/* Action */}
              {!step.completed && i === data.completed_count && (
                <span className="btn-primary text-xs py-1.5 px-3 flex-shrink-0">
                  {step.action_label}
                </span>
              )}
              {!step.completed && i !== data.completed_count && (
                <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ── Mini progress bar (shown in sidebar or header) ─────────────────────────────
export function OnboardingProgressBar() {
  const { workspaceId } = useAppStore();

  const { data } = useQuery<OnboardingStatus>({
    queryKey: ["onboarding", workspaceId],
    queryFn:  () => api.get(`/api/v1/onboarding/${workspaceId}/status`).then(r => r.data),
    enabled:  !!workspaceId,
    staleTime: 60_000,
  });

  if (!data || data.is_complete) return null;

  return (
    <Link to="/" className="block px-3 py-2 mx-2 mb-2 bg-violet-50 dark:bg-violet-900/20 rounded-xl">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-violet-700 dark:text-violet-400">Setup</span>
        <span className="text-xs font-bold text-violet-700 dark:text-violet-400">{data.progress_pct}%</span>
      </div>
      <div className="w-full h-1.5 bg-violet-200 dark:bg-violet-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-violet-600 transition-all duration-500"
          style={{ width: `${data.progress_pct}%` }}
        />
      </div>
      {data.next_step && (
        <p className="text-xs text-violet-500 mt-1 truncate">Next: {data.next_step.title}</p>
      )}
    </Link>
  );
}
