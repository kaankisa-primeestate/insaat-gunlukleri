-- D5 "Dünden devam": otomatik kayıt yapılmaz; öneri + tek dokunuş onay.
-- Ayrıntı ve kararlar: docs/DUZELTILECEKLER.md (D5), docs/KARARLAR.md.
--
-- - gunlukler.devam: "Aynen devam" ile, dünkü bilgiler kopyalanarak
--   oluşturulan kayıt (listede "Devam" etiketiyle görünür). Kimin/ne zaman
--   onayladığı zaten olusturan/olusturma'da tutuluyor, yeni alan gerekmedi.
-- - gunlukler.gelmedi: o gün için "gelmedi" kaydı (kişi/kat/iş boş kalır).
--   "Gelmedi" kaydı tutulsun mu? kararı: EVET.
-- - gunluk_oneri_kapatildi: "Bu işi bitirdi" ile bir taşeron+şantiye için
--   öneri susturulur. Elle (gelmedi değil) yeni günlük girilince, o kayıt
--   susturmadan sonra olduğu için öneri kendiliğinden yeniden başlar —
--   ayrı bir "sıfırlama" adımı gerekmez (bkz. gunluk_onerileri).

alter table public.gunlukler add column if not exists devam boolean not null default false;
alter table public.gunlukler add column if not exists gelmedi boolean not null default false;

alter table public.gunlukler drop constraint if exists gunluk_devam_gelmedi_ayri;
alter table public.gunlukler add constraint gunluk_devam_gelmedi_ayri
  check (not (devam and gelmedi));

create table if not exists public.gunluk_oneri_kapatildi (
  id uuid primary key default gen_random_uuid(),
  firma_id uuid not null references public.firmalar(id) on delete cascade,
  santiye_id uuid not null references public.santiyeler(id) on delete cascade,
  taseron_id uuid not null references public.taseronlar(id) on delete cascade,
  kapatan uuid not null default auth.uid() references public.profiller(id),
  kapatma timestamptz not null default now(),
  unique (santiye_id, taseron_id)
);

alter table public.gunluk_oneri_kapatildi enable row level security;

create policy okur on public.gunluk_oneri_kapatildi for select to authenticated
  using (public.kayit_okunur(firma_id, santiye_id, taseron_id, 'gunluk'));
create policy yazar on public.gunluk_oneri_kapatildi for all to authenticated
  using (public.kayit_yazilir(firma_id, santiye_id, taseron_id, 'gunluk'))
  with check (public.kayit_yazilir(firma_id, santiye_id, taseron_id, 'gunluk'));

-- Ana sayfadaki öneri kartları için: her taşeronun son 7 gündeki (bugün
-- hariç) son GERÇEK kaydı — "gelmedi" kaydı öneriye kaynak olmaz (kopyalanacak
-- bir şey yok; o taşeron için öneri o noktada sessizce durur, elle yeni
-- günlük girilince devam eder). Bugün zaten kaydı olan ya da kapatılmış
-- (susturulmuş) taşeron listelenmez; kapatma, kaynak kayıttan SONRAYSA geçerli
-- sayılır, öncesindeyse (yani kapatmadan sonra elle yeni kayıt girilmişse)
-- öneri kendiliğinden döner.
create function public.gunluk_onerileri(p_santiye uuid)
returns table (
  taseron_id uuid,
  firma_adi text,
  kaynak_id uuid,
  kaynak_tarih date,
  kisi_sayisi smallint,
  katlar text[],
  is_kalemleri text[],
  notu text
)
language sql stable security definer set search_path = ''
as $$
  select distinct on (g.taseron_id)
    g.taseron_id, t.firma_adi, g.id, g.is_tarihi, g.kisi_sayisi, g.katlar, g.is_kalemleri, g.notu
  from public.gunlukler g
  join public.taseronlar t on t.id = g.taseron_id
  where public.yetkili('gunluk', true)
    and p_santiye in (select public.erisilen_santiyeler())
    and g.santiye_id = p_santiye
    and t.id in (select public.gorunur_taseronlar())
    and t.aktif
    and not g.gelmedi
    and g.is_tarihi >= ((now() at time zone 'Europe/Istanbul')::date - 7)
    and g.is_tarihi < (now() at time zone 'Europe/Istanbul')::date
    and not exists (
      select 1 from public.gunlukler g2
      where g2.santiye_id = p_santiye and g2.taseron_id = g.taseron_id
        and g2.is_tarihi = (now() at time zone 'Europe/Istanbul')::date
    )
    and not exists (
      select 1 from public.gunluk_oneri_kapatildi k
      where k.santiye_id = p_santiye and k.taseron_id = g.taseron_id and k.kapatma > g.olusturma
    )
  order by g.taseron_id, g.is_tarihi desc, g.olusturma desc
$$;

revoke execute on function public.gunluk_onerileri(uuid) from anon, public;
grant execute on function public.gunluk_onerileri(uuid) to authenticated, service_role;

notify pgrst, 'reload schema';
