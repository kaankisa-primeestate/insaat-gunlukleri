-- Göç 11: Karar Defteri (29 Eylül, kullanıcı kararı).
--
-- Sahada verilen kararın (ör. "D12 mutfak asma tavanı 2,60'ta biter") kiminle,
-- ne zaman verildiği ve en son hangisinin geçerli olduğu kayıt altına alınır.
--
-- Kurallar:
-- - Merkez tarafı (merkez, personel, şef, kalfa) şantiyedeki her taşerona ve
--   personele karar yazar; taşeron yalnız kendi alt taşeronlarına.
-- - Merkez tarafı şantiyenin bütün kararlarını görür. Taşeron kendi açtığı ve
--   kendisinin (ya da alt taşeronunun) muhatap olduğu kararları görür.
-- - Muhataplar (seçilen personel ve taşeron firmalar) kendi hesabından
--   "Okudum" der; firma adına o firmanın bir kullanıcısı onaylar.
-- - Kimse okumadan önce kaydı giren serbestçe düzeltir ve siler. Biri
--   okuduktan sonra düzeltme kapanır; "Kararı değiştir" ile yeni sürüm açılır,
--   eskisi "değişti" olarak kalır. Onaydan sonra silme yalnız merkezde.
-- Tekrar çalıştırılırsa zarar vermez.

