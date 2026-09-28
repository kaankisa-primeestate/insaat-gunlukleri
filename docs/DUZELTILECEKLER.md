# Düzeltilecekler — "Düzeltecek neler var?" listesi

Pilot kullanımda ortaya çıkan, kullanıcının "şimdi değil, sonra" dediği
düzeltmeler. Kullanıcı **"düzeltecek neler var"** dediğinde bu liste
getirilir; seçilen madde yapılır ve "Yapıldı" bölümüne taşınır.

(Anayasadan bilerek ertelenen maddeler ayrıdır: `ERTELENENLER.md`.)

## Bekleyenler

| # | Madde | Not |
|---|---|---|
| D3 | **Şantiye tarifi:** bloklar, her bloğun katları, otopark ve çevre alanları; oluştururken ve sonradan düzenlenebilir. | Şablon aşağıda; kullanıcı onayı bekliyor. |
| D5 | **"Dünden devam" — sürüp giden işte her gün formu baştan doldurmamak.** Taşeron bir işe başladığında 2–3 gün aynı yerde aynı işi yapıyor; her gün aynı günlüğü girmek zahmetli. | Ayrıntı aşağıda. D1 ve D2 ile birlikte yapılmalı (aynı ekran). |

## D8 ayrıntısı: şantiye girişte seçilir (kullanıcı kararı)

- Kullanıcı adı ve şifreden sonra **"Hangi şantiyeye giriyorsunuz?"**
  ekranı; büyük düğmeler. Seçilince oturum o şantiyede kalır, ekran bir daha
  gösterilmez. (Şifreden önce gösterilmez: giriş yapmamış birine firmanın
  şantiye listesi açılmış olur.)
- Tek şantiyesi olan bu ekranı görmez, doğrudan girer.
- Üstteki şantiye seçici kalkar. Başka şantiyeye geçmek için çıkış yapılıp
  yeniden girilir.
- Her ekranda ayrı bir şantiye şeridi **olmayacak** (kullanıcı istemedi).

## D9 ayrıntısı: bilgisayar görünümü (öneri)

Aynı program, geniş ekranda farklı yerleşim. Sahada kayıt telefondan, ofiste
takip ve inceleme bilgisayardan.

| Ekran | Telefonda (aynen) | Bilgisayarda |
|---|---|---|
| Genel | Tek sütun, büyük düğmeler | Solda sabit menü, üstte şantiye adı |
| Ana sayfa | Hızlı kayıt düğmeleri | Günün özeti panosu (B2 ile birleşir, Faz 4) |
| Günlükler | Kart listesi | Tablo: tarih, taşeron, kişi, kat, iş, not, fotoğraf, giren; süzgeçler tek satırda |
| Hatalı işler | Kart listesi | Üç sütunlu pano: Tespit / Düzeltiliyor / Onaylandı |
| Taşeron sayfası | Sekmeler alt alta | İki sütun: solda bilgi/sözleşmeler, sağda kayıtlar |
| Formlar | Tam sayfa | Ortada geniş kart; seçim pencereleri ortada açılır |
| Fotoğraflar | Küçük resim | Tıklanınca büyük görüntüleyici |

## D3 ayrıntısı: şantiye tarifi (öneri — kullanıcı onayı bekliyor)

Kullanıcı (28 Eylül): şantiyeler çok farklı; Manzara 4 bloklu, Celayir tek
blok. Binanın yanında çevre de var (otopark katı, peyzaj…). Şantiye
oluşturulurken tarif edilebilmeli. Önce şablon, sonra uygulama.

**Yapı: şantiye = alanlar.** İki tür alan:
- **Bina / blok:** ad, bodrum kat sayısı, normal kat sayısı, çatı var/yok.
  Katlar bundan üretilir (2. Bodrum … Zemin … 5. Kat, Çatı).
- **Çevre alanı:** otopark (kendi kat sayısıyla), peyzaj/bahçe, çevre
  duvarı, altyapı, yollar, havuz, sosyal tesis, güvenlik, şantiye alanı,
  "Diğer (yazarak)". Katı olan (otopark, sosyal tesis) katlarıyla, olmayan
  tek parça seçilir.

**Oluşturma: üç adım.** 1) Ad, adres, konum. 2) Blok sayısı; "bloklar aynı
mı?" evetse tek tarif hepsine uygulanır (A, B, C, D adları değiştirilebilir),
hayırsa her blok ayrı. 3) Çevre alanları dokunarak seçilir. Sonda önizleme.

**Günlükte ve hatalı işte "Yer" seçimi** alanlara göre gruplu: A Blok →
katlar, Otopark → -1, -2, Peyzaj … Kayda "A Blok · 3. Kat" yazısı düşer.
Yazı olarak saklandığı için şantiye sonradan değişse de eski kayıt bozulmaz.

