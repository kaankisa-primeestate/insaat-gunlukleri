-- Göç 16: Depo, firmaya ait malzeme ve demirbaşların takibi (2 Ekim).
--
-- Kullanıcı kararları:
-- - Her kayıt bir dosya: fotoğraf, ne olduğu, özellikleri, miktar + birim
--   ("3 adet", "2 paket", "10 ton"), nerede durduğu.
-- - Nerede: tanımlı bir depo ya da elle yazılan yer ("Celayir konteyner").
--   Depoları şirkete bağlı tüm çalışanlar tanımlar.
-- - Hareketler (revizyon): depoya giriş, ver (kime, hangi şantiyeye), geri
--   al (kim getirdi, durumu), kullanıldı, yer değişti, miktar düzeltmesi,
--   elden çıktı. Kalan miktar kendiliğinden güncellenir ve her revizyonda
--   o anki kalan görünür.
-- - Hiçbir şey silinmez (kayıt, hareket, depo). Düzeltme serbest ama iz
--   bırakır: eski ve yeni değer revizyon olarak görünür.
-- - Yalnız şirket tarafı görür; taşeron hesapları hiç görmez.
-- Tekrar çalıştırılırsa zarar vermez.

-- Yetki sekmesine "Depo" sayfası.
alter table public.yetkiler drop constraint if exists yetkiler_sayfa_check;
alter table public.yetkiler add constraint yetkiler_sayfa_check
  check (sayfa in ('gunluk', 'hatali', 'talep', 'teslimat', 'sozlesme', 'taseronlar', 'karar', 'depo'));

create or replace function public.varsayilan_yetki(r public.rol, s text, duzen boolean)
returns boolean
language sql immutable
as $$
  select case r
    when 'merkez' then true
    when 'personel' then true
    when 'sef' then case s
      when 'sozlesme' then not duzen
      when 'taseronlar' then not duzen
      else true end
    when 'satinalma' then case s
      when 'talep' then true
      when 'teslimat' then true
      when 'depo' then true
      else not duzen end
    when 'taseron' then case s
      when 'sozlesme' then not duzen
      when 'taseronlar' then false
      when 'depo' then false
      else true end
  end
$$;

-- Depoya erişim: şirket tarafı (taşeron hiçbir zaman) ve "Depo" yetkisi.
create or replace function public.depo_erisir(duzen boolean)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select public.benim_rol() <> 'taseron' and public.yetkili('depo', duzen)
$$;
revoke execute on function public.depo_erisir(boolean) from anon, public;
grant execute on function public.depo_erisir(boolean) to authenticated, service_role;

create table if not exists public.depolar (
  id uuid primary key default gen_random_uuid(),
  firma_id uuid not null references public.firmalar(id) on delete cascade,
  ad text not null check (char_length(ad) between 2 and 60),
  aktif boolean not null default true,
  olusturan uuid default auth.uid() references public.profiller(id),
  olusturma timestamptz not null default now(),
  unique (firma_id, ad)
);

create table if not exists public.depo_kalemleri (
  id uuid primary key default gen_random_uuid(),
  firma_id uuid not null references public.firmalar(id) on delete cascade,
  ad text not null check (char_length(ad) between 2 and 80),
  ozellik text check (char_length(ozellik) <= 300),
  birim text not null check (char_length(birim) between 1 and 20),
  -- Depoda duran ve verilip henüz geri gelmeyen miktar.
  depoda numeric(12, 2) not null default 0 check (depoda >= 0),
  disarida numeric(12, 2) not null default 0 check (disarida >= 0),
  depo_id uuid references public.depolar(id),
  yer_adi text check (char_length(yer_adi) between 2 and 80),
  fotograflar text[] not null default '{}' check (cardinality(fotograflar) <= 6),
  notu text check (char_length(notu) <= 300),
  kapandi boolean not null default false,
  olusturan uuid not null default auth.uid() references public.profiller(id),
  olusturma timestamptz not null default now(),
  duzenleme timestamptz,
  constraint depo_kalemi_yeri check ((depo_id is null) <> (yer_adi is null))
);
create index if not exists depo_kalemleri_firma_idx on public.depo_kalemleri (firma_id, kapandi);

