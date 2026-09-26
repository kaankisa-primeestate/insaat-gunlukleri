# Şantiye ve Taşeron Takip Programı — Anayasa

> Bu belge programın **anayasasıdır**. Kullanıcının verdiği nihai prompt (v3)
> olduğu gibi aşağıdadır; yapım sırasında bundan sapılmaz.
>
> Şimdilik uygulanmayıp sonraya bırakılan maddeler `ERTELENENLER.md` içinde
> listelenir. Bu belgede bir madde ertelendiyse metin değiştirilmez; erteleme
> yalnızca o listede kayıt altına alınır. Verilen kararlar `KARARLAR.md`
> içindedir.

---

# 🏗️ İnşaat Şirketleri için Şantiye ve Taşeron Takip Programı — Nihai Prompt (v3)

**Rol:** Kıdemli bir yazılım mimarı ve full-stack geliştirici olarak davran.

**Görev:** Birden fazla şantiyesi olan inşaat firmalarına **SaaS olarak satılacak/kiralanacak**, mobil tarayıcı öncelikli, responsive bir **Şantiye ve Taşeron Takip Programı** tasarla ve geliştir.

---

## ⭐ TEMEL KURALLAR

- **Sistemin merkezi: TAŞERON'dur.** Taşeron kaydı olmadan hiçbir modül çalışmaz.
- **4 ana modül entegre çalışır**, birbirinden bağımsız değildir.
- **Mobile-first, responsive web (PWA)** — native app değil.
- **Her işlem tek sayfada** → "Kaydet" → ana sayfaya dönüş.
- **Büyük butonlar**, **çoktan seçmeli** alanlar, **yüksek kontrast**, minimum yazı.
- **Offline çalışma + otomatik senkronizasyon** zorunlu.
- **Çok kiracılı (multi-tenant) SaaS mimarisi** — her müşteri şirket kendi izole alanında çalışır.

---

## 🏢 BÖLÜM A — SaaS ve Üyelik Altyapısı

### A.1. Çok Kiracılı Mimari
- Sistem **SaaS** olarak satılacak/kiralanacak.
- Her müşteri şirket kendi **izole veri alanında** (tenant) çalışır — bir şirketin verisi diğerini asla görmez.
- Üyelik oluşturma → şirket kaydı → şantiye ve taşeron tanımlama şeklinde ilerler.
- Abonelik seviyeleri (paketler) tanımlanabilir: şantiye sayısı, kullanıcı sayısı, modül erişimi vb.

### A.2. Merkez Üyelik = Süper Yönetici
- **Merkez (Ana Firma)**, kendi tenant'ındaki **her şeyin hakimidir.**
- Kim neyi görecek, neyi görmeyecek → **kararı Merkez verir.**
- Merkez, her kullanıcı ve her taşeron için **sayfa bazlı yetki matrisi** tanımlar.

### A.3. Merkez Yetkilendirme Paneli (Kritik)
- Merkez, **"Taşeronlar"** listesinden bir taşerona tıkladığında o taşeronun **detay sayfası** açılır.
- Bu sayfada **iki sekme** olur:
  1. **Bilgi Sekmesi** — firma bilgileri, sözleşme, iş tarifi.
  2. **Yetki Sekmesi** — hangi sayfalara erişebileceği.
- **Yetki matrisi örneği:**

| Sayfa / Modül | Görür | Düzenler | Not |
|---|---|---|---|
| Şantiye Günlüğü | ✅ | ❌ | Sadece kendi kayıtları |
| Eksik/Hatalı İşler | ✅ | ✅ (sadece kendi) | — |
| Talep/Tedarik | ✅ | ✅ (sadece kendi) | — |
| Teslimat Takvimi | ✅ | ✅ (sadece kendi) | — |
| Sözleşme Bilgisi | ✅ | ❌ | Sadece okuma |
| Diğer Taşeronlar | ❌ | ❌ | Kesinlikle göremez |

