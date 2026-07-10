-- Kayıt kaynağı: nexisai.com vs nexisaiform.com
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS registration_source text
  CHECK (registration_source IN ('nexisai', 'nexisaiform'));

CREATE INDEX IF NOT EXISTS profiles_registration_source_idx
  ON public.profiles (registration_source);

-- Mevcut kayıtları tahmini geri doldur
UPDATE public.profiles p
SET registration_source = 'nexisaiform'
WHERE p.registration_source IS NULL
  AND EXISTS (
    SELECT 1
    FROM public.forum_topics ft
    WHERE ft.author_id = p.id
      AND ft.topic_type = 'question'
  );

UPDATE public.profiles p
SET registration_source = 'nexisai'
WHERE p.registration_source IS NULL
  AND (
    EXISTS (SELECT 1 FROM public.campaigns c WHERE c.user_id = p.id)
    OR EXISTS (SELECT 1 FROM public.campaign_checkouts cc WHERE cc.user_id = p.id)
  );

DROP VIEW IF EXISTS public.nexisai_kayitlar;
DROP VIEW IF EXISTS public.nexisai_site_users;

CREATE OR REPLACE VIEW public.nexisai_com_kayitlar AS
SELECT
  p.id AS user_id,
  p.full_name,
  p.email,
  p.created_at AS kayit_tarihi,
  p.registration_source,
  (SELECT COUNT(*)::int FROM public.campaigns c WHERE c.user_id = p.id) AS kampanya_sayisi,
  (SELECT COUNT(*)::int FROM public.campaign_checkouts cc WHERE cc.user_id = p.id) AS odeme_sayisi
FROM public.profiles p
WHERE p.registration_source = 'nexisai'
  AND p.email IS NOT NULL
  AND btrim(p.email) <> '';

CREATE OR REPLACE VIEW public.nexisaiform_com_kayitlar AS
SELECT
  p.id AS user_id,
  p.full_name,
  p.email,
  p.created_at AS kayit_tarihi,
  p.registration_source,
  (SELECT COUNT(*)::int FROM public.forum_topics ft WHERE ft.author_id = p.id) AS forum_konusu_sayisi
FROM public.profiles p
WHERE p.registration_source = 'nexisaiform'
  AND p.email IS NOT NULL
  AND btrim(p.email) <> '';

CREATE OR REPLACE VIEW public.nexisai_site_users AS
SELECT *
FROM public.nexisai_com_kayitlar
WHERE kampanya_sayisi > 0 OR odeme_sayisi > 0;

GRANT SELECT ON public.nexisai_com_kayitlar TO authenticated, service_role;
GRANT SELECT ON public.nexisaiform_com_kayitlar TO authenticated, service_role;
GRANT SELECT ON public.nexisai_site_users TO authenticated, service_role;
