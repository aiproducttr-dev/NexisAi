export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
  registration_source?: "nexisai" | "nexisaiform" | null;
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
  wordpress_post_id: number | null;
  wordpress_url: string | null;
  devto_article_id: number | null;
  devto_url: string | null;
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

export interface ForumTopic {
  id: string;
  campaign_id: string | null;
  slug: string;
  title: string;
  body: string;
  category: string;
  city: string;
  business_name: string;
  content_slug: string | null;
  author_id: string;
  topic_type: "campaign" | "question";
  source_question: string | null;
  display_author_name: string | null;
  reply_count: number;
  created_at: string;
  updated_at: string;
  last_reply_at: string;
}

export interface ForumReply {
  id: string;
  topic_id: string;
  author_id: string | null;
  author_name: string;
  body: string;
  created_at: string;
}
