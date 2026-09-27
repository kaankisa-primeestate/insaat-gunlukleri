-- Göç 7: hava durumu (A3).
--
-- Şantiyeye konum: hava durumu bu noktadan alınır. Merkez, Yönetim >
-- Şantiyeler'den ilçe arayarak ya da şantiyedeyken telefonun konumuyla girer.
alter table public.santiyeler
  add column if not exists enlem double precision check (enlem between -90 and 90),
  add column if not exists boylam double precision check (boylam between -180 and 180),
  add column if not exists konum_adi text check (char_length(konum_adi) <= 120);

-- Her şantiyenin her günü için tek hava kaydı. Günlükler bu kayda tarihle
-- bağlanır; aynı günün beş günlüğü beş ayrı hava değeri taşımaz.
-- Kaydı yalnızca sunucu (gizli anahtarla) yazar: kullanıcı hava değerini
-- değiştiremez, kayıt tartışmada delil olarak kalır.
-- kesin = gün bittikten sonra alınmış değer; bugünün kaydı tahmindir ve
-- ertesi gün kesin değerle yenilenir.
create table if not exists public.hava_durumu (
  santiye_id uuid not null references public.santiyeler(id) on delete cascade,
  firma_id uuid not null references public.firmalar(id) on delete cascade,
  tarih date not null,
  kod smallint not null,
  en_yuksek numeric(4, 1),
  en_dusuk numeric(4, 1),
  yagis numeric(5, 1),
  ruzgar numeric(5, 1),
  kesin boolean not null default false,
  guncelleme timestamptz not null default now(),
  primary key (santiye_id, tarih)
);

alter table public.hava_durumu enable row level security;

drop policy if exists okur on public.hava_durumu;
create policy okur on public.hava_durumu for select to authenticated
  using (firma_id = public.benim_firma() and santiye_id in (select public.erisilen_santiyeler()));

grant select on public.hava_durumu to authenticated;
grant all on public.hava_durumu to service_role;

notify pgrst, 'reload schema';
