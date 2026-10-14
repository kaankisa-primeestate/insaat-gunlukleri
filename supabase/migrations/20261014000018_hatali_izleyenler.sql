-- Pilot geri bildirimi: hatalı işte "kimin işi" (tamiri yapacak taşeron/kişi)
-- zaten seçilebiliyordu; ayrıca işi takip edecek diğer kişiler (şantiye
-- şefi, kalfa…) seçilebilsin istendi. Bunlar "sorumlu"dan ayrı: işi
-- düzeltmekle yükümlü değiller, yalnız bilgilendiriliyor/izliyorlar.
--
-- Yalnızca ekleme yapar; eski kayıtlar etkilenmez (izleyenler boş dizi).

alter table public.hatali_isler add column if not exists izleyenler uuid[] not null default '{}';

alter table public.hatali_isler drop constraint if exists hatali_izleyenler_siniri;
alter table public.hatali_isler add constraint hatali_izleyenler_siniri
  check (cardinality(izleyenler) <= 10);

-- İzleyenler yalnız taşeron olamaz (yalnız şirket personeli): "sorumlu
-- kullanıcı" ile aynı aday listesinden (santiye_personeli) seçilir. Kural
-- yalnız eklemede denetlenir; "sorumlu kullanıcı" da aynı şekilde yalnız
-- eklemede denetleniyor (bkz. coklu_secim_ve_sorumlu.sql).
drop policy if exists ekler on public.hatali_isler;
create policy ekler on public.hatali_isler for insert to authenticated
  with check (
    public.benim_rol() <> 'taseron'
    and public.hata_okunur(public.benim_firma(), santiye_id, taseron_id)
    and public.yetkili('hatali', true)
    and (sorumlu_kullanici_id is null
         or sorumlu_kullanici_id in (select sp.id from public.santiye_personeli(santiye_id) sp))
    and (cardinality(izleyenler) = 0
         or izleyenler <@ (select coalesce(array_agg(sp.id), '{}'::uuid[]) from public.santiye_personeli(santiye_id) sp))
  );

-- Taşeron işi düzenlerken (yalnız "Düzeltiliyor" diyebilir) izleyenleri
-- değiştiremez; diğer kilitli alanlarla aynı kural.
create or replace function public.hatali_guncelle()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  new.firma_id := old.firma_id;
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
    new.izleyenler := old.izleyenler;
    new.santiye_id := old.santiye_id;
    new.is_tarihi := old.is_tarihi;
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
