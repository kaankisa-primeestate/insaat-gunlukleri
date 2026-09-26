-- Pilot geri bildirimi: günlükte birden çok kat ve iş, taşerona birden çok
-- yetkili, hatalı işin bir kullanıcıya (kalfa, şef) yazılabilmesi.
--
-- Yalnızca ekleme yapar; eski alanlar (kat, is_kalemi, yetkili, telefon)
-- silinmez. Böylece bu dosya çalıştırıldığı an yayındaki eski program da
-- çalışmaya devam eder. Tekrar çalıştırılırsa zarar vermez.

-- Günlük: birden çok kat ve iş kalemi --------------------------------------

alter table public.gunlukler add column if not exists katlar text[] not null default '{}';
alter table public.gunlukler add column if not exists is_kalemleri text[] not null default '{}';
update public.gunlukler set katlar = array[kat] where kat is not null and cardinality(katlar) = 0;
update public.gunlukler set is_kalemleri = array[is_kalemi] where is_kalemi is not null and cardinality(is_kalemleri) = 0;

alter table public.gunlukler drop constraint if exists gunluk_secim_siniri;
alter table public.gunlukler add constraint gunluk_secim_siniri
  check (cardinality(katlar) <= 100 and cardinality(is_kalemleri) <= 30);

-- Taşeron: birden çok yetkili ([{ "ad": "...", "telefon": "..." }]) --------

alter table public.taseronlar add column if not exists yetkililer jsonb not null default '[]';
update public.taseronlar
   set yetkililer = jsonb_build_array(jsonb_build_object('ad', coalesce(yetkili, ''), 'telefon', coalesce(telefon, '')))
 where (yetkili is not null or telefon is not null) and yetkililer = '[]'::jsonb;

alter table public.taseronlar drop constraint if exists yetkililer_siniri;
alter table public.taseronlar add constraint yetkililer_siniri
  check (jsonb_typeof(yetkililer) = 'array' and jsonb_array_length(yetkililer) <= 10);

-- Hatalı iş: taşeron YA DA kullanıcı sorumlu olabilir -----------------------
-- Anayasada taşeron zorunluydu; kullanıcı kalfa ve şefe de iş yazılabilmesini
-- istedi. Kural: ikisinden biri mutlaka seçilir.

alter table public.hatali_isler alter column taseron_id drop not null;
alter table public.hatali_isler add column if not exists sorumlu_kullanici_id uuid
  references public.profiller(id);
create index if not exists hatali_isler_sorumlu_idx on public.hatali_isler (sorumlu_kullanici_id);

alter table public.hatali_isler drop constraint if exists hatali_sorumlu_tek;
alter table public.hatali_isler add constraint hatali_sorumlu_tek
  check ((taseron_id is null) <> (sorumlu_kullanici_id is null));

-- Okuma: taşerona yazılan iş eskisi gibi; kişiye yazılan işi taşeronlar
-- göremez, şantiyeye erişen merkez tarafı görür.
create or replace function public.hata_okunur(f uuid, santiye uuid, taseron uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select f = public.benim_firma()
     and santiye in (select public.erisilen_santiyeler())
     and public.yetkili('hatali', false)
     and (
       (taseron is not null and taseron in (select public.gorunur_taseronlar()))
       or (taseron is null and public.benim_rol() <> 'taseron')
     )
$$;

-- Kullanıcının bu şantiyede sorumlu tutulabilecek personel: merkez, merkez
-- personeli, satın alma ve bu şantiyeye atanmış şefler.
create or replace function public.santiye_personeli(p_santiye uuid)
returns table (id uuid, ad_soyad text, rol public.rol)
language sql stable security definer set search_path = ''
as $$
  select p.id, p.ad_soyad, p.rol
  from public.profiller p
  where p.aktif
    and p.firma_id = public.benim_firma()
    and public.benim_rol() <> 'taseron'
    and p_santiye in (select public.erisilen_santiyeler())
    and (
      p.rol in ('merkez', 'personel', 'satinalma')
      or (p.rol = 'sef' and exists (
        select 1 from public.kullanici_santiye ks where ks.kullanici_id = p.id and ks.santiye_id = p_santiye))
    )
  order by p.ad_soyad
$$;

drop policy if exists okur on public.hatali_isler;
drop policy if exists ekler on public.hatali_isler;
drop policy if exists duzenler on public.hatali_isler;

create policy okur on public.hatali_isler for select to authenticated
  using (public.hata_okunur(firma_id, santiye_id, taseron_id));

create policy ekler on public.hatali_isler for insert to authenticated
  with check (
    public.benim_rol() <> 'taseron'
    and public.hata_okunur(public.benim_firma(), santiye_id, taseron_id)
    and public.yetkili('hatali', true)
    and (sorumlu_kullanici_id is null
         or sorumlu_kullanici_id in (select sp.id from public.santiye_personeli(santiye_id) sp))
  );

create policy duzenler on public.hatali_isler for update to authenticated
  using (public.hata_okunur(firma_id, santiye_id, taseron_id) and public.yetkili('hatali', true));

-- Durum kuralları: taşeron onaylayamaz (eskisi gibi); işi üzerine alan kişi
-- de kendi işini onaylayamaz, onayı başkası verir.
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

revoke execute on function public.hata_okunur(uuid, uuid, uuid) from anon, public;
grant execute on function public.hata_okunur(uuid, uuid, uuid) to authenticated, service_role;
revoke execute on function public.santiye_personeli(uuid) from anon, public;
grant execute on function public.santiye_personeli(uuid) to authenticated, service_role;

notify pgrst, 'reload schema';
