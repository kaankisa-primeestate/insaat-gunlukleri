-- İnşaat Günlükleri — temel şema
--
-- Çok kiracılı yapı: her tabloda firma_id vardır ve satır bazlı güvenlik (RLS)
-- bir kullanıcının yalnızca kendi firmasının verisini görmesini sağlar.
-- Firma içinde ikinci bir süzgeç daha vardır: şef yalnızca atandığı
-- şantiyeleri, taşeron yalnızca kendisini ve alt taşeronlarını görür.
-- Bu kurallar veritabanında olduğu için arayüzdeki bir hata veri sızdıramaz.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tablolar
-- ---------------------------------------------------------------------------

create table public.firmalar (
  id uuid primary key default gen_random_uuid(),
  ad text not null check (char_length(ad) between 2 and 120),
  olusturma timestamptz not null default now()
);

create type public.rol as enum ('merkez', 'personel', 'sef', 'satinalma', 'taseron');

create table public.santiyeler (
  id uuid primary key default gen_random_uuid(),
  firma_id uuid not null references public.firmalar(id) on delete cascade,
  ad text not null check (char_length(ad) between 2 and 80),
  adres text check (char_length(adres) <= 200),
  bodrum_kat smallint not null default 2 check (bodrum_kat between 0 and 10),
  kat_sayisi smallint not null default 15 check (kat_sayisi between 1 and 80),
  aktif boolean not null default true,
  olusturma timestamptz not null default now()
);
create index on public.santiyeler (firma_id);

create table public.taseronlar (
  id uuid primary key default gen_random_uuid(),
  firma_id uuid not null references public.firmalar(id) on delete cascade,
  -- Doluysa bu bir alt taşerondur; ana taşeron onu görür, o ana taşeronu görmez.
  ust_taseron_id uuid references public.taseronlar(id) on delete restrict,
  firma_adi text not null check (char_length(firma_adi) between 2 and 120),
  yetkili text check (char_length(yetkili) <= 80),
  telefon text check (char_length(telefon) <= 20),
  vergi_no text check (char_length(vergi_no) <= 20),
  iban text check (char_length(iban) <= 34),
  is_turu text not null check (char_length(is_turu) between 2 and 40),
  -- Ana taşeronun kendi alt taşeronunu tanımlayabilmesi (Modül 1).
  alt_taseron_yetkisi boolean not null default false,
  aktif boolean not null default true,
  olusturma timestamptz not null default now()
);
create index on public.taseronlar (firma_id);
create index on public.taseronlar (ust_taseron_id);

create table public.profiller (
  id uuid primary key references auth.users(id) on delete cascade,
  firma_id uuid not null references public.firmalar(id) on delete cascade,
  kullanici_adi text not null unique check (kullanici_adi ~ '^[a-z0-9][a-z0-9._-]{2,31}$'),
  ad_soyad text not null check (char_length(ad_soyad) between 2 and 80),
  telefon text check (char_length(telefon) <= 20),
  rol public.rol not null,
  -- Rol taşeron ise hangi taşeron firmasını temsil ettiği.
  taseron_id uuid references public.taseronlar(id) on delete cascade,
  aktif boolean not null default true,
  olusturma timestamptz not null default now(),
  check ((rol = 'taseron') = (taseron_id is not null))
);
create index on public.profiller (firma_id);
create index on public.profiller (taseron_id);

-- Şef, kalfa, satın almacı gibi personelin sorumlu olduğu şantiyeler.
create table public.kullanici_santiye (
  kullanici_id uuid not null references public.profiller(id) on delete cascade,
  santiye_id uuid not null references public.santiyeler(id) on delete cascade,
  primary key (kullanici_id, santiye_id)
);

