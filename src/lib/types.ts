export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface BoneQuestion {
  id: string;
  category_id: string;
  question_text: string;
  sort_order: number | null;
}

export interface Campaign {
  id: string;
  user_id: string;
  business_name: string;
  category: string;
  city: string;
  daily_budget: number;
  days: number;
  total_cost: number;
  visibility_increase: number;
  status: "draft" | "active" | "completed" | "cancelled";
  content_slug: string | null;
  created_at: string;
  started_at: string | null;
  ends_at: string | null;
}

export interface PublishedContent {
  id: string;
  campaign_id: string;
  title: string;
  content: string;
  slug: string;
  created_at: string;
}

export interface CampaignFormData {
  businessName: string;
  category: string;
  city: string;
  dailyBudget: number;
  days: number;
}

export interface VisibilityMetrics {
  totalCost: number;
  visibilityIncrease: number;
  estimatedReach: number;
  llmMentions: number;
  contentScore: number;
}
