-- Free trial abuse locks (email OR business name)
CREATE TABLE IF NOT EXISTS public.free_trial_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_normalized text NOT NULL,
  business_name_normalized text NOT NULL,
  business_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS free_trial_claims_email_uidx
  ON public.free_trial_claims (email_normalized);

CREATE UNIQUE INDEX IF NOT EXISTS free_trial_claims_business_uidx
  ON public.free_trial_claims (business_name_normalized);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS used_free_trial boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS trial_business_name text;

ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS is_free_trial boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS campaigns_is_free_trial_idx
  ON public.campaigns (user_id, is_free_trial);

ALTER TABLE public.free_trial_claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own free trial claims" ON public.free_trial_claims;
CREATE POLICY "Users read own free trial claims"
  ON public.free_trial_claims
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

GRANT SELECT ON public.free_trial_claims TO authenticated;
GRANT ALL ON public.free_trial_claims TO service_role;