- Merkez her satır için **"Görür / Görmez"** ve **"Düzenler / Düzenlemez"** kutucuklarını işaretler.
- Aynı yetki matrisi **her kullanıcı** için de ayrıca tanımlanabilir (şantiye şefi, kalfa, satın almacı vb.).

---

## 🧱 BÖLÜM B — İLK YAPILACAK 4 ANA MODÜL

### 🥇 MODÜL 1 — TAŞERON KAYIT & SÖZLEŞME YÖNETİMİ
> **Sistemin temeli.** Diğer 3 modül bu modüle bağlıdır.

**İçerik:**
- Firma bilgileri (ad, yetkili, telefon, vergi no, IBAN).
- **Yapacağı işin tarifi** (kalıp, demir, elektrik vb.).
- **Sözleşme:**
  - Net başlangıç/bitiş varsa direkt girilir.
  - Yoksa: **yer teslim tarihi + süre** → bitiş otomatik hesaplanır.
- **Sözleşme belgesi** yüklenir (PDF/foto).
- **Alt taşeron** tanımlama yetkisi.
- **Gecikme uyarısı** → sesli + görsel.
- **Yetki Sekmesi** (Bölüm A.3'e göre).
- Her taşeronun **kendi sayfası** olur.

---

### 🥈 MODÜL 2 — ŞANTİYE GÜNLÜĞÜ
> Sahada en sık kullanılan modül.

**Akış:**
1. Ana sayfada **"➕ Yeni Günlük Ekle"** butonunun **hemen yanında 📷 fotoğraf makinesi ikonu** olur (aşağıda değil, yanında — tek dokunuşla fotoğraf çekip kayıt başlatılabilsin).
2. **Taşeronlar** büyük butonlarla listelenir (sadece o şantiyede kayıtlılar).
3. Taşeron seçilir (**zorunlu**).
4. Tarih seçici **otomatik bugünü** gösterir.
5. İş bilgisi girilir (kişi sayısı, kat, iş) — **çoktan seçmeli** + kısa not.
6. Fotoğraf eklenir (düşük çözünürlüklü).
7. **"Kaydet"** → ana sayfaya döner.

**🆕 Geçmişe Dönük Kayıt (Kritik):**
- **Ayrı bir modül YOK.** Aynı günlük sayfasında **tarih seçici** ile geçmişe dönük tarih seçilir.
- Örnek: Ağustos ayındayız, sistem Nisan'dan beri yok. Şef **13 Nisan** seçer → "Kalıpçı, 6 kişi, 7. kat tabliye" girer → kayıt **13 Nisan tarihine** atılır.
- Bu sayede **yarıdan başlayan şantiyeler** bile sıfırdan geçmişe dönük doldurulabilir.
- **Amaç:** Şantiyenin en başından en sonuna kadar tüm süreç kayıt altında olsun.

**Geriye dönük:** Tarih + taşeron + şantiye filtreleri.

---

### 🥉 MODÜL 3 — EKSİK & HATALI İŞLER

**Akış:**
1. Modüle girilir.
2. **Fotoğraf çekilir** (zorunlu).
3. **Taşeron seçilir** (zorunlu — taşeron olmadan kayıt oluşmaz).
4. Tarih seçilir (**bugün veya geçmiş**).
5. Açıklama + **önem derecesi** (🔴 Acil / 🟡 Normal / 🟢 Düşük).
6. **"Kaydet"** → ana sayfaya döner.

**Kayıt oluştuğunda otomatik:**
- Hatalı işler listesinde önem sırasına göre görünür.
- **İlgili taşeronun sayfasına** düşer.
- Merkezdeki tüm yetkililerin ekranında görünür.

**3 aşamalı durum:** 🔴 Tespit Edildi → 🟡 Düzeltiliyor → 🟢 Onaylandı.

---

### 🏅 MODÜL 4 — TALEP → TEDARİK → KAPANIŞ

**Akış:**
1. Şef talep açar: "1 kamyon kum, **X taşeronu için**" (taşeron zorunlu).
2. Satın almacı görür → "Satın alındı" işaretler.
3. Ürün gelir → teslim alınır → **kapanış**.

**Durum:** Talep Açıldı → Satın Alındı → Yolda → Teslim Alındı → Kapandı.

**Saha Teslimat Yoğunluk Takvimi:**
- Taşeronlar teslimatlarını sisteme girer (tarih + saat + araç + ürün).
- Ortak yoğunluk ekranında **saatlik slotlar** halinde görünür.
- Çakışma varsa taşeron planını ayarlar.

---

## 🔗 4 MODÜL NASIL KONUŞUR? (Senaryolar)

### Senaryo 1 — Hatalı İş (M1 ↔ M3)
Şef Modül 3'te fotoğraf çeker → taşeronu **M1'den gelen listeden** seçer → kaydeder → **otomatik olarak o taşeronun M1 sayfasına** düşer → taşeron düzeltir → durum "Onaylandı" → **M1'deki performans puanı** güncellenir.

### Senaryo 2 — Geçmişe Dönük Günlük (M2 ↔ M1)
Ağustos ayındayız, şantiye Nisan'da başlamış ama sisteme girilmemiş. Şef **tarih seçiciden 13 Nisan**'ı seçer → Kalıpçı seçer → girer → kayıt **Nisan 13 tarihine** atılır → **M1'deki Kalıpçı sayfasında** kronolojik sıraya oturur.

### Senaryo 3 — Talep + Günlük İlişkisi (M2 ↔ M4)
Şef M2'de elektrikçi günlüğü girer → aynı gün M4'te elektrikçi için kablo talebi açar → teslim alınır → **M1'deki elektrikçi sayfasında** hem günlük hem teslim edilen ürün görünür.

### Senaryo 4 — Gecikme Uyarısı (M1 → Tüm Modüller)
Mermerci'nin bitiş tarihi yaklaşır → sesli + görsel uyarı → ilgili taşeronun tüm modüllerdeki satırlarında **kırmızı etiket** görünür.

---

## 🏗️ YETKİLENDİRME HİYERARŞİSİ

| Katman | Görme Yetkisi |
|---|---|
| **Merkez (Süper Admin)** | Tüm tenant verisi, tüm yetkiler, yetki matrisi tanımlama |
| **Merkez Personel** | Merkezin verdiği yetki kadar |
| **Şantiye Şefi / Kalfa** | Kendi şantiyesi + merkezin verdiği sayfalar |
| **Ana Taşeron** | Kendi sayfası + alt taşeronlar + merkezin verdiği sayfalar |
| **Alt Taşeron** | Sadece kendi sayfası |

> **Kural:** Yetki her zaman **Merkez tarafından** verilir. Varsayılan olarak alt katman üstü görmez.

---

## 📲 TEKNİK BEKLENTİLER

- **Mobile-first responsive web (PWA)** — native app değil.
- Fotoğraf çekimi + düşük çözünürlük sıkıştırma **tarayıcıda**.
- **Offline çalışma + otomatik senkronizasyon** (Service Worker + IndexedDB).
- **Multi-tenant veri izolasyonu** (her tenant'ın verisi ayrı).
- RBAC + sayfa bazlı yetki matrisi.
- Bildirimler: push, e-posta, **sesli uyarı**.
- **Önerilen yığın:**
  - Frontend: Next.js + React + TailwindCSS (PWA)
  - Backend: Node.js (NestJS) veya .NET
  - DB: PostgreSQL (tenant başına şema veya satır bazlı izolasyon)
  - Depolama: S3 uyumlu
  - Auth: JWT + refresh token + tenant ID

---

## ⚖️ BÖLÜM C — KANUNİ DELİL ALTYAPISI

> Amaç: İleride taşeronla yaşanacak ihtilaflarda **hukuken geçerli kayıt** elde etmek.

Sisteme dahil edilecek unsurlar:

1. **Zaman Damgası (Timestamp)**
   - Her kayıt oluşturulduğunda **sunucu tarafında** değiştirilemez zaman damgası eklenir.
   - Tercihen **TÜBİTAK / BTK onaylı zaman damgası servisi (RFC 3161)** ile imzalanır.

2. **Konum Bilgisi (GPS)**
   - Fotoğraf çekildiğinde **koordinat + adres** otomatik kaydedilir.
   - Şantiye sınırları tanımlanırsa, kayıt gerçekten sahada mı alınmış doğrulanır.

3. **Kullanıcı Kimliği + Dijital İmza**
   - Kaydı oluşturan kullanıcının ID'si, IP'si, cihaz bilgisi loglanır.
   - Kritik kayıtlar (hatalı iş, teslim alma) için **kullanıcı imzası** (parmakla çizilen ıslak imza veya PIN doğrulama).

4. **Değiştirilemezlik (Immutable Log)**
   - Kayıtlar **append-only** yapıda tutulur; silinemez, sadece **düzeltme kaydı** eklenir.
   - Her düzeltme, önceki halini de saklar (audit trail).

5. **Hash Zinciri**
   - Her kayıt, bir önceki kaydın hash'ini içerir → zincir bozulursa tespit edilir (blockchain benzeri).

6. **Fotoğraf Bütünlüğü**
   - Fotoğrafların hash'i ayrıca saklanır → sonradan değiştirilip değiştirilmediği anlaşılır.
   - İsteğe bağlı: EXIF verisi korunur (çekim tarihi, cihaz).

7. **Yasal Metinler**
   - Kullanıcı sözleşmesinde bu kayıtların **delil teşkil ettiği** belirtilir.
   - KVKK uyumlu aydınlatma metni.
   - İhtilaf halinde **PDF raporu** (zaman damgalı, imzalı, QR doğrulamalı) dışa aktarılabilir.

8. **Yedekleme & Saklama**
   - Kayıtlar **en az 10 yıl** saklanır (inşaat sektörü zamanaşımı).
   - Coğrafi yedekleme (farklı bölgelerde replikasyon).

> Bu altyapı **opsiyonel bir modül** olarak değil, **sisteme gömülü** şekilde çalışır — yani her kayıt otomatik olarak bu unsurlarla birlikte oluşur.

---

## 📱 EKRAN TASARIM İLKELERİ

| İlke | Açıklama |
|---|---|
| **Tek ekran – tek iş** | Her işlem tek sayfada tamamlanır |
| **Büyük butonlar** | Min. 48x48 px |
| **Çoktan seçmeli** | Serbest yazı minimumda |
| **Net geri dönüş** | Kaydet → ana sayfa |
| **Yüksek kontrast** | Güneş altında okunabilir |
| **📷 Kamera her zaman yan yana** | "Yeni Kayıt" butonunun hemen yanında |
| **Tarih seçici her kayıtta** | Bugün varsayılan, geçmiş seçilebilir |
| **İkon + yazı** | Sadece ikon değil |
| **Zorunlu alan vurgusu** | Taşeron seçimi gibi alanlar belirgin |

---

## 🚀 GELİŞTİRME STRATEJİSİ (MVP)

**1. Faz (MVP):**
1. ✅ SaaS altyapı + tenant + üyelik
2. ✅ Merkez yetkilendirme paneli (yetki matrisi)
3. ✅ Modül 1 — Taşeron Kayıt & Sözleşme
4. ✅ Modül 2 — Şantiye Günlüğü (geçmişe dönük tarih seçici ile)
5. ✅ Modül 3 — Eksik & Hatalı İşler
6. ✅ Modül 4 — Talep – Tedarik – Kapanış
7. ✅ Kanuni delil altyapısı (temel: zaman damgası + GPS + audit log)

**2. Faz:**
- Gantt / iş programı, hakediş, metraj, İSG, stok, puantaj, hava durumu, QR kod, sesli not, performans puanı, raporlama, çoklu dil/para birimi.
