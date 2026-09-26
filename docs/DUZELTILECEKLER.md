# Düzeltilecekler — "Düzeltecek neler var?" listesi

Pilot kullanımda ortaya çıkan, kullanıcının "şimdi değil, sonra" dediği
düzeltmeler. Kullanıcı **"düzeltecek neler var"** dediğinde bu liste
getirilir; seçilen madde yapılır ve "Yapıldı" bölümüne taşınır.

(Anayasadan bilerek ertelenen maddeler ayrıdır: `ERTELENENLER.md`.)

## Bekleyenler

| # | Madde | Not |
|---|---|---|
| D2 | **Hatalı iş ve talep kayıtları düzeltilemiyor / silinemiyor.** (Günlük kısmı yapıldı.) | Günlükteki kural: merkez her zaman, giren 24 saat içinde; değişiklik "düzenlendi" olarak görünür. |
| D3 | Şantiye adı ve kat sayısı sonradan değiştirilemiyor. | |
| D4 | Kullanıcının adı, telefonu ve rolü sonradan değiştirilemiyor (şifre, şantiye ataması, hesap kapatma var). | |
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
