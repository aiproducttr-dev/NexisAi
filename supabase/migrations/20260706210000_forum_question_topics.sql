-- Allow multiple forum topics per campaign (main + AI questions)
ALTER TABLE public.forum_topics DROP CONSTRAINT IF EXISTS forum_topics_campaign_id_key;

ALTER TABLE public.forum_topics
  ADD COLUMN IF NOT EXISTS topic_type text NOT NULL DEFAULT 'campaign'
    CHECK (topic_type IN ('campaign', 'question'));

ALTER TABLE public.forum_topics
  ADD COLUMN IF NOT EXISTS source_question text;

ALTER TABLE public.forum_topics
  ADD COLUMN IF NOT EXISTS display_author_name text;

CREATE INDEX IF NOT EXISTS idx_forum_topics_campaign ON public.forum_topics(campaign_id);
CREATE INDEX IF NOT EXISTS idx_forum_topics_type ON public.forum_topics(topic_type);