-- Sözleşme aynı zamanda taşeronu şantiyeye bağlar: bir taşeron, sözleşmesi
-- olan şantiyelerde listelenir.
create table public.sozlesmeler (
  id uuid primary key default gen_random_uuid(),
  firma_id uuid not null references public.firmalar(id) on delete cascade,
  taseron_id uuid not null references public.taseronlar(id) on delete cascade,
  santiye_id uuid not null references public.santiyeler(id) on delete cascade,
  is_tarifi text not null check (char_length(is_tarifi) between 2 and 500),
  baslangic date,
  bitis date,
  yer_teslim date,
  sure_gun integer check (sure_gun between 1 and 3650),
  -- Net bitiş girilmişse o, yoksa yer teslim + süre.
  bitis_hesap date generated always as (coalesce(bitis, yer_teslim + sure_gun)) stored,
  belge_yolu text,
  tamamlandi boolean not null default false,
  olusturma timestamptz not null default now(),
  check (bitis is not null or (yer_teslim is not null and sure_gun is not null)),
  check (bitis is null or baslangic is null or bitis >= baslangic)
);
create index on public.sozlesmeler (firma_id);
create index on public.sozlesmeler (taseron_id);
create index on public.sozlesmeler (santiye_id);

-- Yetki matrisi. Satır yoksa rolün varsayılanı geçerlidir (varsayilan_yetki).
-- Taşeron kullanıcıları için yetki taşeron firmasına tanımlanır (Yetki Sekmesi),
-- diğer kullanıcılar için kişiye.
create table public.yetkiler (
  id uuid primary key default gen_random_uuid(),
  firma_id uuid not null references public.firmalar(id) on delete cascade,
  kullanici_id uuid references public.profiller(id) on delete cascade,
  taseron_id uuid references public.taseronlar(id) on delete cascade,
  sayfa text not null check (sayfa in ('gunluk', 'hatali', 'talep', 'teslimat', 'sozlesme', 'taseronlar')),
  gorur boolean not null,
  duzenler boolean not null,
  check ((kullanici_id is null) <> (taseron_id is null)),
  check (gorur or not duzenler)
);
create unique index on public.yetkiler (kullanici_id, sayfa) where kullanici_id is not null;
create unique index on public.yetkiler (taseron_id, sayfa) where taseron_id is not null;

-- Kayıt tablolarında iki tarih ayrı tutulur: is_tarihi kullanıcının seçtiği
-- (geçmişe dönük olabilir), olusturma sunucunun damgasıdır.
-- id istemcide üretilebilir; çevrimdışı kayıt aynı kimlikle iki kez gelirse
-- ikinci kez eklenmez.
create table public.gunlukler (
  id uuid primary key default gen_random_uuid(),
  firma_id uuid not null references public.firmalar(id) on delete cascade,
  santiye_id uuid not null references public.santiyeler(id) on delete cascade,
  taseron_id uuid not null references public.taseronlar(id) on delete cascade,
  is_tarihi date not null,
  kisi_sayisi smallint not null check (kisi_sayisi between 0 and 500),
  kat text check (char_length(kat) <= 30),
  is_kalemi text check (char_length(is_kalemi) <= 80),
  notu text check (char_length(notu) <= 300),
  fotograflar text[] not null default '{}' check (cardinality(fotograflar) <= 6),
  olusturan uuid not null default auth.uid() references public.profiller(id),
  olusturma timestamptz not null default now(),
  -- İleride kanuni delil altyapısı için ayrılan alanlar (ERTELENENLER C2, C12).
  cihaz_zamani timestamptz,
  konum jsonb
);
create index on public.gunlukler (firma_id, is_tarihi desc);
create index on public.gunlukler (taseron_id, is_tarihi desc);
create index on public.gunlukler (santiye_id, is_tarihi desc);

create type public.onem as enum ('acil', 'normal', 'dusuk');
create type public.hata_durum as enum ('tespit', 'duzeltiliyor', 'onaylandi');

create table public.hatali_isler (
  id uuid primary key default gen_random_uuid(),
  firma_id uuid not null references public.firmalar(id) on delete cascade,
  santiye_id uuid not null references public.santiyeler(id) on delete cascade,
  taseron_id uuid not null references public.taseronlar(id) on delete cascade,
  is_tarihi date not null,
  aciklama text not null check (char_length(aciklama) between 2 and 300),
  kat text check (char_length(kat) <= 30),
  onem public.onem not null default 'normal',
  durum public.hata_durum not null default 'tespit',
  fotograflar text[] not null check (cardinality(fotograflar) between 1 and 6),
  olusturan uuid not null default auth.uid() references public.profiller(id),
  olusturma timestamptz not null default now(),
  guncelleme timestamptz not null default now(),
  cihaz_zamani timestamptz,
  konum jsonb
);
create index on public.hatali_isler (firma_id, durum, onem);
create index on public.hatali_isler (taseron_id);

