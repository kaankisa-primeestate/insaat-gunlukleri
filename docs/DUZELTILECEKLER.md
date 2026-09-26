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

## Yapıldı

- Sözleşme düzeltme / silme, mükerrer taşeron ve çift sözleşme engeli
- Taşerona birden çok iş türü, birden çok yetkili
- Günlükte birden çok kat ve iş; uzun listeler açılır pencerede
- Hatalı işin kişiye (kalfa, şef) yazılabilmesi
- Teslimat takviminde serbest gün seçimi