**Sonradan düzenleme:** blok/alan eklenir, adı ve kat sayısı değişir.
Kaydı olan alan silinmez, gizlenir. Şantiye silinmez, kapatılır.

**Mevcut kayıtlar:** bugünkü "3. Kat" kayıtlarının hangi bloğa ait olduğu
bilinmiyor; oldukları gibi kalır.

**Onay bekleyen sorular:** Manzara/Celayir rakamları, blok adlandırma,
çevre alanı listesi, taşeron sözleşmesinin bloğa bağlanması (öneri: şimdi
değil).

## D5 ayrıntısı: "Bugünün Günlüğü" (öneri — kullanıcı onayı bekliyor)

**Otomatik kayıt yapılmaz.** Taşeron gelmediği gün de kayıt düşer, kimse
fark etmezse sahte kayıt oluşur; günlüğün güvenilirliği biter. Bunun yerine
öneri + tek dokunuş onay:

- Ana sayfada "Yeni Günlük Ekle"nin üstünde: "Dün çalışan N taşeron — bugün
  devam ediyorlar mı?" Her taşeron için son kaydı hazır bir kart.
- Kart düğmeleri:
  - **Aynen devam** → bugünün kaydı dünkü bilgilerle tek dokunuşta oluşur.
  - **Değiştir** → günlük formu dünkü bilgilerle dolu açılır (kişi sayısı,
    kat, iş, not değiştirilir).
  - **Gelmedi** → o gün için "gelmedi" kaydı.
  - **Bu işi bitirdi** (küçük menüde) → artık önerilmez; elle yeni günlük
    girilince öneri yeniden başlar.
- Fotoğraf kopyalanmaz; istenirse kartta o günün fotoğrafı eklenir.
- Öneri kaynağı: son 7 gündeki son kayıt (pazartesi → cuma gelir).
- "Dünden devam" kayıtları listede "devam" etiketiyle görünür; kimin, ne
  zaman onayladığı tutulur.
- Aynı gün ikinci kayıt yok (D1): girilmiş kart "Girildi" gösterir,
  dokununca o günün kaydı açılır.

**Karar bekleyen:**
1. "Gelmedi" kaydı tutulsun mu? (Öneri: evet — gecikme ve ileride puantaj.)
2. "Hepsini aynen kaydet" toplu düğmesi olsun mu? (Öneri: hayır — her
   taşeronun sahada olduğu tek tek gözle onaylansın.)

## Yapıldı

- D2 (hatalı iş, talep) Düzenle / Sil: merkez her zaman; kaydı giren 24 saat içinde **ve kayıt henüz işlem görmediyse** (hatalı iş "Tespit", talep "Açıldı"). Kural veritabanında da var; ekranı atlayan istek reddediliyor. Düzenlenen kayıtta kim/ne zaman görünüyor; silinen kaydın fotoğrafları ve durum geçmişi de siliniyor. Düzeltmede çıkarılan fotoğraflar depodan siliniyor (günlükte de)
- D4 Kullanıcı düzenleme: ad, kullanıcı adı (şifre aynı kalır), telefon, rol. Rol yalnız firma içi roller arasında değişir; taşeron hesabı iç hesaba çevrilmez. Rol değişince kişiye özel yetkiler varsayılana döner. Merkez kendi rolünü düşüremez, firmada en az bir merkez kalır

- D1 Aynı gün aynı taşerona ikinci günlük açılmıyor (program + veritabanı); mevcut kaydın bilgisi gösteriliyor
- D2 (günlük) Günlük düzenleme ve silme: merkez her zaman, giren 24 saat içinde; düzenlenen kayıtta "düzenlendi" etiketi, kim/ne zaman tutuluyor; silinen kaydın fotoğrafları da siliniyor

- D8 Şantiye girişte (şifreden sonra) bir kez seçilir; üstteki seçici kalktı, çıkış ana sayfanın altında
- D6 Bilgisayarda tarih kutusuna tıklayınca takvim açılıyor (tüm tarih kutuları)
- D7 "Taşeron yok" mesajı nedenini söylüyor, "Taşeronlara git" düğmesi var
- D9 Bilgisayar görünümü: solda menü, günlükler tablo, hatalı işler üç sütunlu pano, taşeron sayfası iki sütun, teslimatta form ve saatler yan yana, fotoğraf görüntüleyici, seçim pencereleri ortada

- Sözleşme düzeltme / silme, mükerrer taşeron ve çift sözleşme engeli
- Taşerona birden çok iş türü, birden çok yetkili
- Günlükte birden çok kat ve iş; uzun listeler açılır pencerede
- Hatalı işin kişiye (kalfa, şef) yazılabilmesi
- Teslimat takviminde serbest gün seçimi
