-- Allow forum members to create organic questions (no campaign link)
ALTER TABLE public.forum_topics
  ALTER COLUMN campaign_id DROP NOT NULL;

ALTER TABLE public.forum_topics
  ALTER COLUMN business_name SET DEFAULT '';

CREATE POLICY forum_topics_auth_insert ON public.forum_topics
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = author_id
    AND topic_type = 'question'
    AND campaign_id IS NULL
  );
