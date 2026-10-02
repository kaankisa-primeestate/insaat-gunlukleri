-- Göç 17: telefon bildirimleri (push), A5 / G4 (2 Ekim).
--
-- Kullanıcı kararları:
-- - Bildirim gider: yeni hatalı iş → işin taşeronu (ve ana taşeronu) ya da
--   sorumlu kişi; hatalı işe revizyon / durum değişikliği → bildiren ve işin
--   taşeronu; yeni karar / karar revizyonu → muhataplar; yeni talep → satın
--   alma; talep durumu → talebi açan. Günlük ve depo bildirim üretmez.
-- - Merkez hepsini alır; herkes istediği bildirim türünü kapatabilir.
-- - Sessiz saatler (varsayılan 20:00–07:00): bildirim düşer, ses ve titreşim
--   olmaz. Kendi yaptığın işlemin bildirimi sana gelmez.
-- Tekrar çalıştırılırsa zarar vermez.

-- Sunucunun gizli ayarları (bildirim anahtarları). Kural yok: yalnız sunucu
-- (gizli anahtarla) okur ve yazar; tarayıcıdan hiç erişilemez.
create table if not exists public.sistem_ayarlari (
  anahtar text primary key,
  deger text not null
);
alter table public.sistem_ayarlari enable row level security;

-- Bir telefonun bildirim aboneliği. Aynı telefon başka kullanıcıyla
-- girilirse abonelik yeni kullanıcıya geçer (sunucu yazar).
create table if not exists public.bildirim_abonelikleri (
  id uuid primary key default gen_random_uuid(),
  kullanici_id uuid not null references public.profiller(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  cihaz text check (char_length(cihaz) <= 120),
  olusturma timestamptz not null default now()
);
create index if not exists bildirim_abonelikleri_kullanici_idx on public.bildirim_abonelikleri (kullanici_id);
alter table public.bildirim_abonelikleri enable row level security;

drop policy if exists okur on public.bildirim_abonelikleri;
create policy okur on public.bildirim_abonelikleri for select to authenticated
  using (kullanici_id = auth.uid());
drop policy if exists siler on public.bildirim_abonelikleri;
create policy siler on public.bildirim_abonelikleri for delete to authenticated
  using (kullanici_id = auth.uid());

-- Kişinin tercihleri: kapattığı bildirim türleri ve sessiz saatler.
create table if not exists public.bildirim_tercihleri (
  kullanici_id uuid primary key references public.profiller(id) on delete cascade,
  kapali text[] not null default '{}',
  sessiz boolean not null default true,
  sessiz_bas smallint not null default 20 check (sessiz_bas between 0 and 23),
  sessiz_bit smallint not null default 7 check (sessiz_bit between 0 and 23)
);
alter table public.bildirim_tercihleri enable row level security;

drop policy if exists okur on public.bildirim_tercihleri;
create policy okur on public.bildirim_tercihleri for select to authenticated
  using (kullanici_id = auth.uid());
drop policy if exists ekler on public.bildirim_tercihleri;
create policy ekler on public.bildirim_tercihleri for insert to authenticated
  with check (kullanici_id = auth.uid());
drop policy if exists duzenler on public.bildirim_tercihleri;
create policy duzenler on public.bildirim_tercihleri for update to authenticated
  using (kullanici_id = auth.uid());

notify pgrst, 'reload schema';
