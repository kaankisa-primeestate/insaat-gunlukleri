-- Göç 8: hatalı iş ve talep düzeltme / silme (D2).
--
-- Kural günlükle aynı, bir farkla: merkez her zaman; kaydı giren kişi
-- 24 saat içinde VE kayıt henüz işlem görmediyse (hatalı iş "Tespit",
-- talep "Açıldı"). Taşeron işe başladıktan ya da satın alma yapıldıktan
-- sonra içeriği değişen kayıt tartışma çıkarır; o noktadan sonra yalnız
-- merkez düzeltir. Durum ilerletme bu kurala girmez, eskisi gibi çalışır.
-- Tekrar çalıştırılırsa zarar vermez.

alter table public.hatali_isler add column if not exists duzenleme timestamptz;
alter table public.hatali_isler add column if not exists duzenleyen uuid references public.profiller(id);
alter table public.talepler add column if not exists duzenleme timestamptz;
alter table public.talepler add column if not exists duzenleyen uuid references public.profiller(id);

create or replace function public.icerik_degisebilir(p_olusturan uuid, p_olusturma timestamptz, p_ilk_durumda boolean)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select public.benim_rol() = 'merkez'
      or (p_olusturan = auth.uid() and p_olusturma > now() - interval '24 hours' and p_ilk_durumda)
$$;
revoke execute on function public.icerik_degisebilir(uuid, timestamptz, boolean) from anon, public;
grant execute on function public.icerik_degisebilir(uuid, timestamptz, boolean) to authenticated, service_role;

-- Hatalı iş: önceki kurallar aynen (taşeron onaylayamaz, kişi kendi işini
-- onaylayamaz) + içerik değişikliği denetimi ve "düzenlendi" damgası.
create or replace function public.hatali_guncelle()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  new.firma_id := old.firma_id;
  new.santiye_id := old.santiye_id;
  new.olusturan := old.olusturan;
  new.olusturma := old.olusturma;
  if public.benim_rol() = 'taseron' then
    if new.durum = 'onaylandi' and old.durum <> 'onaylandi' then
      raise exception 'Taşeron işi onaylayamaz' using errcode = 'P0001';
    end if;
    new.aciklama := old.aciklama;
    new.onem := old.onem;
    new.fotograflar := old.fotograflar;
    new.taseron_id := old.taseron_id;
    new.sorumlu_kullanici_id := old.sorumlu_kullanici_id;
    new.kat := old.kat;
    new.is_tarihi := old.is_tarihi;
  end if;
  if (new.aciklama, new.onem, new.fotograflar, new.taseron_id, new.sorumlu_kullanici_id, new.kat, new.is_tarihi)
     is distinct from
     (old.aciklama, old.onem, old.fotograflar, old.taseron_id, old.sorumlu_kullanici_id, old.kat, old.is_tarihi) then
    if not public.icerik_degisebilir(old.olusturan, old.olusturma, old.durum = 'tespit') then
      raise exception 'Bu kaydı düzeltme yetkiniz yok. Kaydı giren kişi 24 saat içinde ve iş "Tespit" durumundayken, merkez her zaman düzeltebilir.'
        using errcode = 'P0001';
    end if;
    new.duzenleme := now();
    new.duzenleyen := auth.uid();
  end if;
  if new.durum = 'onaylandi' and old.durum <> 'onaylandi'
     and old.sorumlu_kullanici_id is not null and old.sorumlu_kullanici_id = auth.uid() then
    raise exception 'Kendinize yazılan işi kendiniz onaylayamazsınız; onayı başka bir yetkili verir.'
      using errcode = 'P0001';
  end if;
  if new.durum is distinct from old.durum then
    new.guncelleme := now();
    insert into public.hareketler (firma_id, kayit_turu, kayit_id, durum)
    values (new.firma_id, 'hatali', new.id, new.durum::text);
  end if;
  return new;
end
$$;

-- Talep: taşeron durumu ilerletemez (eskisi gibi) + içerik denetimi.
create or replace function public.talep_guncelle()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  new.firma_id := old.firma_id;
  new.santiye_id := old.santiye_id;
  new.olusturan := old.olusturan;
  new.olusturma := old.olusturma;
  if (new.urun, new.miktar, new.birim, new.notu, new.fotograflar, new.taseron_id)
     is distinct from
     (old.urun, old.miktar, old.birim, old.notu, old.fotograflar, old.taseron_id) then
    if not public.icerik_degisebilir(old.olusturan, old.olusturma, old.durum = 'acildi') then
      raise exception 'Bu talebi düzeltme yetkiniz yok. Talebi açan kişi 24 saat içinde ve talep "Açıldı" durumundayken, merkez her zaman düzeltebilir.'
        using errcode = 'P0001';
    end if;
    new.duzenleme := now();
    new.duzenleyen := auth.uid();
  end if;
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

-- Silme: aynı kural.
drop policy if exists siler on public.hatali_isler;
create policy siler on public.hatali_isler for delete to authenticated
  using (
    public.hata_okunur(firma_id, santiye_id, taseron_id)
    and public.icerik_degisebilir(olusturan, olusturma, durum = 'tespit')
  );

drop policy if exists siler on public.talepler;
create policy siler on public.talepler for delete to authenticated
  using (
    public.kayit_okunur(firma_id, santiye_id, taseron_id, 'talep')
    and public.icerik_degisebilir(olusturan, olusturma, durum = 'acildi')
  );

-- Silinen kaydın durum geçmişi de silinir; sahipsiz satır kalmasın.
create or replace function public.hareket_temizle()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  delete from public.hareketler where kayit_turu = tg_argv[0] and kayit_id = old.id;
  return old;
end
$$;

drop trigger if exists hareket_temizle on public.hatali_isler;
create trigger hareket_temizle after delete on public.hatali_isler
  for each row execute function public.hareket_temizle('hatali');
drop trigger if exists hareket_temizle on public.talepler;
create trigger hareket_temizle after delete on public.talepler
  for each row execute function public.hareket_temizle('talep');

notify pgrst, 'reload schema';
