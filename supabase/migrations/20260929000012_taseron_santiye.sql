-- Göç 12: taşeron sayfası sadeleşti; şantiye ve süre aynı sayfada (29 Eylül).
--
-- Kullanıcı kararları:
-- - Süre zorunlu, ama bitişi henüz belli olmayan iş için "süre henüz belli
--   değil" seçilebilir. Bu sözleşmede bitiş tarihi boştur, gecikme uyarısı
--   çalışmaz; süre sonradan girilir.
-- - Taşeron şantiyeden çıkarılınca sözleşme silinmez, "iş bitti" olarak
--   kapanır. Hiçbir sözleşme silinmez; geçmiş kayıtlar kalır.
-- - İşi biten taşeron o şantiyenin seçim listelerinde kalmaya devam eder:
--   sözleşme biter ama eksik/hatalı işteki sorumluluğu sürer (30 Eylül).
-- Tekrar çalıştırılırsa zarar vermez.

alter table public.sozlesmeler add column if not exists sure_belirsiz boolean not null default false;

alter table public.sozlesmeler drop constraint if exists sozlesmeler_check;
alter table public.sozlesmeler drop constraint if exists sozlesme_suresi;
alter table public.sozlesmeler add constraint sozlesme_suresi check (
  sure_belirsiz
  or bitis is not null
  or (yer_teslim is not null and sure_gun is not null)
);

-- Sözleşme silinmez (kullanıcı kararı); yanlış girilen düzeltilir,
-- biten iş "iş bitti" olarak kapanır.
drop policy if exists siler on public.sozlesmeler;

-- Seçim listelerindeki taşeronlar: bu şantiyede sözleşmesi olan (işi bitmiş
-- olsa da) her taşeron; alt taşeron için ana taşeronun sözleşmesi. Göç 12'nin
-- ilk hâli işi bitenleri listeden düşürüyordu; kullanıcı istemedi, bu tanım
-- göç 2'dekinin aynısıdır ve o hâl çalıştırıldıysa onu geri alır.
create or replace function public.santiye_taseronlari(p_santiye uuid)
returns table (id uuid, firma_adi text, is_turleri text[], ust_taseron_id uuid, gecikme integer)
language sql stable security definer set search_path = ''
as $$
  select t.id, t.firma_adi, t.is_turleri, t.ust_taseron_id,
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

-- Taşeron silme yalnız hiç kaydı yoksa (yanlış açılmış taşeron). Karar
-- Defteri'nde adı geçen taşeron da silinmez.
create or replace function public.taseron_sil(p_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  t public.taseronlar;
begin
  select * into t from public.taseronlar where id = p_id;
  if t.id is null or t.firma_id <> public.benim_firma() then
    raise exception 'Taşeron bulunamadı.' using errcode = 'P0001';
  end if;
  if public.benim_rol() = 'taseron' or not public.yetkili('taseronlar', true) then
    raise exception 'Taşeron silme yetkiniz yok.' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.gunlukler where taseron_id = p_id)
     or exists (select 1 from public.hatali_isler where taseron_id = p_id)
     or exists (select 1 from public.talepler where taseron_id = p_id)
     or exists (select 1 from public.teslimatlar where taseron_id = p_id)
     or exists (select 1 from public.karar_muhataplari where taseron_id = p_id)
     or exists (select 1 from public.kararlar where olusturan_taseron = p_id) then
    raise exception 'Bu taşeronun kayıtları var, silinemez. Pasife alabilirsiniz.' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.taseronlar where ust_taseron_id = p_id) then
    raise exception 'Bu taşeronun alt taşeronları var, önce onları kaldırın.' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.profiller where taseron_id = p_id) then
    raise exception 'Bu taşeronun giriş hesabı var. Önce hesabı kapatın ya da taşeronu pasife alın.' using errcode = 'P0001';
  end if;
  delete from public.taseronlar where id = p_id;
end
$$;

notify pgrst, 'reload schema';