create type public.talep_durum as enum ('acildi', 'satin_alindi', 'yolda', 'teslim_alindi', 'kapandi');

create table public.talepler (
  id uuid primary key default gen_random_uuid(),
  firma_id uuid not null references public.firmalar(id) on delete cascade,
  santiye_id uuid not null references public.santiyeler(id) on delete cascade,
  taseron_id uuid not null references public.taseronlar(id) on delete cascade,
  urun text not null check (char_length(urun) between 2 and 80),
  miktar numeric(12, 2) not null check (miktar > 0),
  birim text not null check (char_length(birim) between 1 and 20),
  notu text check (char_length(notu) <= 300),
  durum public.talep_durum not null default 'acildi',
  is_tarihi date not null default (now() at time zone 'Europe/Istanbul')::date,
  olusturan uuid not null default auth.uid() references public.profiller(id),
  olusturma timestamptz not null default now(),
  guncelleme timestamptz not null default now(),
  cihaz_zamani timestamptz
);
create index on public.talepler (firma_id, durum);
create index on public.talepler (taseron_id);

create table public.teslimatlar (
  id uuid primary key default gen_random_uuid(),
  firma_id uuid not null references public.firmalar(id) on delete cascade,
  santiye_id uuid not null references public.santiyeler(id) on delete cascade,
  taseron_id uuid not null references public.taseronlar(id) on delete cascade,
  talep_id uuid references public.talepler(id) on delete set null,
  tarih date not null,
  saat smallint not null check (saat between 0 and 23),
  arac text not null check (char_length(arac) between 2 and 40),
  urun text not null check (char_length(urun) between 2 and 80),
  olusturan uuid not null default auth.uid() references public.profiller(id),
  olusturma timestamptz not null default now()
);
create index on public.teslimatlar (santiye_id, tarih, saat);

-- Durum değişikliklerinin geçmişi. Tetikleyici yazar, kimse elle yazmaz.
create table public.hareketler (
  id bigint generated always as identity primary key,
  firma_id uuid not null references public.firmalar(id) on delete cascade,
  kayit_turu text not null check (kayit_turu in ('hatali', 'talep')),
  kayit_id uuid not null,
  durum text not null,
  kullanici uuid default auth.uid(),
  zaman timestamptz not null default now()
);
create index on public.hareketler (kayit_turu, kayit_id);

-- ---------------------------------------------------------------------------
-- Yardımcı işlevler (RLS bunları kullanır)
--
-- security definer: politikalar içinde profiller tablosunu okurken tekrar
-- politika tetiklenip sonsuz döngü oluşmasın diye.
-- ---------------------------------------------------------------------------

create function public.benim_profil()
returns public.profiller
language sql stable security definer set search_path = ''
as $$
  select p.* from public.profiller p where p.id = auth.uid() and p.aktif
$$;

create function public.benim_firma()
returns uuid
language sql stable security definer set search_path = ''
as $$
  select p.firma_id from public.profiller p where p.id = auth.uid() and p.aktif
$$;

create function public.benim_rol()
returns public.rol
language sql stable security definer set search_path = ''
as $$
  select p.rol from public.profiller p where p.id = auth.uid() and p.aktif
$$;

