# Yol Haritası

Kullanıcıyla birlikte belirlendi (26 Eylül 2026). Öncelikler: **1) kullanım
çok kolay, 2) sahada en çok fayda.** Anayasadan taviz verilmez.

Hedeflenen fark üç şeyin bir arada olması:
1. **10 saniyede kayıt** — dünden devam, açılır pencereler, sesle yazma
2. **Taşeron sistemin içinde** — kendi hesabı, kendi işi, WhatsApp'tan haberi
3. **Tartışmayı bitiren kayıt** — önce/sonra fotoğrafı, hava durumu,
   "sonradan girildi" etiketi

Kod adları: D = `DUZELTILECEKLER.md`, A/B = piyasa araştırması önerileri,
Y/S/G = `ERTELENENLER.md`.

## Faz 0 — Saha denemesi (1–2 gün)

Kullanıcı Manzara ve Celayir'de gerçek kullanımla dener. Görülen her aksaklık
`DUZELTILECEKLER.md`'ye eklenir. Sonraki fazlar bu bulgularla birlikte yapılır.

Deneme sırasında bilinen sınırlar: yanlış/mükerrer günlük, hatalı iş ve talep
kaydı silinemez (D2); not alınır, Faz 1'de temizlenir. İnternet yokken kayıt
yapılamaz (Y1).

## Faz 1 — Kayıt temizliği ve güvence

Sonraki her şey doğru ve düzeltilebilir kayda dayanır; önce bu.

| Kod | İş |
|---|---|
| D2 | Günlük, hatalı iş, talep düzeltme ve silme (değişiklik geçmişe yazılır) |
| D1 | Aynı gün aynı taşerona tek günlük; varsa mevcut açılır |
| D3 | Şantiye adı / kat sayısı düzenleme |
| D4 | Kullanıcı adı, telefon, rol düzenleme |
| S6 | Otomatik günlük yedek (GitHub Actions, ücretsiz). Gerçek veri birikiyor; Supabase ücretsiz pakette yedek almıyor |
| — | Faz 0'da çıkan aksaklıklar |

## Faz 2 — 10 saniyede kayıt

| Kod | İş |
|---|---|
| D5 | "Bugünün Günlüğü": dünden devam kartları (Aynen devam / Değiştir / Gelmedi) |
| A2 | Sesle yazma: not ve açıklama kutularında mikrofon (telefonun Türkçe tanıması) |
| A3 | Hava durumu günlüğe kendiliğinden (Open-Meteo, ücretsiz, anahtarsız) |

## Faz 3 — Taşeron içeride

| Kod | İş |
|---|---|
| A4 | Hatalı işte önce/sonra fotoğrafı (düzeltmede zorunlu) ve termin tarihi; termini geçen kırmızı |
| A1 | WhatsApp'a gönder: hatalı iş / günlük / talep tek dokunuşla ilgili kişiye |
| A5 | Anlık bildirim (G4): "Size hatalı iş yazıldı", "Yeni talep var" |

## Faz 4 — Merkezin gözü

A4 ve D5'in ürettiği veriye (düzeltme süresi, gelmedi günleri) dayanır.

| Kod | İş |
|---|---|
| B2 | Günün özeti: kaç taşeron, kaç kişi, açık/acil hata, gelmeyenler; haftalık kişi grafiği |
| B4 | Taşeron karnesi: hata sayısı, ortalama düzeltme süresi, gecikme, gelmediği gün |
| B3 | Tek dokunuşla PDF rapor (günlük/haftalık, logolu, fotoğraflı), WhatsApp ile paylaşım |
| B1 | Fotoğraf üzerine çizim (ok, daire) |

## Faz 5 — Çevrimdışı çalışma

| Kod | İş |
|---|---|
| Y1 | İnternet yokken kayıt, bağlantı gelince otomatik gönderim (anayasada zorunlu) |

Sahada çekmeyen yer (bodrum, çekirdek) sorun olursa Faz 0 bulgusuyla öne alınır.
Hazırlık zaten var: kayıt kimliği cihazda üretiliyor, çift gönderim yok sayılıyor.

## Bilerek yapılmayanlar

- **C grubu** (kat planı üzerinde işaretleme, QR kod, blok/daire ızgarası):
  kullanıcı kararıyla şimdilik yok.
- Yapay zekâ ile rapor yazdırma: ücretli servis gerekir; sesle yazma (A2)
  ücretsiz karşılığı.
- Muhasebe, cari, çek: öncelik dışı; hakediş anayasada 2. faz.