create table if not exists public.depo_hareketleri (
  id bigint generated always as identity primary key,
  firma_id uuid not null references public.firmalar(id) on delete cascade,
  kalem_id uuid not null references public.depo_kalemleri(id) on delete restrict,
  sira integer not null,
  tur text not null check (tur in ('kayit', 'giris', 'ver', 'geri', 'kullanildi', 'yer', 'sayim', 'duzeltme', 'kapat', 'ac')),
  miktar numeric(12, 2),
  kime text check (char_length(kime) between 2 and 80),
  santiye_id uuid references public.santiyeler(id),
  durum text check (char_length(durum) <= 40),
  notu text check (char_length(notu) <= 300),
  -- Düzeltme, yer değişikliği ve miktar düzeltmesinde eski / yeni değerler.
  eski jsonb,
  yeni jsonb,
  -- Bu revizyondan sonra kalan (dosyada "Kalan: 4 paket").
  depoda numeric(12, 2) not null,
  disarida numeric(12, 2) not null,
  olusturan uuid default auth.uid() references public.profiller(id),
  olusturma timestamptz not null default now(),
  unique (kalem_id, sira)
);

alter table public.depolar enable row level security;
alter table public.depo_kalemleri enable row level security;
alter table public.depo_hareketleri enable row level security;

-- Okuma ve yazma şirket tarafına; silme kuralı yok, hiçbir şey silinmez.
drop policy if exists okur on public.depolar;
create policy okur on public.depolar for select to authenticated
  using (firma_id = public.benim_firma() and public.depo_erisir(false));
drop policy if exists ekler on public.depolar;
create policy ekler on public.depolar for insert to authenticated
  with check (firma_id = public.benim_firma() and public.depo_erisir(true));
drop policy if exists duzenler on public.depolar;
create policy duzenler on public.depolar for update to authenticated
  using (firma_id = public.benim_firma() and public.depo_erisir(true));

drop policy if exists okur on public.depo_kalemleri;
create policy okur on public.depo_kalemleri for select to authenticated
  using (firma_id = public.benim_firma() and public.depo_erisir(false));
drop policy if exists ekler on public.depo_kalemleri;
create policy ekler on public.depo_kalemleri for insert to authenticated
  with check (firma_id = public.benim_firma() and public.depo_erisir(true));
drop policy if exists duzenler on public.depo_kalemleri;
create policy duzenler on public.depo_kalemleri for update to authenticated
  using (firma_id = public.benim_firma() and public.depo_erisir(true));

-- Hareketleri yalnız veritabanı yazar (depo_hareket işlevi ve tetikleyiciler).
drop policy if exists okur on public.depo_hareketleri;
create policy okur on public.depo_hareketleri for select to authenticated
  using (firma_id = public.benim_firma() and public.depo_erisir(false));

-- Sıradaki revizyon numarası (aynı kayda aynı anda iki hareket gelirse çakışmasın).
create or replace function public.depo_sira(p_kalem uuid)
returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  n integer;
begin
  perform pg_advisory_xact_lock(hashtext('depo:' || p_kalem::text));
  select coalesce(max(sira), 0) + 1 into n from public.depo_hareketleri where kalem_id = p_kalem;
  return n;
end
$$;
revoke execute on function public.depo_sira(uuid) from anon, public, authenticated;

-- Yer yazısı: depo adı ya da elle yazılan yer.
create or replace function public.depo_yer_yazisi(p_depo uuid, p_yer text)
returns text
language sql stable security definer set search_path = ''
as $$
  select coalesce((select ad from public.depolar where id = p_depo), p_yer)
$$;
revoke execute on function public.depo_yer_yazisi(uuid, text) from anon, public;
grant execute on function public.depo_yer_yazisi(uuid, text) to authenticated, service_role;

-- Yeni kayıt: firma ve kaydeden sunucuda; ilk revizyon "Kaydedildi".
create or replace function public.depo_kalemi_ekle()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  new.firma_id := public.benim_firma();
  new.olusturan := auth.uid();
  new.olusturma := now();
  new.disarida := 0;
  new.kapandi := false;
  new.duzenleme := null;
  if new.depo_id is not null and not exists (
    select 1 from public.depolar d where d.id = new.depo_id and d.firma_id = new.firma_id) then
    raise exception 'Depo bulunamadı.' using errcode = 'P0001';
  end if;
  return new;
end
$$;
drop trigger if exists depo_kalemi_ekle on public.depo_kalemleri;
create trigger depo_kalemi_ekle before insert on public.depo_kalemleri
  for each row execute function public.depo_kalemi_ekle();

create or replace function public.depo_kalemi_kaydedildi()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.depo_hareketleri (firma_id, kalem_id, sira, tur, miktar, yeni, depoda, disarida)
  values (new.firma_id, new.id, 1, 'kayit', new.depoda,
          jsonb_build_object('yer', public.depo_yer_yazisi(new.depo_id, new.yer_adi)),
          new.depoda, 0);
  return new;
