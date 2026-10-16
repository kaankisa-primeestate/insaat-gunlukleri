-- Kullanıcı isteği: merkez personeli ve satın alma rolündeki kullanıcıların
-- hangi şantiyeleri görebileceğine yönetici karar versin ("tüm şantiyeler"
-- ya da "yalnızca atandığı şantiye(ler)"). Mekanizma zaten şantiye şefi için
-- vardı (kullanici_santiye); aynı tablo personel/satınalma için de kullanılır.
--
-- Geriye dönük uyum: hiçbir satır atanmamışsa (bugüne kadarki tüm personel/
-- satınalma kullanıcıları gibi) davranış değişmez, tüm şantiyeler görünür.
-- Merkez hiçbir zaman kısıtlanamaz (anayasa). Şantiye şefinin davranışı
-- değişmedi: atanmamışsa hâlâ hiçbir şantiye görmez (bilerek atanması gerekir).

create or replace function public.erisilen_santiyeler()
returns setof uuid
language plpgsql stable security definer set search_path = ''
as $$
declare
  p public.profiller;
  atanan_sayisi int;
begin
  select * into p from public.profiller where id = auth.uid() and aktif;
  if p.id is null then return; end if;

  if p.rol = 'merkez' then
    return query select s.id from public.santiyeler s where s.firma_id = p.firma_id;
  elsif p.rol in ('personel', 'satinalma') then
    select count(*) into atanan_sayisi from public.kullanici_santiye ks where ks.kullanici_id = p.id;
    if atanan_sayisi = 0 then
      return query select s.id from public.santiyeler s where s.firma_id = p.firma_id;
    else
      return query select ks.santiye_id from public.kullanici_santiye ks where ks.kullanici_id = p.id;
    end if;
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

notify pgrst, 'reload schema';
