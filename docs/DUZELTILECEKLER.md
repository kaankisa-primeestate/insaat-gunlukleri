# Düzeltilecekler — "Düzeltecek neler var?" listesi

Pilot kullanımda ortaya çıkan, kullanıcının "şimdi değil, sonra" dediği
düzeltmeler. Kullanıcı **"düzeltecek neler var"** dediğinde bu liste
getirilir; seçilen madde yapılır ve "Yapıldı" bölümüne taşınır.

(Anayasadan bilerek ertelenen maddeler ayrıdır: `ERTELENENLER.md`.)

## Bekleyenler

| # | Madde | Not |
|---|---|---|
| D1 | **Aynı gün aynı taşerona ikinci günlük açılmasın.** Kullanıcı aynı kaydı yanlışlıkla iki kez oluşturdu (ASM İnşaat Emir Grup, 25 Eylül). Bir taşeron için günde tek günlük; o günün tüm işleri, katları tek kayıtta seçilir. | Önerilen çözüm: aynı taşeron + aynı tarih varsa yeni kayıt yerine mevcut günlük açılsın ve üzerine eklensin/düzeltilsin. Veritabanında da tekil kural (taşeron + şantiye + tarih). Mevcut mükerrer kayıtlar kural konmadan önce birleştirilmeli ya da silinmeli; bunun için D2 gerekir. |
| D2 | **Günlük, hatalı iş ve talep kayıtları düzeltilemiyor / silinemiyor.** Yanlış taşeron, yanlış tarih ya da mükerrer kayıt şu an ancak veritabanından düzeltilebilir. | Anayasa "silinmez, düzeltme kaydı eklenir" diyor (ertelenen yasal madde C5). Pilot için öneri: kaydı giren 24 saat içinde, merkez her zaman düzeltebilsin; yapılan değişiklik geçmişe yazılsın. |
| D3 | Şantiye adı ve kat sayısı sonradan değiştirilemiyor. | |
| D4 | Kullanıcının adı, telefonu ve rolü sonradan değiştirilemiyor (şifre, şantiye ataması, hesap kapatma var). | |
| D5 | **"Dünden devam" — sürüp giden işte her gün formu baştan doldurmamak.** Taşeron bir işe başladığında 2–3 gün aynı yerde aynı işi yapıyor; her gün aynı günlüğü girmek zahmetli. | Ayrıntı aşağıda. D1 ve D2 ile birlikte yapılmalı (aynı ekran). |

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

- Sözleşme düzeltme / silme, mükerrer taşeron ve çift sözleşme engeli
- Taşerona birden çok iş türü, birden çok yetkili
- Günlükte birden çok kat ve iş; uzun listeler açılır pencerede
- Hatalı işin kişiye (kalfa, şef) yazılabilmesi
- Teslimat takviminde serbest gün seçimi