end
$$;
drop trigger if exists depo_kalemi_kaydedildi on public.depo_kalemleri;
create trigger depo_kalemi_kaydedildi after insert on public.depo_kalemleri
  for each row execute function public.depo_kalemi_kaydedildi();

-- Kayıt düzeltmesi: miktar, yer ve kapanış yalnız hareketle değişir.
-- Ad, özellik, birim, fotoğraf, not değişirse eski/yeni "Düzeltildi"
-- revizyonu olarak yazılır.
create or replace function public.depo_kalemi_guncelle()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  eski jsonb := '{}';
  yeni jsonb := '{}';
begin
  new.firma_id := old.firma_id;
  new.olusturan := old.olusturan;
  new.olusturma := old.olusturma;
  if coalesce(current_setting('depo.hareket', true), '') <> '1' then
    new.depoda := old.depoda;
    new.disarida := old.disarida;
    new.depo_id := old.depo_id;
    new.yer_adi := old.yer_adi;
    new.kapandi := old.kapandi;
  end if;
  if new.ad is distinct from old.ad then
    eski := eski || jsonb_build_object('Ad', old.ad); yeni := yeni || jsonb_build_object('Ad', new.ad);
  end if;
  if new.ozellik is distinct from old.ozellik then
    eski := eski || jsonb_build_object('Özellik', coalesce(old.ozellik, '—')); yeni := yeni || jsonb_build_object('Özellik', coalesce(new.ozellik, '—'));
  end if;
  if new.birim is distinct from old.birim then
    eski := eski || jsonb_build_object('Birim', old.birim); yeni := yeni || jsonb_build_object('Birim', new.birim);
  end if;
  if new.notu is distinct from old.notu then
    eski := eski || jsonb_build_object('Not', coalesce(old.notu, '—')); yeni := yeni || jsonb_build_object('Not', coalesce(new.notu, '—'));
  end if;
  if new.fotograflar is distinct from old.fotograflar then
    eski := eski || jsonb_build_object('Fotoğraf', cardinality(old.fotograflar) || ' adet');
    yeni := yeni || jsonb_build_object('Fotoğraf', cardinality(new.fotograflar) || ' adet');
  end if;
  if eski <> '{}' then
    new.duzenleme := now();
    insert into public.depo_hareketleri (firma_id, kalem_id, sira, tur, eski, yeni, depoda, disarida)
    values (old.firma_id, old.id, public.depo_sira(old.id), 'duzeltme', eski, yeni, new.depoda, new.disarida);
  end if;
  return new;
end
$$;
drop trigger if exists depo_kalemi_guncelle on public.depo_kalemleri;
create trigger depo_kalemi_guncelle before update on public.depo_kalemleri
  for each row execute function public.depo_kalemi_guncelle();

-- Hareket: miktarı ve yeri değiştiren tek yol. Kalan kendiliğinden hesaplanır.
--   giris      depoya ekleme           depoda += m
--   ver        kime, şantiye           depoda -= m, dışarıda += m
--   geri       kim getirdi, durumu     dışarıda -= m, depoda += m
--   kullanildi şantiye; depodan ya da verilenden tükendi
--   yer        yeni depo / yer
--   sayim      miktar düzeltmesi       depoda = m (eski → yeni görünür)
--   kapat / ac elden çıktı / yeniden açıldı
create or replace function public.depo_hareket(
  p_kalem uuid,
  p_tur text,
  p_miktar numeric default null,
  p_kime text default null,
  p_santiye uuid default null,
  p_durum text default null,
  p_notu text default null,
  p_kaynak text default 'depo',
  p_depo uuid default null,
  p_yer text default null
)
returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  k public.depo_kalemleri;
  m numeric(12, 2) := round(coalesce(p_miktar, 0), 2);
  eski jsonb;
  yeni jsonb;
  n integer;
