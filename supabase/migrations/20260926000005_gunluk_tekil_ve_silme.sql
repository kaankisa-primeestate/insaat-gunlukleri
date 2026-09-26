-- Günlük: aynı şantiyede aynı taşerona aynı gün ikinci günlük açılmaz (D1);
-- yanlış girilen günlük düzeltilebilir ve silinebilir (D2'nin günlük kısmı).
--
-- Kural tetikleyiciyle konur, tekil dizinle değil: yayındaki verilerde
-- mükerrer kayıt var ve tekil dizin onlar silinmeden kurulamaz. Tetikleyici
-- yalnızca yeni kayıtları denetler; mevcut mükerreri kullanıcı siler.
-- Tekrar çalıştırılırsa zarar vermez.

create or replace function public.gunluk_mukerrer()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if exists (
    select 1 from public.gunlukler g
    where g.santiye_id = new.santiye_id
      and g.taseron_id = new.taseron_id
      and g.is_tarihi = new.is_tarihi
      and g.id <> new.id
  ) then
    raise exception 'Bu taşeron için bu tarihte zaten günlük var; aynı gün ikinci günlük açılmaz.'
      using errcode = 'P0001';
  end if;
  return new;
end
$$;

drop trigger if exists gunluk_mukerrer on public.gunlukler;
create trigger gunluk_mukerrer before insert or update of santiye_id, taseron_id, is_tarihi on public.gunlukler
  for each row execute function public.gunluk_mukerrer();

-- Silme: merkez her zaman; kaydı giren kişi 24 saat içinde.
drop policy if exists siler on public.gunlukler;
create policy siler on public.gunlukler for delete to authenticated
  using (
    public.kayit_okunur(firma_id, santiye_id, taseron_id, 'gunluk')
    and (
      public.benim_rol() = 'merkez'
      or (olusturan = auth.uid() and olusturma > now() - interval '24 hours')
    )
  );

-- Düzenleme: aynı kural. Düzenlenen kayıtta kim ve ne zaman düzenlediği
-- tutulur; sonradan yapılan değişiklik gizli kalmasın.
alter table public.gunlukler add column if not exists guncelleme timestamptz;
alter table public.gunlukler add column if not exists guncelleyen uuid references public.profiller(id);

create or replace function public.gunluk_guncelle()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  new.firma_id := old.firma_id;
  new.olusturan := old.olusturan;
  new.olusturma := old.olusturma;
  new.guncelleme := now();
  new.guncelleyen := auth.uid();
  return new;
end
$$;

drop trigger if exists kimlik_koru on public.gunlukler;
drop trigger if exists gunluk_guncelle on public.gunlukler;
create trigger gunluk_guncelle before update on public.gunlukler
  for each row execute function public.gunluk_guncelle();

drop policy if exists duzenler on public.gunlukler;
create policy duzenler on public.gunlukler for update to authenticated
  using (
    public.kayit_okunur(firma_id, santiye_id, taseron_id, 'gunluk')
    and (
      public.benim_rol() = 'merkez'
      or (olusturan = auth.uid() and olusturma > now() - interval '24 hours')
    )
  )
  with check (public.kayit_okunur(firma_id, santiye_id, taseron_id, 'gunluk'));

notify pgrst, 'reload schema';
