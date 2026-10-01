-- Göç 13: hatalı işte revizyon notları, zaman çizelgesi (1 Ekim).
--
-- Kullanıcı kararı: hatalı iş tespit edildikten sonraki gelişmeler (sorumluyla
-- konuşuldu, nasıl yapılacağı kararlaştırıldı, düzeltildi…) sırayla
-- "Rev. 1, Rev. 2" diye not düşülür; sayfada zaman çizelgesi olarak okunur.
-- - Not ekleyen: işin sorumlusu olan herkes, yani o hatalı işin durumunu
--   değiştirebilen herkes (şantiyenin şefi, merkez, işin taşeronu ve ana
--   taşeronu). Satın alma gibi yalnız gören roller eklemez.
-- - Revizyon silinmez. Yazan 24 saat içinde, merkez her zaman düzeltir;
--   düzeltilen not "düzenlendi" damgası taşır.
-- - Revizyonu olan hatalı işi yalnız merkez silebilir (geçmişi olan kayıt).
-- Tekrar çalıştırılırsa zarar vermez.

create table if not exists public.hatali_notlar (
  id uuid primary key default gen_random_uuid(),
  firma_id uuid not null references public.firmalar(id) on delete cascade,
  hatali_id uuid not null references public.hatali_isler(id) on delete cascade,
  sira integer not null,
  metin text not null check (char_length(metin) between 2 and 1000),
  fotograflar text[] not null default '{}' check (cardinality(fotograflar) <= 6),
  olusturan uuid not null default auth.uid() references public.profiller(id),
  olusturma timestamptz not null default now(),
  duzenleme timestamptz,
  duzenleyen uuid references public.profiller(id),
  unique (hatali_id, sira)
);
create index if not exists hatali_notlar_hatali_idx on public.hatali_notlar (hatali_id, sira);

alter table public.hatali_notlar enable row level security;

-- Eklenirken: firma, sıra numarası, yazan ve zaman sunucuda belirlenir.
create or replace function public.hatali_not_ekle()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  new.firma_id := public.benim_firma();
  new.olusturan := auth.uid();
  new.olusturma := now();
  new.duzenleme := null;
  new.duzenleyen := null;
  -- Aynı işe aynı anda iki not gelirse numara çakışmasın.
  perform pg_advisory_xact_lock(hashtext('hatali_not:' || new.hatali_id::text));
  select coalesce(max(sira), 0) + 1 into new.sira from public.hatali_notlar where hatali_id = new.hatali_id;
  return new;
end
$$;

drop trigger if exists hatali_not_ekle on public.hatali_notlar;
create trigger hatali_not_ekle before insert on public.hatali_notlar
  for each row execute function public.hatali_not_ekle();

-- Düzeltilirken yalnız metin ve fotoğraf değişir; "düzenlendi" damgası basılır.
create or replace function public.hatali_not_guncelle()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  new.firma_id := old.firma_id;
  new.hatali_id := old.hatali_id;
  new.sira := old.sira;
  new.olusturan := old.olusturan;
  new.olusturma := old.olusturma;
  if (new.metin, new.fotograflar) is distinct from (old.metin, old.fotograflar) then
    new.duzenleme := now();
    new.duzenleyen := auth.uid();
  else
    new.duzenleme := old.duzenleme;
    new.duzenleyen := old.duzenleyen;
  end if;
  return new;
end
$$;

drop trigger if exists hatali_not_guncelle on public.hatali_notlar;
create trigger hatali_not_guncelle before update on public.hatali_notlar
  for each row execute function public.hatali_not_guncelle();

-- Hatalı işi gören, notlarını da görür.
drop policy if exists okur on public.hatali_notlar;
create policy okur on public.hatali_notlar for select to authenticated
  using (exists (
    select 1 from public.hatali_isler h
    where h.id = hatali_id and public.hata_okunur(h.firma_id, h.santiye_id, h.taseron_id)
  ));

-- Durumu değiştirebilen (işin sorumlusu) not ekler.
drop policy if exists ekler on public.hatali_notlar;
create policy ekler on public.hatali_notlar for insert to authenticated
  with check (exists (
    select 1 from public.hatali_isler h
    where h.id = hatali_id
      and public.hata_okunur(h.firma_id, h.santiye_id, h.taseron_id)
      and public.yetkili('hatali', true)
  ));

-- Yazan 24 saat içinde, merkez her zaman düzeltir. Silme kuralı yok: silinmez.
drop policy if exists duzenler on public.hatali_notlar;
create policy duzenler on public.hatali_notlar for update to authenticated
  using (
    exists (
      select 1 from public.hatali_isler h
      where h.id = hatali_id and public.hata_okunur(h.firma_id, h.santiye_id, h.taseron_id)
    )
    and public.icerik_degisebilir(olusturan, olusturma, true)
  );

-- Revizyonu olan hatalı iş yalnız merkezce silinir.
drop policy if exists siler on public.hatali_isler;
create policy siler on public.hatali_isler for delete to authenticated
  using (
    public.hata_okunur(firma_id, santiye_id, taseron_id)
    and public.icerik_degisebilir(olusturan, olusturma, durum = 'tespit')
    and (public.benim_rol() = 'merkez'
         or not exists (select 1 from public.hatali_notlar n where n.hatali_id = hatali_isler.id))
  );

notify pgrst, 'reload schema';
