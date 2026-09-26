# Verilen Kararlar

| Konu | Karar |
|---|---|
| Anayasa | `ANAYASA.md` (nihai prompt v3). Sapılmaz; ertelenenler `ERTELENENLER.md`'de |
| Bağımsızlık | Program Kısa İnşaat web sitesinden tamamen bağımsız. Gerekirse sonra siteye bağlantı eklenir |
| Maliyet | Pilot tamamen ücretsiz platformlarda |
| Uygulama | Next.js 16 (PWA), Vercel Hobby, alan adı yok (`*.vercel.app`) |
| Veri, giriş, dosya | Supabase Free, Frankfurt. PostgreSQL + RLS ile firma izolasyonu |
| Yasal altyapı, SMS, e-posta | Şimdi yapılmaz; veri yapısında yerleri ayrılır |
| Pilot | Kısa İnşaat — Polenium Manzara ve Polenium Celayir şantiyeleri |
| Taşeron girişi | Pilotta taşeronlar kendi hesaplarıyla girer |
| Giriş | Kullanıcı adı + şifre. Hesabı merkez açar. Supabase'e iç e-posta adresiyle (`kullanici@giris.insaat-gunlukleri.local`) kaydedilir, e-posta gönderilmez |
| En önemli ölçüt | Sahada telefonda **pratik ve kullanıcı dostu** olması |

## Tasarım kararları

- **Taşeronu şantiyeye sözleşme bağlar.** Taşeron, sözleşmesi olan şantiyede
  listelenir. Alt taşeron, ana taşeronunun şantiyesinde de listelenir.
- **"Diğer taşeronları göremez" kuralı yetki matrisinden bağımsızdır**;
  veritabanında sabittir, merkez yanlışlıkla açamaz.
- **Hatalı işi merkez tarafı bildirir.** Taşeron kendi hakkındaki kaydı
  "Düzeltiliyor" yapabilir, "Onaylandı" yapamaz; açıklamayı, önemi,
  fotoğrafı değiştiremez (tetikleyici denetler).
- **Taşeron talep açar ama durumunu ilerletemez.** Satın alındı / yolda /
  teslim / kapanış merkez tarafının işi.
- **Teslimat takviminde** herkes saatin dolu olduğunu görür, başka taşeronun
  teslimat ayrıntısını görmez.
- **Gecikme uyarısı:** tamamlanmamış sözleşmenin bitişine 7 gün veya daha az
  kaldıysa kırmızı etiket. Sesli uyarı ekrana ilk dokunuşta, günde bir kez
  (tarayıcılar dokunmadan ses çaldırmaz).
- **Her kayıt formu:** Kaydet → ana sayfa, "Kaydedildi" yeşil şeridi.

## Mükerrer kayıt ve düzeltme (pilot geri bildirimi)

- **Aynı taşeron iki kez açılamaz.** Ad, Türkçe harf / büyük-küçük harf /
  boşluk / noktalama farkı gözetmeden karşılaştırılır; vergi numarası
  girildiyse o da. Kural veritabanında (`taseron_mukerrer` tetikleyicisi).
- **Bir taşeronun bir şantiyede tek sözleşmesi olur.** Yanlışsa düzeltilir
  ("Düzelt"), gerekirse silinir.
- **Aynı şantiyede aynı işi yapan ikinci taşeron: uyarı, yasak değil.**
  Kullanıcı "bir şantiyede iki elektrikçi olamaz" dedi; kesin yasak
  konmadı, çünkü büyük şantiyede iki kalıpçı farklı blokta çalışabilir ya da
  işi bırakan taşeronun yerine yenisi gelir. Uyarıda "Yine de kaydet"
  gerekir; ana taşeron ile kendi alt taşeronu çakışma sayılmaz. Kesin yasak
  istenirse `sozlesmeKaydet` içindeki onay adımı kaldırılır.
- **Taşeron silme yalnızca hiç kaydı yoksa** (günlük, hata, talep, teslimat,
  alt taşeron, giriş hesabı). Kaydı olan pasife alınır; geçmiş kaybolmaz.

## Saha kullanımı (pilot geri bildirimi, 2. tur)

- **Hatalı iş kişiye de yazılabilir** (kalfa, şef, merkez personeli).
  Anayasadaki "taşeron seçilmeden kayıt oluşmaz" kuralı kullanıcı isteğiyle
  "taşeron ya da kişi, biri zorunlu" oldu. Kişiye yazılan işi taşeronlar
  görmez; kişi kendi işini "Onaylandı" yapamaz, onayı başkası verir.
- **Günlükte birden çok kat ve birden çok iş** seçilir. İşler taşeronun iş
  türlerine göre başlıklı; kayıtta "Sıva: Kaba sıva" biçiminde durur.
- **Taşeronda birden çok yetkili** (ad + telefon), en çok 10.
- **Uzun seçim listeleri sayfada açık durmaz**: alanda seçilen görünür,
  dokununca alttan pencere açılır, "Tamam" ile kapanır
  (`SecimPenceresi`). 2–3 seçenekli, tek dokunuşluk alanlar (önem derecesi,
  Bugün/Dün, kişi sayısı eksi/artı) bilerek sayfada bırakıldı.
- **Ana sayfada isim/rol kutusu yok**; üstte yalnızca şantiye seçici ve çıkış.

## Şantiye ve taşeron görünürlüğü (saha denemesi)

- **Taşeron, görevli olduğu şantiyede görünür.** Görevli olmak = o şantiyede
  sözleşmesi olmak. İki şantiyede sözleşmesi varsa ikisinde de görünür.
  Firmanın bütün taşeronları her şantiyede listelenmez (kullanıcı kararı).
- **Şantiye girişte seçilir, oturum boyunca değişmez** (D8). Üstteki şantiye
  seçici, kullanıcının yanlışlıkla şantiye değiştirip farkında olmadan
  işlem yapmasına yol açtı. Başka şantiye için çıkış yapılıp yeniden girilir.
