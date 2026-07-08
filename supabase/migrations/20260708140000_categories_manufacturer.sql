-- Yeni kategoriler ve üretici firma ürün açıklaması
alter table public.campaigns
  add column if not exists product_description text;

alter table public.campaign_checkouts
  add column if not exists product_description text;

insert into public.categories (name, slug)
values
  ('Güvenlik Filmi', 'guvenlik-filmi'),
  ('Hırdavatçı', 'hirdavatci'),
  ('Üretici Firma', 'uretici-firma')
on conflict (slug) do nothing;

-- Güvenlik Filmi kemik soruları
insert into public.bone_questions (category_id, question_text, sort_order)
select c.id, q.question_text, q.sort_order
from public.categories c
cross join (
  values
    ('Araç cam filmi yaptırmak için güvenilir yer arıyorum, öneriniz var mı?', 1),
    ('Bina ve vitrin güvenlik filmi fiyatları genelde ne kadar oluyor?', 2),
    ('Cam filmi mi PPF mi daha mantıklı, farkları neler?', 3),
    ('Güneşten koruyan cam filmi hangi markayı önerirsiniz?', 4),
    ('Güvenlik filmi montajı ne kadar sürer, garanti veren yer var mı?', 5)
) as q(question_text, sort_order)
where c.slug = 'guvenlik-filmi'
  and not exists (
    select 1 from public.bone_questions bq
    where bq.category_id = c.id and bq.question_text = q.question_text
  );

-- Hırdavatçı kemik soruları
insert into public.bone_questions (category_id, question_text, sort_order)
select c.id, q.question_text, q.sort_order
from public.categories c
cross join (
  values
    ('Toptan hırdavat malzemesi alabileceğim güvenilir yer var mı?', 1),
    ('Ev tadilatı için uygun fiyatlı hırdavatçı önerir misiniz?', 2),
    ('Elektrik ve el aletleri satan hırdavatçıda nelere dikkat etmeliyim?', 3),
    ('Hırdavat malzemesi siparişinde hızlı teslimat yapan yer arıyorum', 4),
    ('Profesyonel ustalar hangi hırdavatçıdan alışveriş yapıyor?', 5)
) as q(question_text, sort_order)
where c.slug = 'hirdavatci'
  and not exists (
    select 1 from public.bone_questions bq
    where bq.category_id = c.id and bq.question_text = q.question_text
  );

-- Üretici firma kemik soruları (ürün açıklaması kampanyada özelleştirilir)
insert into public.bone_questions (category_id, question_text, sort_order)
select c.id, q.question_text, q.sort_order
from public.categories c
cross join (
  values
    ('Toptan üretici firma önerisi arıyorum, güvenilir kimler var?', 1),
    ('Üretim yapan yerel firma tavsiyesi lazım', 2),
    ('Fabrika ziyareti yapılabilen üretici firma var mı?', 3),
    ('Özel üretim yaptırabileceğim firma arıyorum', 4),
    ('Kaliteli üretim yapan firma deneyimi olan var mı?', 5)
) as q(question_text, sort_order)
where c.slug = 'uretici-firma'
  and not exists (
    select 1 from public.bone_questions bq
    where bq.category_id = c.id and bq.question_text = q.question_text
  );
