# Kurulum: Supabase + Vercel

Bir kez yapılır. Sıra önemlidir: önce veritabanı, sonra yayın.

## 1. Supabase: veritabanını kurmak

1. Supabase'de `insaat-gunlukleri` projesini açın (bölge Frankfurt, plan Free).
2. Sol menüden **SQL Editor** → **New query**.
3. Depodaki `supabase/migrations/20260926000001_temel.sql` dosyasının
   **tamamını** kopyalayıp yapıştırın → **Run**. "Success. No rows returned"
   görülmeli.
4. **Authentication → Sign In / Providers** → **Allow new users to sign up**
   kapatılsın. Hesapları yalnızca merkez panelden açar; bu kapalıyken dışarıdan
   kimse hesap oluşturamaz.

## 2. Anahtarları almak

**Project Settings → API Keys** sayfasında iki anahtar var:

| Anahtar | Nereye |
|---|---|
| Publishable key (`sb_publishable_...`) | Vercel: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
| Secret key (`sb_secret_...`) | Vercel: `SUPABASE_SECRET_KEY` — **tam yetkili, hiçbir yere yapıştırmayın** |

Proje adresi (**Project Settings → Data API → Project URL**,
`https://xxxx.supabase.co`) → Vercel: `NEXT_PUBLIC_SUPABASE_URL`.

## 3. Vercel: yayınlamak

1. **Add New → Project** → `insaat-gunlukleri` deposu → **Import**.
2. Application Preset **Next.js** olmalı (depo dolunca kendiliğinden seçilir).
3. **Environment Variables** bölümüne yukarıdaki üç değişkeni girin.
4. **Deploy**.

## 4. İlk giriş

Yayın adresini açın → **İlk Kurulumu Başlat** → firma adı, adınız, kullanıcı
adınız, şifreniz. Bu hesap **merkez** (süper yönetici) olur. Kurulum ekranı
ilk firmadan sonra kapanır.

Sonra: Yönetim → Şantiyeler (Manzara, Celayir) → Taşeronlar + sözleşmeleri →
Kullanıcılar (şef, satın alma) → taşeron sayfasında **Yetki** sekmesinden
taşeronlara giriş hesabı.

## Şema değişince

Yeni bir `supabase/migrations/...sql` dosyası eklendiğinde yalnızca **o
dosya** SQL Editor'de çalıştırılır. Eski dosyalar tekrar çalıştırılmaz.

## Yerelde çalıştırmak (geliştirici)

```
npx supabase start      # Docker gerekir; yerel veritabanı + giriş + depo
cp .env.example .env.local   # supabase start çıktısındaki anahtarlarla doldurun
npm run dev
```