-- Yetki matrisine yeni bölüm. Varsayılan: herkes görür ve yazar,
-- satın alma yalnız görür (varsayilan_yetki'nin mevcut dalları).
alter table public.yetkiler drop constraint if exists yetkiler_sayfa_check;
alter table public.yetkiler add constraint yetkiler_sayfa_check
  check (sayfa in ('gunluk', 'hatali', 'talep', 'teslimat', 'sozlesme', 'taseronlar', 'karar'));

create table if not exists public.kararlar (
  id uuid primary key default gen_random_uuid(),
  firma_id uuid not null references public.firmalar(id) on delete cascade,
  santiye_id uuid not null references public.santiyeler(id) on delete cascade,
  is_tarihi date not null default (now() at time zone 'Europe/Istanbul')::date,
  yer text check (char_length(yer) <= 80),
  daire text check (char_length(daire) <= 20),
  mahal text check (char_length(mahal) <= 60),
  konu text check (char_length(konu) <= 40),
  karar text not null check (char_length(karar) between 2 and 1000),
  fotograflar text[] not null default '{}' check (cardinality(fotograflar) <= 6),
  -- Sistemde olmayan katılımcılar (mimar, mal sahibi…): yalnız ad.
  dis_katilimcilar text[] not null default '{}' check (cardinality(dis_katilimcilar) <= 10),
  -- Bu kayıt hangi kararın yerine geldi; eskisi degisti = true olur.
  onceki_id uuid references public.kararlar(id) on delete set null,
  degisti boolean not null default false,
  olusturan uuid not null default auth.uid() references public.profiller(id),
  -- Taşeron açtıysa hangi firma adına; merkez tarafında boş.
  olusturan_taseron uuid references public.taseronlar(id) on delete set null,
  olusturma timestamptz not null default now(),
  duzenleme timestamptz
);
create index if not exists kararlar_santiye_idx on public.kararlar (santiye_id, is_tarihi desc);
create index if not exists kararlar_onceki_idx on public.kararlar (onceki_id);

create table if not exists public.karar_muhataplari (
  id uuid primary key default gen_random_uuid(),
  karar_id uuid not null references public.kararlar(id) on delete cascade,
  kullanici_id uuid references public.profiller(id) on delete cascade,
  taseron_id uuid references public.taseronlar(id) on delete cascade,
  okundu timestamptz,
  okuyan uuid references public.profiller(id),
  check ((kullanici_id is null) <> (taseron_id is null))
);
create unique index if not exists karar_muhatap_kisi on public.karar_muhataplari (karar_id, kullanici_id) where kullanici_id is not null;
create unique index if not exists karar_muhatap_firma on public.karar_muhataplari (karar_id, taseron_id) where taseron_id is not null;

-- Görme kuralı (yukarıda). Muhatap tablosu içeriden okunur; döngü olmasın
-- diye definer işlev.
create or replace function public.karar_okunur(k uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.kararlar r
    where r.id = k
      and r.firma_id = public.benim_firma()
      and r.santiye_id in (select public.erisilen_santiyeler())
      and public.yetkili('karar', false)
      and (
        public.benim_rol() <> 'taseron'
        or r.olusturan_taseron in (select public.gorunur_taseronlar())
        or exists (
          select 1 from public.karar_muhataplari m
          where m.karar_id = r.id and m.taseron_id in (select public.gorunur_taseronlar())
        )
      )
  )
$$;

-- Okunduktan ya da yerine yenisi geldikten sonra içerik değişmez.
create or replace function public.karar_kilitli(k uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.karar_muhataplari m where m.karar_id = k and m.okundu is not null)
      or exists (select 1 from public.kararlar r where r.id = k and r.degisti)
$$;

-- Kullanıcının taşeron firması (taşeron değilse boş).
create or replace function public.benim_taseronum()
returns uuid
language sql stable security definer set search_path = ''
as $$
  select p.taseron_id from public.profiller p where p.id = auth.uid() and p.aktif
$$;

alter table public.kararlar enable row level security;
alter table public.karar_muhataplari enable row level security;

drop policy if exists okur on public.kararlar;
create policy okur on public.kararlar for select to authenticated
  using (public.karar_okunur(id));

drop policy if exists ekler on public.kararlar;
create policy ekler on public.kararlar for insert to authenticated
  with check (
    firma_id = public.benim_firma()
    and santiye_id in (select public.erisilen_santiyeler())
    and public.yetkili('karar', true)
    and olusturan = auth.uid()
    and olusturan_taseron is not distinct from public.benim_taseronum()
  );

drop policy if exists duzenler on public.kararlar;
create policy duzenler on public.kararlar for update to authenticated
  using (olusturan = auth.uid() and not public.karar_kilitli(id) and public.karar_okunur(id));

drop policy if exists siler on public.kararlar;
create policy siler on public.kararlar for delete to authenticated
  using (
    public.karar_okunur(id)
    and (public.benim_rol() = 'merkez' or (olusturan = auth.uid() and not public.karar_kilitli(id)))
  );

-- Muhataplar: görmek kararın görünmesine bağlı. Ekleme/çıkarma yalnız kaydı
-- giren ve kilitlenmemişken. Taşeron yalnız kendi alt taşeronunu muhatap alır.
drop policy if exists okur on public.karar_muhataplari;
create policy okur on public.karar_muhataplari for select to authenticated
  using (public.karar_okunur(karar_id));

drop policy if exists yazar on public.karar_muhataplari;
create policy yazar on public.karar_muhataplari for insert to authenticated
  with check (
    okundu is null
    and exists (select 1 from public.kararlar r where r.id = karar_id and r.olusturan = auth.uid())
    and not public.karar_kilitli(karar_id)
    and (
      (public.benim_rol() <> 'taseron'
        and (taseron_id is null or taseron_id in (select public.gorunur_taseronlar()))
        and (kullanici_id is null or exists (
          select 1 from public.profiller p where p.id = kullanici_id and p.firma_id = public.benim_firma() and p.rol <> 'taseron')))
      or (public.benim_rol() = 'taseron'
        and kullanici_id is null
        and exists (select 1 from public.taseronlar t where t.id = taseron_id and t.ust_taseron_id = public.benim_taseronum()))
    )
  );

drop policy if exists siler on public.karar_muhataplari;
create policy siler on public.karar_muhataplari for delete to authenticated
  using (
    exists (select 1 from public.kararlar r where r.id = karar_id and r.olusturan = auth.uid())
    and not public.karar_kilitli(karar_id)
  );

-- "Kararı değiştir": yeni sürüm eklenince eskisi "değişti" olur. Eskisini
-- değiştirebilen: merkez tarafı ya da eski kararı açan taşeron firması.
create or replace function public.karar_yeni_surum()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  eski public.kararlar;
begin
  if new.onceki_id is null then return new; end if;
  select * into eski from public.kararlar where id = new.onceki_id;
  if eski.id is null or eski.firma_id <> new.firma_id or eski.santiye_id <> new.santiye_id then
    raise exception 'Değiştirilecek karar bulunamadı.' using errcode = 'P0001';
  end if;
  if eski.degisti then
    raise exception 'Bu kararın yerine zaten yenisi yazılmış; en son sürümü değiştirin.' using errcode = 'P0001';
  end if;
  if public.benim_rol() = 'taseron' and eski.olusturan_taseron is distinct from public.benim_taseronum() then
    raise exception 'Bu kararı yalnız onu açan taraf değiştirebilir.' using errcode = 'P0001';
  end if;
  update public.kararlar set degisti = true where id = eski.id;
  return new;
end
$$;
drop trigger if exists karar_yeni_surum on public.kararlar;
create trigger karar_yeni_surum after insert on public.kararlar
  for each row execute function public.karar_yeni_surum();

-- Kayıt kimliği korunur; içerik değişince "düzenlendi" damgası. Yeni sürüm
-- eklenirken eski satırı "değişti" yapan güncelleme (tetikleyici içinden
-- gelir) ezilmez.
create or replace function public.karar_guncelle()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  new.firma_id := old.firma_id;
  new.santiye_id := old.santiye_id;
  new.olusturan := old.olusturan;
  new.olusturan_taseron := old.olusturan_taseron;
  new.olusturma := old.olusturma;
  new.onceki_id := old.onceki_id;
  if pg_trigger_depth() > 1 then
    -- Yeni sürüm eklenirken tetikleyiciden gelen "değişti" işareti.
    return new;
  end if;
  new.degisti := old.degisti;
  new.duzenleme := now();
  return new;
end
$$;
drop trigger if exists karar_guncelle on public.kararlar;
create trigger karar_guncelle before update on public.kararlar
  for each row execute function public.karar_guncelle();

-- "Okudum": kullanıcı kendisine ya da firmasına yazılmış satırları onaylar.
-- Geri alınamaz; kimin ne zaman okuduğu tutulur.
create or replace function public.karar_okudum(p_karar uuid)
returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  adet integer;
begin
  if not public.karar_okunur(p_karar) then
    raise exception 'Karar bulunamadı.' using errcode = 'P0001';
  end if;
  update public.karar_muhataplari
     set okundu = now(), okuyan = auth.uid()
   where karar_id = p_karar
     and okundu is null
     and (kullanici_id = auth.uid() or (taseron_id is not null and taseron_id = public.benim_taseronum()));
  get diagnostics adet = row_count;
  return adet;
end
$$;

revoke execute on function public.karar_okunur(uuid) from anon, public;
revoke execute on function public.karar_kilitli(uuid) from anon, public;
revoke execute on function public.benim_taseronum() from anon, public;
revoke execute on function public.karar_okudum(uuid) from anon, public;
grant execute on function public.karar_okunur(uuid) to authenticated, service_role;
grant execute on function public.karar_kilitli(uuid) to authenticated, service_role;
grant execute on function public.benim_taseronum() to authenticated, service_role;
grant execute on function public.karar_okudum(uuid) to authenticated, service_role;

grant select, insert, update, delete on public.kararlar to authenticated;
grant select, insert, update, delete on public.karar_muhataplari to authenticated;
grant all on public.kararlar to service_role;
grant all on public.karar_muhataplari to service_role;

notify pgrst, 'reload schema';
