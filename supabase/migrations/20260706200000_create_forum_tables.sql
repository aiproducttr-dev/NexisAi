-- Forum topics (auto-created from campaigns)
CREATE TABLE public.forum_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL UNIQUE REFERENCES public.campaigns(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  body text NOT NULL,
  category text NOT NULL,
  city text NOT NULL,
  business_name text NOT NULL,
  content_slug text,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reply_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_reply_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_forum_topics_category ON public.forum_topics(category);
CREATE INDEX idx_forum_topics_city ON public.forum_topics(city);
CREATE INDEX idx_forum_topics_last_reply ON public.forum_topics(last_reply_at DESC);

CREATE TABLE public.forum_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES public.forum_topics(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name text NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_forum_replies_topic ON public.forum_replies(topic_id, created_at);

CREATE OR REPLACE FUNCTION public.forum_update_reply_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.forum_topics
  SET
    reply_count = reply_count + 1,
    last_reply_at = NEW.created_at,
    updated_at = NOW()
  WHERE id = NEW.topic_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER forum_reply_insert_stats
AFTER INSERT ON public.forum_replies
FOR EACH ROW
EXECUTE FUNCTION public.forum_update_reply_stats();

ALTER TABLE public.forum_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY forum_topics_public_read ON public.forum_topics
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY forum_replies_public_read ON public.forum_replies
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY forum_replies_auth_insert ON public.forum_replies
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id);
