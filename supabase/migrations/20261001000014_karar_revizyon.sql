-- Göç 14: Karar Defteri revizyonları zaman çizelgesi olarak (1 Ekim).
--
-- Kullanıcı kararı: bir kararın değişmiş hâlleri "Karar, Rev. 1, Rev. 2…"
-- diye tek kartta, eskiden yeniye görünür. Veri yapısı aynı (onceki_id
-- zinciri); iki boşluk kapatılır:
-- - Yalnız zincirin son hâli silinebilir. Eski revizyonlar tarihtir,
--   silinmez (ortadan biri silinirse zincir ikiye bölünürdü).
-- - Son hâl silinirse önceki hâl yeniden geçerli olur. Önceden "değişti"
--   işaretli kalıyor, zincir sahipsiz kalıp bir daha revizyon yapılamıyordu.
-- Tekrar çalıştırılırsa zarar vermez.

drop policy if exists siler on public.kararlar;
create policy siler on public.kararlar for delete to authenticated
  using (
    public.karar_okunur(id)
    and not degisti
    and (public.benim_rol() = 'merkez' or (olusturan = auth.uid() and not public.karar_kilitli(id)))
  );

create or replace function public.karar_surum_geri()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if old.onceki_id is not null then
    update public.kararlar set degisti = false
    where id = old.onceki_id
      and not exists (select 1 from public.kararlar r where r.onceki_id = old.onceki_id and r.id <> old.id);
  end if;
  return old;
end
$$;
drop trigger if exists karar_surum_geri on public.kararlar;
create trigger karar_surum_geri after delete on public.kararlar
  for each row execute function public.karar_surum_geri();

notify pgrst, 'reload schema';
