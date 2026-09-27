-- Fotoğraf dört kayıt türünde de isteğe bağlı (kullanıcı kararı):
-- günlük (zaten öyleydi), hatalı iş (önce zorunluydu), talep ve teslimat (yeni).
-- Talepte ürünün, teslimatta irsaliyenin/malzemenin fotoğrafı anlatmayı
-- kolaylaştırır. Yalnızca ekleme ve gevşetme yapar; yayındaki eski program
-- bu dosya çalıştırıldıktan sonra da çalışır. Tekrar çalıştırılırsa zarar vermez.

alter table public.hatali_isler drop constraint if exists hatali_isler_fotograflar_check;
alter table public.hatali_isler drop constraint if exists hatali_foto_siniri;
alter table public.hatali_isler add constraint hatali_foto_siniri check (cardinality(fotograflar) <= 6);
alter table public.hatali_isler alter column fotograflar set default '{}';

alter table public.talepler add column if not exists fotograflar text[] not null default '{}';
alter table public.talepler drop constraint if exists talep_foto_siniri;
alter table public.talepler add constraint talep_foto_siniri check (cardinality(fotograflar) <= 6);

alter table public.teslimatlar add column if not exists fotograflar text[] not null default '{}';
alter table public.teslimatlar drop constraint if exists teslimat_foto_siniri;
alter table public.teslimatlar add constraint teslimat_foto_siniri check (cardinality(fotograflar) <= 6);

notify pgrst, 'reload schema';
