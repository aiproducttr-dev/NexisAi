-- NexisAI mail hızlı kayıtları (son kayıtlar)
CREATE TABLE IF NOT EXISTS public.nexisai_son_kayitlar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text NOT NULL,
  business_name text,
  registration_source text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS nexisai_son_kayitlar_created_at_idx
  ON public.nexisai_son_kayitlar (created_at DESC);

CREATE INDEX IF NOT EXISTS nexisai_son_kayitlar_email_idx
  ON public.nexisai_son_kayitlar (email);

COMMENT ON TABLE public.nexisai_son_kayitlar IS 'NexisAI mail hızlı kayıtları (son kayıtlar)';

ALTER TABLE public.nexisai_son_kayitlar ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON public.nexisai_son_kayitlar TO service_role;
GRANT SELECT ON public.nexisai_son_kayitlar TO authenticated;
