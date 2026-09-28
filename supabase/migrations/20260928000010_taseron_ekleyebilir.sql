-- Göç 10: taşeron de kayıt ekler (kullanıcı kararı, 28 Eylül).
--
-- Önceden taşeron günlüğü yalnız görüyor, hatalı iş hiç bildiremiyordu
-- (anayasa: hatayı şef bildirir). Kullanıcı taşeronun da günlük, hatalı iş,
-- talep, teslimat ekleyebilmesini istedi.
-- Sınırlar: taşeron yalnız kendi firmasına ve kendi alt taşeronuna kayıt
-- açar, personele (kalfa, şef) iş yazamaz, hatalı işi onaylayamaz.
-- Merkez, firmanın "Yetki" sekmesinden bunu yine kısabilir.
-- Tekrar çalıştırılırsa zarar vermez.

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
      else not duzen end
    when 'taseron' then case s
      when 'sozlesme' then not duzen
      when 'taseronlar' then false
      else true end
  end
$$;

-- Hatalı iş ekleme: taşeron de ekler, ama kişiye iş yazamaz. Kimin işi
-- olduğu hata_okunur ile denetlenir: taşeron yalnız kendini ve alt
-- taşeronunu görür.
drop policy if exists ekler on public.hatali_isler;
create policy ekler on public.hatali_isler for insert to authenticated
  with check (
    public.hata_okunur(public.benim_firma(), santiye_id, taseron_id)
    and public.yetkili('hatali', true)
    and (
      sorumlu_kullanici_id is null
      or (public.benim_rol() <> 'taseron'
          and sorumlu_kullanici_id in (select sp.id from public.santiye_personeli(santiye_id) sp))
    )
  );

-- Taşeron kendi açtığı kaydın içeriğini (24 saat / "Tespit" kuralıyla)
-- düzeltebilir; başkasının açtığı kayıtta yalnız durumu değiştirir.
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
    new.sorumlu_kullanici_id := old.sorumlu_kullanici_id;
    if old.olusturan is distinct from auth.uid() then
      new.aciklama := old.aciklama;
      new.onem := old.onem;
      new.fotograflar := old.fotograflar;
      new.taseron_id := old.taseron_id;
      new.kat := old.kat;
      new.is_tarihi := old.is_tarihi;
    end if;
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

notify pgrst, 'reload schema';