-- Rolün varsayılan yetkileri (Bölüm A.3'teki örnek matris).
create function public.varsayilan_yetki(r public.rol, s text, duzen boolean)
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
      else not duzen end
    when 'taseron' then case s
      when 'gunluk' then not duzen
      when 'sozlesme' then not duzen
      when 'taseronlar' then false
      else true end
  end
$$;

-- Geçerli kullanıcının bir sayfayı görme/düzenleme yetkisi.
create function public.yetkili(s text, duzen boolean default false)
returns boolean
language plpgsql stable security definer set search_path = ''
as $$
declare
  p public.profiller;
  y public.yetkiler;
begin
  select * into p from public.profiller where id = auth.uid() and aktif;
  if p.id is null then return false; end if;
  if p.rol = 'merkez' then return true; end if;

  if p.rol = 'taseron' then
    select * into y from public.yetkiler where taseron_id = p.taseron_id and sayfa = s;
  else
    select * into y from public.yetkiler where kullanici_id = p.id and sayfa = s;
  end if;

  if y.id is null then
    return public.varsayilan_yetki(p.rol, s, duzen);
  end if;
  return case when duzen then y.duzenler else y.gorur end;
end
$$;

-- Kullanıcının erişebildiği şantiyeler.
create function public.erisilen_santiyeler()
returns setof uuid
language plpgsql stable security definer set search_path = ''
as $$
declare
  p public.profiller;
begin
  select * into p from public.profiller where id = auth.uid() and aktif;
  if p.id is null then return; end if;

  if p.rol in ('merkez', 'personel', 'satinalma') then
    return query select s.id from public.santiyeler s where s.firma_id = p.firma_id;
  elsif p.rol = 'sef' then
    return query select ks.santiye_id from public.kullanici_santiye ks where ks.kullanici_id = p.id;
  else
    -- Taşeron: kendisinin, alt taşeronlarının veya (alt taşeronsa) ana
    -- taşeronunun sözleşmesi olan şantiyeler.
    return query
      select distinct so.santiye_id from public.sozlesmeler so
      join public.taseronlar t on t.id = p.taseron_id
      where so.taseron_id = t.id
         or so.taseron_id = t.ust_taseron_id
         or so.taseron_id in (select c.id from public.taseronlar c where c.ust_taseron_id = t.id);
  end if;
end
$$;

-- Kullanıcının görebildiği taşeronlar.
-- Taşeron kullanıcısı yalnızca kendisini ve alt taşeronlarını görür:
-- "Diğer taşeronlar kesinlikle göremez" kuralı burada, yetki matrisinden
-- bağımsız olarak uygulanır.
create function public.gorunur_taseronlar()
returns setof uuid
language plpgsql stable security definer set search_path = ''
as $$
declare
  p public.profiller;
begin
  select * into p from public.profiller where id = auth.uid() and aktif;
  if p.id is null then return; end if;

  if p.rol in ('merkez', 'personel', 'satinalma') then
    return query select t.id from public.taseronlar t where t.firma_id = p.firma_id;
  elsif p.rol = 'sef' then
    return query
      select distinct t.id from public.taseronlar t
      where t.firma_id = p.firma_id
        and exists (
          select 1 from public.sozlesmeler so
          join public.kullanici_santiye ks on ks.santiye_id = so.santiye_id and ks.kullanici_id = p.id
          where so.taseron_id = t.id or so.taseron_id = t.ust_taseron_id
        );
  else
    return query
      select t.id from public.taseronlar t
      where t.id = p.taseron_id or t.ust_taseron_id = p.taseron_id;
  end if;
end
$$;

-- Kayıt tablolarının ortak okuma kuralı.
create function public.kayit_okunur(f uuid, santiye uuid, taseron uuid, sayfa text)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select f = public.benim_firma()
     and santiye in (select public.erisilen_santiyeler())
     and taseron in (select public.gorunur_taseronlar())
     and public.yetkili(sayfa, false)
$$;

create function public.kayit_yazilir(f uuid, santiye uuid, taseron uuid, sayfa text)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select public.kayit_okunur(f, santiye, taseron, sayfa)
     and public.yetkili(sayfa, true)
$$;

-- ---------------------------------------------------------------------------
-- Tetikleyiciler
-- ---------------------------------------------------------------------------

-- Kayıt eklenirken firma, kullanıcının firmasından alınır; istemci başka bir
-- firmanın kimliğini gönderse bile yok sayılır. Oluşturan ve sunucu zamanı
-- da istemciden kabul edilmez.
create function public.firma_ata()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is not null then
    new.firma_id := public.benim_firma();
  end if;
  return new;
end
$$;

create function public.kayit_damgala()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is not null then
    new.firma_id := public.benim_firma();
    new.olusturan := auth.uid();
  end if;
  new.olusturma := now();
  return new;
end
$$;

create trigger firma_ata before insert on public.santiyeler for each row execute function public.firma_ata();
create trigger firma_ata before insert on public.taseronlar for each row execute function public.firma_ata();
create trigger firma_ata before insert on public.sozlesmeler for each row execute function public.firma_ata();
create trigger firma_ata before insert on public.yetkiler for each row execute function public.firma_ata();
-- İleri tarihli kayıt engeli. CHECK kısıtı yerine tetikleyici: kısıt
-- içinde now() kullanmak yedekten geri yüklemede eski kayıtları reddedebilir.
create function public.tarih_denetle()
returns trigger
language plpgsql
as $$
begin
  if new.is_tarihi > (now() at time zone 'Europe/Istanbul')::date + 1 then
    raise exception 'İleri tarihli kayıt girilemez';
  end if;
  return new;
end
$$;
create trigger tarih_denetle before insert or update on public.gunlukler for each row execute function public.tarih_denetle();
create trigger tarih_denetle before insert or update on public.hatali_isler for each row execute function public.tarih_denetle();

create trigger kayit_damgala before insert on public.gunlukler for each row execute function public.kayit_damgala();
create trigger kayit_damgala before insert on public.hatali_isler for each row execute function public.kayit_damgala();
create trigger kayit_damgala before insert on public.talepler for each row execute function public.kayit_damgala();
create trigger kayit_damgala before insert on public.teslimatlar for each row execute function public.kayit_damgala();

-- Güncellemede kimlik alanları değiştirilemez.
create function public.kimlik_koru()
returns trigger
language plpgsql
as $$
begin
  new.firma_id := old.firma_id;
  new.olusturan := old.olusturan;
  new.olusturma := old.olusturma;
  return new;
end
$$;
create trigger kimlik_koru before update on public.gunlukler for each row execute function public.kimlik_koru();
create trigger kimlik_koru before update on public.teslimatlar for each row execute function public.kimlik_koru();

-- Hatalı iş durum kuralları: taşeron yalnızca "düzeltiliyor" diyebilir,
-- "onaylandı" merkez tarafının kararıdır. Taşeron açıklamayı, önemi,
-- fotoğrafları değiştiremez.
create function public.hatali_guncelle()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  new.firma_id := old.firma_id;
  new.olusturan := old.olusturan;
  new.olusturma := old.olusturma;
  if public.benim_rol() = 'taseron' then
    if new.durum = 'onaylandi' and old.durum <> 'onaylandi' then
      raise exception 'Taşeron işi onaylayamaz';
    end if;
    new.aciklama := old.aciklama;
    new.onem := old.onem;
    new.fotograflar := old.fotograflar;
    new.taseron_id := old.taseron_id;
    new.santiye_id := old.santiye_id;
    new.is_tarihi := old.is_tarihi;
  end if;
  if new.durum is distinct from old.durum then
    new.guncelleme := now();
    insert into public.hareketler (firma_id, kayit_turu, kayit_id, durum)
    values (new.firma_id, 'hatali', new.id, new.durum::text);
  end if;
  return new;
end
$$;
create trigger hatali_guncelle before update on public.hatali_isler for each row execute function public.hatali_guncelle();

-- Talep durum kuralları: taşeron talep açar ama durumunu ilerletemez.
create function public.talep_guncelle()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  new.firma_id := old.firma_id;
  new.olusturan := old.olusturan;
  new.olusturma := old.olusturma;
  if new.durum is distinct from old.durum then
    if public.benim_rol() = 'taseron' then
      raise exception 'Taşeron talep durumunu değiştiremez';
    end if;
    new.guncelleme := now();
    insert into public.hareketler (firma_id, kayit_turu, kayit_id, durum)
    values (new.firma_id, 'talep', new.id, new.durum::text);
  end if;
  return new;
end
$$;
create trigger talep_guncelle before update on public.talepler for each row execute function public.talep_guncelle();

create function public.ilk_hareket()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.hareketler (firma_id, kayit_turu, kayit_id, durum)
  values (new.firma_id, tg_argv[0], new.id, new.durum::text);
  return new;
end
$$;
create trigger ilk_hareket after insert on public.hatali_isler for each row execute function public.ilk_hareket('hatali');
create trigger ilk_hareket after insert on public.talepler for each row execute function public.ilk_hareket('talep');

-- ---------------------------------------------------------------------------
-- Satır bazlı güvenlik
-- ---------------------------------------------------------------------------

alter table public.firmalar enable row level security;
alter table public.santiyeler enable row level security;
alter table public.taseronlar enable row level security;
alter table public.profiller enable row level security;
alter table public.kullanici_santiye enable row level security;
alter table public.sozlesmeler enable row level security;
alter table public.yetkiler enable row level security;
alter table public.gunlukler enable row level security;
alter table public.hatali_isler enable row level security;
alter table public.talepler enable row level security;
alter table public.teslimatlar enable row level security;
alter table public.hareketler enable row level security;

create policy okur on public.firmalar for select to authenticated
  using (id = public.benim_firma());
create policy merkez_duzenler on public.firmalar for update to authenticated
  using (id = public.benim_firma() and public.benim_rol() = 'merkez');

create policy okur on public.santiyeler for select to authenticated
  using (id in (select public.erisilen_santiyeler()));
create policy merkez_ekler on public.santiyeler for insert to authenticated
  with check (public.benim_rol() = 'merkez');
create policy merkez_duzenler on public.santiyeler for update to authenticated
  using (firma_id = public.benim_firma() and public.benim_rol() = 'merkez');

-- Politika içinde aynı tabloyu okumak sonsuz döngü yaratır; işlevle okunur.
create function public.alt_taseron_acabilir()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce((
    select t.alt_taseron_yetkisi from public.taseronlar t
    join public.profiller p on p.taseron_id = t.id
    where p.id = auth.uid() and p.aktif and p.rol = 'taseron'
  ), false)
$$;

-- Satırın kendi alanlarıyla karar verilir; yeni eklenen satır da hemen görünür.
create policy okur on public.taseronlar for select to authenticated
  using (
    firma_id = public.benim_firma()
    and (
      public.benim_rol() in ('merkez', 'personel', 'satinalma')
      or (public.benim_rol() = 'taseron'
          and (id = (public.benim_profil()).taseron_id or ust_taseron_id = (public.benim_profil()).taseron_id))
      or (public.benim_rol() = 'sef' and id in (select public.gorunur_taseronlar()))
    )
  );
-- Taşeron ekleme: merkez tarafında "taşeronlar" düzenleme yetkisi olanlar;
-- ya da alt taşeron tanımlama yetkisi verilmiş ana taşeron, yalnızca kendi altına.
create policy ekler on public.taseronlar for insert to authenticated
  with check (
    (public.benim_rol() <> 'taseron' and public.yetkili('taseronlar', true)
     and (ust_taseron_id is null or ust_taseron_id in (select public.gorunur_taseronlar())))
    or (
      public.benim_rol() = 'taseron'
      and ust_taseron_id = (public.benim_profil()).taseron_id
      and public.alt_taseron_acabilir()
    )
  );
create policy duzenler on public.taseronlar for update to authenticated
  using (
    id in (select public.gorunur_taseronlar())
    and public.benim_rol() <> 'taseron'
    and public.yetkili('taseronlar', true)
  );

-- Profiller: firma içindeki isimler herkese görünür (kaydı kim girdi).
-- Kullanıcı oluşturma sunucuda yönetici anahtarıyla yapılır.
create policy okur on public.profiller for select to authenticated
  using (firma_id = public.benim_firma());

create policy okur on public.kullanici_santiye for select to authenticated
  using (kullanici_id = auth.uid() or public.benim_rol() = 'merkez');
create policy merkez_yazar on public.kullanici_santiye for all to authenticated
  using (public.benim_rol() = 'merkez'
         and santiye_id in (select public.erisilen_santiyeler()))
  with check (public.benim_rol() = 'merkez'
              and santiye_id in (select public.erisilen_santiyeler()));

create policy okur on public.sozlesmeler for select to authenticated
  using (public.kayit_okunur(firma_id, santiye_id, taseron_id, 'sozlesme'));
create policy ekler on public.sozlesmeler for insert to authenticated
  with check (
    public.benim_rol() <> 'taseron'
    and public.yetkili('taseronlar', true)
    and santiye_id in (select public.erisilen_santiyeler())
    and taseron_id in (select public.gorunur_taseronlar())
  );
create policy duzenler on public.sozlesmeler for update to authenticated
  using (
    public.benim_rol() <> 'taseron'
    and public.yetkili('taseronlar', true)
    and santiye_id in (select public.erisilen_santiyeler())
    and taseron_id in (select public.gorunur_taseronlar())
  );

create policy okur on public.yetkiler for select to authenticated
  using (
    firma_id = public.benim_firma()
    and (public.benim_rol() = 'merkez'
         or kullanici_id = auth.uid()
         or taseron_id = (public.benim_profil()).taseron_id)
  );
create policy merkez_yazar on public.yetkiler for all to authenticated
  using (firma_id = public.benim_firma() and public.benim_rol() = 'merkez')
  with check (
    public.benim_rol() = 'merkez'
    and (kullanici_id in (select id from public.profiller)
         or taseron_id in (select public.gorunur_taseronlar()))
  );

create policy okur on public.gunlukler for select to authenticated
  using (public.kayit_okunur(firma_id, santiye_id, taseron_id, 'gunluk'));
create policy ekler on public.gunlukler for insert to authenticated
  with check (public.kayit_yazilir(public.benim_firma(), santiye_id, taseron_id, 'gunluk'));
create policy duzenler on public.gunlukler for update to authenticated
  using (public.kayit_yazilir(firma_id, santiye_id, taseron_id, 'gunluk'));

create policy okur on public.hatali_isler for select to authenticated
  using (public.kayit_okunur(firma_id, santiye_id, taseron_id, 'hatali'));
-- Hatalı işi merkez tarafı bildirir; taşeron kendi hakkında bildirim açmaz.
create policy ekler on public.hatali_isler for insert to authenticated
  with check (public.benim_rol() <> 'taseron'
              and public.kayit_yazilir(public.benim_firma(), santiye_id, taseron_id, 'hatali'));
create policy duzenler on public.hatali_isler for update to authenticated
  using (public.kayit_yazilir(firma_id, santiye_id, taseron_id, 'hatali'));

create policy okur on public.talepler for select to authenticated
  using (public.kayit_okunur(firma_id, santiye_id, taseron_id, 'talep'));
create policy ekler on public.talepler for insert to authenticated
  with check (public.kayit_yazilir(public.benim_firma(), santiye_id, taseron_id, 'talep'));
create policy duzenler on public.talepler for update to authenticated
  using (public.kayit_yazilir(firma_id, santiye_id, taseron_id, 'talep'));

-- Teslimat takvimi ortak ekrandır: şantiyeye erişen herkes saatlerin dolu
-- olduğunu görür, ama başka taşeronun teslimatının ayrıntısını göremez
-- (bkz. teslimat_yogunluk). Tam satırı yalnızca kendi kapsamı görür.
create policy okur on public.teslimatlar for select to authenticated
  using (public.kayit_okunur(firma_id, santiye_id, taseron_id, 'teslimat'));
create policy ekler on public.teslimatlar for insert to authenticated
  with check (public.kayit_yazilir(public.benim_firma(), santiye_id, taseron_id, 'teslimat'));
create policy duzenler on public.teslimatlar for update to authenticated
  using (public.kayit_yazilir(firma_id, santiye_id, taseron_id, 'teslimat'));
create policy siler on public.teslimatlar for delete to authenticated
  using (public.kayit_yazilir(firma_id, santiye_id, taseron_id, 'teslimat'));

create policy okur on public.hareketler for select to authenticated
  using (
    firma_id = public.benim_firma()
    and (
      (kayit_turu = 'hatali' and kayit_id in (select id from public.hatali_isler))
      or (kayit_turu = 'talep' and kayit_id in (select id from public.talepler))
    )
  );

-- Yoğunluk ekranı: bir şantiyede bir günün saat başına teslimat sayısı.
-- Taşeron başka taşeronun adını görmez, yalnızca o saatin dolu olduğunu görür.
create function public.teslimat_yogunluk(p_santiye uuid, p_tarih date)
returns table (saat smallint, adet bigint)
language sql stable security definer set search_path = ''
as $$
  select t.saat, count(*)
  from public.teslimatlar t
  where t.santiye_id = p_santiye
    and t.tarih = p_tarih
    and t.firma_id = public.benim_firma()
    and p_santiye in (select public.erisilen_santiyeler())
    and public.yetkili('teslimat', false)
  group by t.saat
$$;

-- Gecikme uyarısı: bitişi geçmiş veya 7 gün içinde dolacak, tamamlanmamış
-- sözleşmeler. Görünüm çağıranın yetkileriyle çalışır.
create view public.gecikmeler with (security_invoker = true) as
  select so.id as sozlesme_id, so.taseron_id, so.santiye_id, so.bitis_hesap,
         so.bitis_hesap - (now() at time zone 'Europe/Istanbul')::date as kalan_gun
  from public.sozlesmeler so
  where not so.tamamlandi
    and so.bitis_hesap <= (now() at time zone 'Europe/Istanbul')::date + 7;

-- ---------------------------------------------------------------------------
-- Dosya deposu: fotoğraflar ve sözleşme belgeleri
--
-- Kova özeldir. Yükleme yalnızca kullanıcının kendi firma klasörüne yapılır.
-- Okuma için doğrudan izin yoktur: sunucu, satırı RLS ile okuyabilen
-- kullanıcıya süreli imzalı adres üretir.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('dosyalar', 'dosyalar', false, 10485760,
        array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do nothing;

create policy firma_klasorune_yukler on storage.objects for insert to authenticated
  with check (
    bucket_id = 'dosyalar'
    and (storage.foldername(name))[1] = public.benim_firma()::text
  );

-- Bir şantiyede çalışan ve kullanıcının görebildiği taşeronlar. Sözleşme
-- sayfasını görme yetkisinden bağımsızdır: günlük girmek için taşeron
-- listesini görmek gerekir, sözleşme ayrıntısını görmek gerekmez.
-- Alt taşeron, ana taşeronun sözleşmesi olan şantiyede de listelenir.
create function public.santiye_taseronlari(p_santiye uuid)
returns table (id uuid, firma_adi text, is_turu text, ust_taseron_id uuid, gecikme integer)
language sql stable security definer set search_path = ''
as $$
  select t.id, t.firma_adi, t.is_turu, t.ust_taseron_id,
         (select min(so2.bitis_hesap - (now() at time zone 'Europe/Istanbul')::date)
            from public.sozlesmeler so2
           where so2.taseron_id in (t.id, t.ust_taseron_id)
             and so2.santiye_id = p_santiye
             and not so2.tamamlandi)::integer
  from public.taseronlar t
  where t.aktif
    and t.id in (select public.gorunur_taseronlar())
    and p_santiye in (select public.erisilen_santiyeler())
    and exists (
      select 1 from public.sozlesmeler so
      where so.santiye_id = p_santiye
        and (so.taseron_id = t.id or so.taseron_id = t.ust_taseron_id)
    )
  order by t.firma_adi
$$;

-- ---------------------------------------------------------------------------
-- Erişim hakları
--
-- Yeni Supabase projelerinde tablolar Data API'ye kendiliğinden açılmayabilir.
-- Haklar açıkça verilir; satırları yine RLS süzer. Girişsiz ziyaretçi (anon)
-- hiçbir tabloya erişemez.
-- ---------------------------------------------------------------------------

revoke all on all tables in schema public from anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
revoke execute on all functions in schema public from anon, public;
grant execute on all functions in schema public to authenticated, service_role;
