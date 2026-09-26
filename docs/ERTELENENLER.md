# Ertelenenler — "Eksik ne kaldı?" listesi

Anayasada (`ANAYASA.md`) yazan ama pilot aşamasında **bilerek yapılmayan**
maddeler. Kullanıcı "eksik ne kaldı" diye sorduğunda bu liste getirilir;
içinden seçilen madde yapılır ve "Yapıldı" bölümüne taşınır.

**Genel kural:** Ertelenen bir maddenin **yeri veri yapısında baştan ayrılır**,
yalnızca işlevi yazılmaz. Böylece sonradan eklendiğinde eski kayıtlar
bozulmaz.

## Sırada (anayasada zorunlu, henüz yapılmadı)

| # | Madde | Durum |
|---|---|---|
| Y1 | **Çevrimdışı çalışma + otomatik senkronizasyon** (Service Worker + IndexedDB) | Yapılmadı. Hazırlık var: kayıt kimliği formda üretiliyor, aynı kayıt iki kez gelirse ikincisi yok sayılıyor; `cihaz_zamani` alanı ayrıldı |

## Yasal / Kanuni Delil (Bölüm C) — kullanıcı kararıyla ertelendi

| # | Madde | Pilotta durumu |
|---|---|---|
| C1 | Onaylı zaman damgası (TÜBİTAK/BTK, RFC 3161) | Yok. Sunucu kayıt saati (`olusturma`) her kayıtta tutuluyor, istemci değiştiremiyor |
| C2 | GPS koordinat + adres, şantiye sınırı doğrulaması | Yok. `konum` alanı ayrıldı |
| C3 | IP ve cihaz bilgisi loglama | Yok. Kaydı kimin girdiği (`olusturan`) tutuluyor |
| C4 | Islak imza / PIN ile kritik kayıt onayı | Yok |
| C5 | Silinemez kayıt (append-only) + düzeltme geçmişi | Kısmen: durum değişiklikleri `hareketler` tablosuna yazılıyor; kayıt silme arayüzü yok |
| C6 | Hash zinciri | Yok |
| C7 | Fotoğraf hash'i ve EXIF saklama | Yok. Fotoğraf tarayıcıda küçültülürken EXIF düşüyor; eklenecekse önce okunmalı |
| C8 | Kullanıcı sözleşmesi, KVKK aydınlatma metni | Yok |
| C9 | İhtilaf PDF raporu (damgalı, imzalı, QR doğrulamalı) | Yok |
| C10 | 10 yıl saklama, coğrafi yedekleme | Yok |
| C11 | İş tarihi / kayıt tarihi ayrımı | **Var:** iki tarih ayrı tutuluyor, geçmişe dönük kayıtlarda "sonradan girildi" etiketi görünüyor |
| C12 | Çevrimdışı kayıtta cihaz saati + sunucuya ulaşma saati ayrımı | Alan ayrıldı (`cihaz_zamani`), Y1 ile birlikte doldurulacak |

## Giriş, bildirim, iletişim

| # | Madde | Pilotta durumu |
|---|---|---|
| G1 | SMS ile giriş / doğrulama (ücretli servis gerekir) | Yok. Merkez kullanıcıyı oluşturur, giriş kullanıcı adı + şifre |
| G2 | E-posta doğrulama, şifre sıfırlama e-postası | Yok. Şifreyi merkez panelden değiştirir |
| G3 | E-posta bildirimleri | Yok |
| G4 | Push bildirim (ücretsizdir, istenirse öne alınabilir) | Yok. Uygulama içi kırmızı uyarı + sesli uyarı + titreşim var |

## SaaS / satış

| # | Madde | Pilotta durumu |
|---|---|---|
| S1 | Dışarıdan firmaların kendi kendine üye olması | Yok. İlk kurulum ekranı yalnızca ilk firma için açılır. Çok kiracılı yapı veritabanında tam çalışıyor (ikinci firma denendi, hiçbir veri görünmedi) |
| S2 | Abonelik paketleri (şantiye/kullanıcı/modül sınırı), ödeme | Yok |
| S3 | Vercel Pro veya Cloudflare'e geçiş (Vercel Hobby ticari kullanıma kapalı) | Satışa açılınca |
| S4 | Fotoğrafları Cloudflare R2'ye taşıma (Supabase ücretsiz alan 1 GB) | Alan dolmaya yaklaşınca |
| S5 | Ayrı arka uç sunucusu (NestJS/.NET) | Gerekmiyor; Next.js + Supabase yetiyor |
| S6 | Otomatik günlük yedek (GitHub Actions ile veritabanı dökümü) | Yok. Supabase ücretsiz pakette yedek almıyor; gerçek veri birikince öncelikli |

## 2. Faz (anayasada zaten sonraya bırakılmış)

Gantt / iş programı, hakediş, metraj, İSG, stok, puantaj, hava durumu, QR kod,
sesli not, **performans puanı** (Senaryo 1'de geçiyor), raporlama, çoklu dil /
para birimi.

## Yapıldı

- SaaS altyapı: firma (tenant), satır bazlı izolasyon, ilk kurulum
- Merkez yetkilendirme: rol şablonları + sayfa bazlı yetki matrisi (kullanıcıya
  ve taşeron firmasına ayrı), taşeron sayfasında Bilgi / Kayıtlar / Yetki sekmeleri
- Modül 1: taşeron kaydı, sözleşme (net tarih veya yer teslim + süre), belge
  yükleme, alt taşeron, gecikme uyarısı (görsel + sesli), taşeronun kendi sayfası
- Modül 2: günlük, "Yeni Günlük" yanında kamera, geçmişe dönük tarih,
  çoktan seçmeli kişi/kat/iş, fotoğraf sıkıştırma, tarih + taşeron süzgeci
- Modül 3: fotoğraf zorunlu hatalı iş, önem derecesi, üç aşamalı durum,
  taşeron onaylayamaz, durum geçmişi
- Modül 4: talep → satın alındı → yolda → teslim alındı → kapandı, saatlik
  teslimat yoğunluk takvimi, çakışma uyarısı
