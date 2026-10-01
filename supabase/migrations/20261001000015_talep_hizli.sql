-- Göç 15: talep sadeleşti; "kimin için" yazılabilir, termin eklendi (1 Ekim).
--
-- Kullanıcı kararları:
-- - Talep yine birine ait olmak zorunda, ama listedeki taşeron yerine elle
--   yazılmış bir ad da olabilir ("Merkez şantiye", "Sait Bey (sıvacı)").
--   Yazılı ad yeni taşeron kaydı açmaz; yalnız talebin üstünde durur ve
--   o şantiyenin sonraki taleplerinde "Daha önce yazılanlar"da çıkar.
-- - Yazılı adla açılan talebi şantiye tarafı görür; taşeron hesapları görmez
--   ve yazılı ad giremez (yalnız kendi firmasını / alt taşeronunu seçer).
-- - Termin (ne zaman lazım) isteğe bağlı; boşsa "belli değil".
-- Yalnız ekleme yapar; eski sürüm de bu yapıyla çalışır. Tekrar
-- çalıştırılırsa zarar vermez.

alter table public.talepler add column if not exists taseron_adi text
  check (char_length(taseron_adi) between 2 and 80);
alter table public.talepler add column if not exists termin date;
alter table public.talepler alter column taseron_id drop not null;
alter table public.talepler drop constraint if exists talep_kimin_icin;
alter table public.talepler add constraint talep_kimin_icin
  check ((taseron_id is null) <> (taseron_adi is null));

-- Talebi görmek: taşerona bağlıysa eskisi gibi; yazılı adlıysa taşeron
-- hesabı dışındaki herkes (şantiyeye erişen, talep sayfası açık olan).
create or replace function public.talep_okunur(f uuid, santiye uuid, taseron uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select f = public.benim_firma()
     and santiye in (select public.erisilen_santiyeler())
     and public.yetkili('talep', false)
     and (
       (taseron is not null and taseron in (select public.gorunur_taseronlar()))
       or (taseron is null and public.benim_rol() <> 'taseron')
     )
$$;
revoke execute on function public.talep_okunur(uuid, uuid, uuid) from anon, public;
grant execute on function public.talep_okunur(uuid, uuid, uuid) to authenticated, service_role;

drop policy if exists okur on public.talepler;
create policy okur on public.talepler for select to authenticated
  using (public.talep_okunur(firma_id, santiye_id, taseron_id));

drop policy if exists ekler on public.talepler;
create policy ekler on public.talepler for insert to authenticated
  with check (public.talep_okunur(public.benim_firma(), santiye_id, taseron_id) and public.yetkili('talep', true));

drop policy if exists duzenler on public.talepler;
create policy duzenler on public.talepler for update to authenticated
  using (public.talep_okunur(firma_id, santiye_id, taseron_id) and public.yetkili('talep', true));

drop policy if exists siler on public.talepler;
create policy siler on public.talepler for delete to authenticated
  using (
    public.talep_okunur(firma_id, santiye_id, taseron_id)
    and public.icerik_degisebilir(olusturan, olusturma, durum = 'acildi')
  );

-- Göç 8'deki kural aynen; içerik karşılaştırmasına yazılı ad ve termin girdi.
create or replace function public.talep_guncelle()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  new.firma_id := old.firma_id;
  new.santiye_id := old.santiye_id;
  new.olusturan := old.olusturan;
  new.olusturma := old.olusturma;
  if (new.urun, new.miktar, new.birim, new.notu, new.fotograflar, new.taseron_id, new.taseron_adi, new.termin)
     is distinct from
     (old.urun, old.miktar, old.birim, old.notu, old.fotograflar, old.taseron_id, old.taseron_adi, old.termin) then
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

notify pgrst, 'reload schema';
