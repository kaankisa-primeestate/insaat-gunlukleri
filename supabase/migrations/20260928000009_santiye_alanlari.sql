-- Göç 9: şantiye tarifi (D3).
--
-- Şantiye = alanlar. Alan ya bina/blok ya da çevre alanıdır (otopark,
-- peyzaj, çevre duvarı…). Katlar bodrum/zemin/kat/çatı alanlarından
-- üretilir; hiçbiri yoksa alan tek parçadır (peyzaj gibi).
-- Kayıtlara (günlük, hatalı iş) seçilen yer yazı olarak düşer ("A Blok ·
-- 3. Kat"); şantiye sonradan değişse de eski kayıt bozulmaz. Bu yüzden
-- alan silinmez, gizlenir (aktif = false).
-- Tekrar çalıştırılırsa zarar vermez.

create table if not exists public.santiye_alanlari (
  id uuid primary key default gen_random_uuid(),
  firma_id uuid not null references public.firmalar(id) on delete cascade,
  santiye_id uuid not null references public.santiyeler(id) on delete cascade,
  tur text not null check (tur in ('blok', 'cevre')),
  ad text not null check (char_length(ad) between 1 and 40),
  bodrum smallint not null default 0 check (bodrum between 0 and 10),
  zemin boolean not null default false,
  kat smallint not null default 0 check (kat between 0 and 80),
  cati boolean not null default false,
  sira smallint not null default 0,
  aktif boolean not null default true,
  olusturma timestamptz not null default now()
);
create index if not exists santiye_alanlari_santiye_idx on public.santiye_alanlari (santiye_id, sira);

alter table public.santiye_alanlari enable row level security;

drop policy if exists okur on public.santiye_alanlari;
create policy okur on public.santiye_alanlari for select to authenticated
  using (firma_id = public.benim_firma() and santiye_id in (select public.erisilen_santiyeler()));

-- Şantiyeyi yalnız merkez tarif eder.
drop policy if exists merkez_yazar on public.santiye_alanlari;
create policy merkez_yazar on public.santiye_alanlari for all to authenticated
  using (firma_id = public.benim_firma() and public.benim_rol() = 'merkez')
  with check (
    firma_id = public.benim_firma()
    and public.benim_rol() = 'merkez'
    and exists (select 1 from public.santiyeler s where s.id = santiye_id and s.firma_id = public.benim_firma())
  );

grant select, insert, update, delete on public.santiye_alanlari to authenticated;
grant all on public.santiye_alanlari to service_role;

-- Hatalı işteki yer yazısı blok adıyla uzar ("Sosyal Tesis · 1. Bodrum").
alter table public.hatali_isler drop constraint if exists hatali_isler_kat_check;
alter table public.hatali_isler drop constraint if exists hatali_kat_siniri;
alter table public.hatali_isler add constraint hatali_kat_siniri check (char_length(kat) <= 80);

notify pgrst, 'reload schema';
