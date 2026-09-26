# İnşaat Günlükleri — Proje Durumu

Yeni bir oturumun projeyi hızla kavraması içindir.

**Kullanıcı Türkçe konuşur, yanıtlar Türkçe olmalıdır.** Commit mesajları
Türkçe, ne yapıldığını ve **neden** yapıldığını anlatır.

## Ne

İnşaat firmaları için şantiye ve taşeron takip programı (SaaS olarak
satılması hedefleniyor). Mobil tarayıcı öncelikli PWA. **Sahada telefonda
pratik olması en önemli ölçüt.**

- `docs/ANAYASA.md` — kullanıcının verdiği ana metin. **Sapılmaz.**
- `docs/ERTELENENLER.md` — bilerek sonraya bırakılanlar. Kullanıcı
  **"eksik ne kaldı"** dediğinde bu liste getirilir.
- `docs/DUZELTILECEKLER.md` — pilotta çıkan, sonraya bırakılan düzeltmeler.
  Kullanıcı **"düzeltecek neler var"** dediğinde bu liste getirilir.
- `docs/KARARLAR.md` — verilen kararlar ve gerekçeleri.
- `docs/KURULUM.md` — Supabase + Vercel kurulum adımları.

Pilot: Kısa İnşaat, Polenium Manzara ve Polenium Celayir şantiyeleri.

## Teknoloji

Next.js 16 (App Router, `proxy.ts` — `middleware` değil), React 19,
Tailwind 4, Supabase (Postgres + Auth + Storage), lucide-react. Tamamen
ücretsiz paketler: Vercel Hobby, Supabase Free.

- `supabase/migrations/` — şema, RLS politikaları, tetikleyiciler
- `src/app/(uygulama)/` — girişli sayfalar
- `src/app/giris`, `src/app/kurulum` — girişsiz
- `src/lib/oturum.ts` — oturum, seçili şantiye, yetki fonksiyonu
- `src/lib/sabitler.ts` — roller, iş türleri, durumlar, renk sınıfları

## Çalışma kuralları

**Güvenlik veritabanındadır.** Firma izolasyonu, şantiye/taşeron kapsamı ve
yetki matrisi RLS politikalarında uygulanır; arayüzdeki gizleme yalnızca
kolaylıktır. Yeni tablo eklenirse RLS açılır ve politika yazılır.

**Politika içinde aynı tablo sorgulanmaz** — sonsuz döngü hatası verir.
`security definer` işlevle okunur (`alt_taseron_acabilir` örneği).

**Eklenen satırı `.select()` ile geri okumak RLS'ye takılabilir** (görünürlük
işlevi yeni satırı henüz görmez). Kimlik sunucuda/istemcide üretilip
`insert` öyle yapılır.

**Formlar `<Form>` bileşeniyle yazılır, `<form action>` ile değil.** React 19
sunucu işlemi bitince formu sıfırlıyor; hata/uyarı dönse bile seçilen şantiye,
taşeron gibi alanlar varsayılana dönüyor ve tekrar gönderimde yanlış değer
kaydediliyordu (`src/components/form.tsx`).

**Güncelleme ve silmede `.select("id")` ile etkilenen satır sayısı denetlenir.**
RLS yetki vermezse Supabase hata döndürmez, sessizce 0 satır değiştirir;
denetlenmezse ekran "Kaydedildi" der ama hiçbir şey değişmemiştir.

**Veritabanı değişikliği = yeni geçiş dosyası.** Kullanıcı SQL'i Supabase SQL
Editor'de elle çalıştırır. GitHub'dan kopyalarken dosya adını kopyaladı;
SQL'i sohbete doğrudan yazmak daha güvenli. Kod yayına SQL'den önce
çıkarsa ilgili ekran hata verir; kullanıcıya hemen çalıştırması söylenir.

**Yönetici anahtarı (`supabaseYonetici`) yalnızca yetki denetlendikten sonra**
kullanılır: kullanıcı oluşturma, imzalı dosya adresi, ilk kurulum.

**Fotoğraflar tarayıcıda küçültülür** (1280 px, JPEG 0.6), özel kovaya
`firma_id/...` yoluna yüklenir; okuma yalnızca sunucunun ürettiği süreli
imzalı adresle.

**Renkler** `src/app/globals.css` içindeki değişkenlerden gelir; doğrudan renk
yazılmaz. Güneş altında okunurluk için yüksek kontrast; her çift ölçüldü
(dosyadaki yorum). Tailwind sınıfları dinamik birleştirilmez (`peer-checked:${x}`
üretilmez); tam sınıf adı yazılır.

**Ekran ilkeleri** (anayasadan): büyük dokunma alanı (en az 48 px, çoğu 56–80),
çoktan seçmeli, zorunlu alan sarı çizgi + "Zorunlu" etiketi, her kayıtta tarih
seçici (bugün varsayılan), kamera "Yeni kayıt" düğmesinin yanında,
Kaydet → ana sayfa.

## Test

Yerelde `npx supabase start` ile tam yığın çalışır (Docker). Uçtan uca
akışlar Playwright ile telefon boyutunda denendi: kurulum, şantiye, taşeron +
sözleşme, kullanıcılar, kamerayla günlük, geçmişe dönük günlük, hatalı iş,
taşeronun "Düzeltiliyor" demesi (onaylayamaması), talep ilerletme, teslimat.
İkinci bir firmanın ilk firmanın hiçbir verisini göremediği REST ile denendi.
