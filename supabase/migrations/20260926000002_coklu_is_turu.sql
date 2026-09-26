-- Bir taşeron birden fazla iş yapabilir (ör. sıva + dış cephe + alçıpan).
-- Tek iş türü alanı diziye çevrilir; mevcut kayıtlar korunur.

alter table public.taseronlar add column is_turleri text[] not null default '{}';
update public.taseronlar set is_turleri = array[is_turu] where cardinality(is_turleri) = 0;
alter table public.taseronlar
  add constraint is_turleri_dolu check (cardinality(is_turleri) between 1 and 20);

-- Dönüş tipi değiştiği için işlev yeniden oluşturulur.
drop function public.santiye_taseronlari(uuid);
alter table public.taseronlar drop column is_turu;

create function public.santiye_taseronlari(p_santiye uuid)
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

revoke execute on function public.santiye_taseronlari(uuid) from anon, public;
grant execute on function public.santiye_taseronlari(uuid) to authenticated, service_role;
