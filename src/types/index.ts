export type ContentStatus = "draft"|"pending"|"approved"|"rejected"|"scheduled"|"published"|"failed";
export type ContentType   = "feed_image"|"feed_carousel"|"story"|"reel";
export type ToneType      = "witty"|"professional"|"inspiring"|"casual"|"educational"|"promotional";
export type JobStatus     = "queued"|"running"|"success"|"failed"|"retrying";
export type PublishStatus = "scheduled"|"publishing"|"published"|"failed"|"cancelled"|"unscheduled";
export type ApprovalActionType = "submitted"|"approved"|"rejected"|"commented"|"revision_requested"|"edited"|"regenerated";

export interface ContentVersion {
  id: string; version_number: number; caption: string; hashtags: string[];
  image_url: string|null; image_prompt: string|null; image_alt_text: string|null;
  cta: string|null; tone: ToneType|null; ai_model_used: string|null;
  is_ai_generated: boolean; change_summary: string|null;
  created_at: string; updated_at: string;
}
export interface ApprovalAction {
  id: string; actor_id: string; action: ApprovalActionType;
  comment: string|null; version_id: string|null;
  action_metadata: Record<string,unknown>;
  created_at: string; updated_at: string;
}
export interface DraftContent {
  id: string; workspace_id: string; created_by_id: string;
  content_type: ContentType; status: ContentStatus;
  version_count: number; scheduled_at: string|null; published_at: string|null;
  instagram_post_id: string|null; brand_voice_score: number|null;
  is_calendar_post: boolean; generation_prompt: string|null;
  current_version: ContentVersion|null; approval_actions: ApprovalAction[];
  created_at: string; updated_at: string;
}
export interface DraftContentList { items: DraftContent[]; total: number; page: number; page_size: number; has_next: boolean; }
export interface GenerationJobResponse { job_id: string; draft_content_id: string; status: JobStatus; estimated_seconds: number; poll_url: string; }
export interface JobResult {
  job_id: string; job_type: string; status: JobStatus;
  attempt_count: number; created_at: string; started_at: string|null;
  completed_at: string|null;
  result: { caption?: { text: string; hashtags: string[]; cta: string|null; brand_voice_score: number|null }; image?: { url: string; alt_text: string }|null; version_id?: string }|null;
  error_message: string|null; progress_pct: number|null;
}
export interface InstagramAccount {
  id: string; workspace_id: string; instagram_user_id: string;
  instagram_username: string; followers_count: number; media_count: number;
  profile_picture_url: string|null; is_active: boolean;
  token_expires_at: string|null; last_refreshed_at: string|null;
  created_at: string; updated_at: string;
}
export interface ScheduledPost {
  id: string; workspace_id: string; draft_content_id: string;
  scheduled_at: string; publish_status: PublishStatus;
  is_ai_optimised_time: boolean; ai_time_confidence: number|null;
  ig_media_id: string|null; ig_permalink: string|null;
  published_at: string|null; attempt_count: number;
  caption_snapshot: string; hashtags_snapshot: string[];
  image_url_snapshot: string|null; created_at: string; updated_at: string;
}
export interface ScheduledPostList { items: ScheduledPost[]; total: number; page: number; page_size: number; has_next: boolean; }
export interface OptimalSlot { day_of_week: number; day_name: string; hour_of_day: number; avg_engagement_rate: number; avg_reach: number; confidence_score: number; rank: number; }
export interface OptimalTimeSuggestion { workspace_id: string; suggested_slots: OptimalSlot[]; based_on_posts: number; is_reliable: boolean; next_suggested_at: string|null; }
export interface CalendarDay { date: string; scheduled_posts: ScheduledPost[]; draft_count: number; is_optimal_day: boolean; }
export interface CalendarMonth { workspace_id: string; year: number; month: number; days: CalendarDay[]; total_scheduled: number; total_published: number; total_failed: number; }
export interface HealthCheck { status: string; version: string; db: string; }

// ── Auth & Billing ─────────────────────────────────────────────────────────────
export type PlanTier = "free"|"starter"|"pro"|"agency";
export type SubscriptionStatus = "trialing"|"active"|"past_due"|"cancelled"|"expired"|"freemium";
export type BillingInterval = "monthly"|"annual";

export interface User {
  id: string; email: string; name: string; avatar_url: string|null;
  email_verified: boolean; auth_provider: string; is_admin: boolean;
  timezone: string; created_at: string;
}

export interface TokenResponse {
  access_token: string; refresh_token: string;
  token_type: string; expires_in: number;
}

export interface Plan {
  id: string; tier: PlanTier; name: string; description: string|null;
  monthly_price_usd: number; annual_price_usd: number;
  monthly_credits: number; max_workspaces: number;
  max_team_members: number; max_instagram_accounts: number;
  can_schedule: boolean; can_use_analytics: boolean;
  can_bulk_generate: boolean; can_export: boolean;
}

export interface Subscription {
  id: string; status: SubscriptionStatus; billing_interval: BillingInterval;
  started_at: string|null; ends_at: string|null;
  trial_ends_at: string|null; cancelled_at: string|null;
  plan: Plan;
}

export interface UsageSummary {
  workspace_id: string; plan_tier: PlanTier; plan_name: string;
  credits_balance: number; credits_used: number; credits_allocated: number;
  credits_pct_used: number; subscription_status: SubscriptionStatus;
  subscription_ends_at: string|null;
  can_generate: boolean; can_schedule: boolean; can_use_analytics: boolean;
}

export interface CreditTransaction {
  id: string; action_type: string; credits_delta: number;
  balance_after: number; description: string|null; created_at: string;
}
