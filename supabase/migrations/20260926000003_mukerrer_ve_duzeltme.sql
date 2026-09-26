-- Mükerrer kayıt önlemleri ve yanlış girilen kayıtların düzeltilmesi.
--
-- Arayüz de denetler, ama asıl kural burada: iki telefon aynı anda
-- kaydetse bile ikinci kayıt reddedilir.

-- Firma adını karşılaştırmak için sadeleştirir: Türkçe harfler, büyük/küçük
-- harf, boşluk ve noktalama fark yaratmaz ("Demir Elektrik" = "DEMİR  elektrik.").
create or replace function public.ad_anahtari(t text)
returns text
language sql immutable
as $$
  select regexp_replace(
    lower(translate(coalesce(t, ''), 'İIıŞşÇçĞğÜüÖö', 'iiissccgguuoo')),
    '[^a-z0-9]', '', 'g')
$$;

-- Aynı firmada aynı adla ya da aynı vergi numarasıyla ikinci taşeron açılamaz.
-- security definer: denetim, kullanıcının göremediği taşeronları da kapsasın.
create or replace function public.taseron_mukerrer()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  mevcut text;
begin
  select t.firma_adi into mevcut from public.taseronlar t
  where t.firma_id = new.firma_id
    and t.id <> new.id
    and (
      public.ad_anahtari(t.firma_adi) = public.ad_anahtari(new.firma_adi)
      or (nullif(trim(new.vergi_no), '') is not null and trim(t.vergi_no) = trim(new.vergi_no))
    )
  limit 1;
  if mevcut is not null then
    raise exception 'Bu taşeron zaten kayıtlı: %', mevcut using errcode = 'P0001';
  end if;
  return new;
end
$$;

drop trigger if exists taseron_mukerrer on public.taseronlar;
create trigger taseron_mukerrer before insert or update of firma_adi, vergi_no on public.taseronlar
  for each row execute function public.taseron_mukerrer();

-- Bir taşeronun bir şantiyede tek sözleşmesi olur; yanlışsa düzenlenir.
create or replace function public.sozlesme_mukerrer()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if exists (
    select 1 from public.sozlesmeler s
    where s.taseron_id = new.taseron_id and s.santiye_id = new.santiye_id and s.id <> new.id
  ) then
    raise exception 'Bu taşeronun bu şantiyede zaten sözleşmesi var; yenisini eklemek yerine onu düzenleyin.'
      using errcode = 'P0001';
  end if;
  return new;
end
$$;

drop trigger if exists sozlesme_mukerrer on public.sozlesmeler;
create trigger sozlesme_mukerrer before insert or update of taseron_id, santiye_id on public.sozlesmeler
  for each row execute function public.sozlesme_mukerrer();

-- Yanlış açılmış sözleşme silinebilir (merkez tarafında taşeron düzenleme
-- yetkisi olanlar). Günlük ve diğer kayıtlar sözleşmeye değil taşerona bağlı
-- olduğu için silinmez.
drop policy if exists siler on public.sozlesmeler;
create policy siler on public.sozlesmeler for delete to authenticated
  using (
    public.benim_rol() <> 'taseron'
    and public.yetkili('taseronlar', true)
    and santiye_id in (select public.erisilen_santiyeler())
    and taseron_id in (select public.gorunur_taseronlar())
  );

-- Taşeron silme: yalnızca hiç kaydı yoksa (mükerrer ya da yanlış açılmış
-- kayıt). Kaydı olan taşeron silinmez, pasife alınır; geçmiş kaybolmasın.
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
     or exists (select 1 from public.teslimatlar where taseron_id = p_id) then
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

revoke execute on function public.taseron_sil(uuid) from anon, public;
grant execute on function public.taseron_sil(uuid) to authenticated, service_role;
revoke execute on function public.ad_anahtari(text) from anon, public;
grant execute on function public.ad_anahtari(text) to authenticated, service_role;

notify pgrst, 'reload schema';