begin
  if not public.depo_erisir(true) then
    raise exception 'Depo kaydı yetkiniz yok.' using errcode = 'P0001';
  end if;
  select * into k from public.depo_kalemleri where id = p_kalem and firma_id = public.benim_firma() for update;
  if k.id is null then
    raise exception 'Kayıt bulunamadı.' using errcode = 'P0001';
  end if;
  if k.kapandi and p_tur <> 'ac' then
    raise exception 'Bu kayıt kapalı (elden çıktı). Önce yeniden açın.' using errcode = 'P0001';
  end if;
  if p_santiye is not null and not exists (
    select 1 from public.santiyeler s where s.id = p_santiye and s.firma_id = k.firma_id) then
    raise exception 'Şantiye bulunamadı.' using errcode = 'P0001';
  end if;
  if p_tur in ('giris', 'ver', 'geri', 'kullanildi') and m <= 0 then
    raise exception 'Miktarı girin.' using errcode = 'P0001';
  end if;
  if p_tur in ('ver', 'geri') and coalesce(char_length(trim(p_kime)), 0) < 2 then
    raise exception '%', case p_tur when 'ver' then 'Kime verildiğini yazın.' else 'Kimin getirdiğini yazın.' end using errcode = 'P0001';
  end if;

  perform set_config('depo.hareket', '1', true);
  case p_tur
    when 'giris' then
      update public.depo_kalemleri set depoda = depoda + m where id = k.id;
    when 'ver' then
      if m > k.depoda then
        raise exception 'Depoda % % var; daha fazlası verilemez.', k.depoda, k.birim using errcode = 'P0001';
      end if;
      update public.depo_kalemleri set depoda = depoda - m, disarida = disarida + m where id = k.id;
    when 'geri' then
      if m > k.disarida then
        raise exception 'Dışarıda % % var; daha fazlası geri alınamaz.', k.disarida, k.birim using errcode = 'P0001';
      end if;
      update public.depo_kalemleri set depoda = depoda + m, disarida = disarida - m where id = k.id;
    when 'kullanildi' then
      if p_kaynak = 'disari' then
        if m > k.disarida then
          raise exception 'Dışarıda % % var.', k.disarida, k.birim using errcode = 'P0001';
        end if;
        update public.depo_kalemleri set disarida = disarida - m where id = k.id;
      else
        if m > k.depoda then
          raise exception 'Depoda % % var.', k.depoda, k.birim using errcode = 'P0001';
        end if;
        update public.depo_kalemleri set depoda = depoda - m where id = k.id;
      end if;
    when 'yer' then
      if (p_depo is null) = (coalesce(char_length(trim(p_yer)), 0) < 2) then
        raise exception 'Yeni yeri seçin ya da yazın.' using errcode = 'P0001';
      end if;
      if p_depo is not null and not exists (
        select 1 from public.depolar d where d.id = p_depo and d.firma_id = k.firma_id) then
        raise exception 'Depo bulunamadı.' using errcode = 'P0001';
      end if;
      eski := jsonb_build_object('yer', public.depo_yer_yazisi(k.depo_id, k.yer_adi));
      yeni := jsonb_build_object('yer', public.depo_yer_yazisi(p_depo, trim(p_yer)));
      update public.depo_kalemleri
         set depo_id = p_depo, yer_adi = case when p_depo is null then trim(p_yer) end
       where id = k.id;
    when 'sayim' then
      if m < 0 then
        raise exception 'Miktar eksi olamaz.' using errcode = 'P0001';
      end if;
      eski := jsonb_build_object('depoda', k.depoda);
      yeni := jsonb_build_object('depoda', m);
      update public.depo_kalemleri set depoda = m where id = k.id;
    when 'kapat' then
      update public.depo_kalemleri set kapandi = true where id = k.id;
    when 'ac' then
      update public.depo_kalemleri set kapandi = false where id = k.id;
    else
      raise exception 'Geçersiz hareket.' using errcode = 'P0001';
  end case;
  perform set_config('depo.hareket', '', true);

  select * into k from public.depo_kalemleri where id = p_kalem;
  n := public.depo_sira(k.id);
  insert into public.depo_hareketleri
    (firma_id, kalem_id, sira, tur, miktar, kime, santiye_id, durum, notu, eski, yeni, depoda, disarida)
  values
    (k.firma_id, k.id, n, p_tur,
     case when p_tur in ('giris', 'ver', 'geri', 'kullanildi') then m end,
     nullif(trim(p_kime), ''), p_santiye, nullif(trim(p_durum), ''), nullif(trim(p_notu), ''),
     eski, yeni, k.depoda, k.disarida);
  return n;
end
$$;
revoke execute on function public.depo_hareket(uuid, text, numeric, text, uuid, text, text, text, uuid, text) from anon, public;
grant execute on function public.depo_hareket(uuid, text, numeric, text, uuid, text, text, text, uuid, text) to authenticated, service_role;

notify pgrst, 'reload schema';
