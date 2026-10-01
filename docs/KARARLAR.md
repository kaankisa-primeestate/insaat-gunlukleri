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

## Ana sayfa sadeleşti, fotoğraf her kayıtta (saha denemesi)

Anayasadan üç sapma, üçü de kullanıcı isteğiyle:

- **Kamera ana sayfadan bölüm sayfalarına taşındı.** Anayasa ana sayfada
  "Yeni Günlük Ekle + 📷" istiyordu; dört hızlı düğme (günlük, hatalı iş,
  talep, teslimat) bölüm kutularıyla aynı yere gidip yer kaplıyordu.
  Artık Günlükler, Hatalı İşler, Talepler ve Teslimat sayfalarının her
  birinde tek düğme var: **"➕ Yeni Ekle 📷"**. Fotoğraf alanı formun en
  üstünde; kamera formu açan dokunuşla değil, formdaki alana dokununca açılır.
- **Hatalı işte fotoğraf zorunlu değil** (anayasa: zorunlu). Kullanıcı:
  "isterse fotoğraf çekmeden de kaydedebilir". Talep (ürün fotoğrafı) ve
  teslimat kayıtlarına da isteğe bağlı fotoğraf eklendi, en çok 6.
- **Kaydet ana sayfaya değil, bölüm sayfasına döner** ve üstte
  "✓ Kaydedildi" yazar. Kullanıcı kaydın listeye düştüğünü görür; ikinci
  kaydı girmek için de tek dokunuş yeter.

## Ana sayfa tasarımı (27 Eylül)

- Dört öneri görüldü; **B "Bugün Kartı" seçildi**. Kullanıcı A "Grafit
  Başlık"ı da beğendi: A silinmedi, yedek olarak duruyor ve `/?tasarim=a`
  ile denenebiliyor. Sahada kullandıkça olgunlaşacak.
- Koyu tasarım (C) önerilmedi: anayasa güneş altında okunurluk için açık
  zemin istiyor.
- Ana sayfaya yeni bilgi: **"Bugün X / Y taşeron günlüğü girildi"** ve
  günlüğü henüz girilmeyen taşeronların adları. Y = şantiyede sözleşmesi olan
  taşeronlar (günlük formundaki liste). Sayaçlar dokunulunca bölüme gider.

## Sesle yazma ve hava durumu öne alındı (27 Eylül)

Kullanıcı isteğiyle Faz 2'den (A2, A3) öne çekildi.

- **Sesle yazma:** Tüm not/açıklama kutularının köşesinde mikrofon.
  Telefonun kendi tanıması kullanılır (Android'de Google, iPhone'da Siri),
  ücretsiz. Söylenen yazının sonuna eklenir, karakter sınırı aşılmaz.
  Desteklemeyen tarayıcıda düğme görünmez; klavyedeki mikrofon yine çalışır.
- **Hava durumu şantiye başına, gün başına tek kayıt.** Aynı günün beş
  günlüğü beş ayrı hava taşımaz; günlük listesinde gün başlığında görünür.
  Kaydı yalnızca sunucu yazar, kullanıcı değiştiremez (delil). Bugünün
  değeri tahmindir; gün bitince kesin değerle bir kez yenilenir.
- **Konum ilçe düzeyinde yeterli.** Merkez, Yönetim > Şantiyeler'de ilçe
  adıyla arar ya da şantiyedeyken telefonun konumunu kullanır. Adres
  alanından otomatik çıkarılmadı: serbest adres metni güvenilir biçimde
  koordinata çevrilemiyor (ücretsiz servis ilçe/şehir arıyor).
- **Öne çıkan değerler:** 1 mm ve üstü yağış (mavi), 40 km/s ve üstü rüzgâr
  (kırmızı). Beton, iskele ve vinç kararlarının dayanağı bunlar.
- **Sağlayıcı Open-Meteo, lisans uyarısıyla:** ücretsiz kullanımı ticari
  olmayan kullanım içindir. Pilot için seçildi çünkü geçmiş günleri de
  veriyor (geriye dönük günlük için gerekli). Satıştan önce değişmeli
  (ERTELENENLER S7).
- Open-Meteo en çok 92 gün geriye gider; daha eski tarihli günlüğün havası
  boş kalır.

## Hatalı iş / talep düzeltme ve kullanıcı düzenleme (28 Eylül, D2 + D4)

- **Günlükteki kurala bir şart eklendi:** kaydı giren kişi yalnız kayıt
  henüz işlem görmemişken düzeltir ya da siler (hatalı iş "Tespit", talep
  "Açıldı"). Taşeron işe başladıktan ya da satın alma yapıldıktan sonra
  içeriği değişen kayıt tartışma çıkarır; o noktadan sonra yalnız merkez.
  Gerekirse şart kaldırılır (`icerik_degisebilir`, göç 8).
- Silme kalıcıdır; durum geçmişi ve fotoğraflar da gider. Silinen talebe
  bağlı teslimat kalır, talep bağlantısı kalkar.
- Rol yalnız firma içi roller arasında değişir. Taşeron hesabı iç hesaba
  (ya da tersi) çevrilmez; görebildiği veri kökten değişir, yeni hesap açılır.

## Form düzeni (28 Eylül, saha geri bildirimi)

- **Tarih tek satır:** [Bugün] [Tarih seç]. "Dün" düğmesi ve ayrı tarih
  kutusu kalktı; "Tarih seç" telefonun takvimini açar, seçilen gün düğmede
  yazar. Günlük ve hatalı işte.
- **Not / açıklama kutusu büyük** (yaklaşık 6 satır) ve yazı uzadıkça uzuyor;
  kazanılan yer buraya verildi.
- **Mikrofon kullanıcı kapatana kadar dinler.** Önceki hâli her cümleden sonra
  kapanıyordu. Motor sessizlikte kendini kapatırsa program yeniden başlatır.
- **Kişi sayısında hızlı seçim (2-4-6…) kalktı;** yalnız − sayı +. Dokununca
  sayı seçili gelir, yazılan onun yerine geçer; silince "0" belirmez.

## Taşeron de kayıt ekler (28 Eylül, kullanıcı kararı)

- Taşeron hesabı artık günlük, hatalı iş, talep ve teslimat ekleyebilir.
  Önceden günlüğü yalnız görüyor, hatalı iş hiç bildiremiyordu.
- **Anayasadan sapma:** anayasada hatayı şef bildirir, taşeron düzeltir.
  Kullanıcı taşeronun da bildirebilmesini istedi. Sınırlar: taşeron yalnız
  kendi firmasına ve kendi alt taşeronuna iş yazar, personele (şef, kalfa)
  yazamaz, hiçbir işi onaylayamaz. Kendi açtığı kaydı 24 saat içinde ve
  "Tespit" durumundayken düzeltir.
- Varsayılandır; merkez bir firmayı o firmanın "Yetki" sekmesinden kısabilir.
- Alt taşeron tanımlama: merkez firmanın Düzenle formunda "Kendi alt
  taşeronunu tanımlayabilsin"i işaretler; taşeron Firmam > Alt taşeronlar >
  Alt Taşeron Ekle.

## Sesle yazma kapandı (28 Eylül)

Android, tanıma her başlayıp durduğunda sistem sesi ("bip") çalıyor; site
bunu kapatamıyor ve motor konuşurken de birkaç saniyede bir kendini
kapatıyor. Seçenekler konuşuldu (uzun dinleme + elle yeniden başlatma,
klavye mikrofonu, ücretli sunucu tanıması). Kullanıcı mevcut düğmeyle
birlikte uzun notlarda klavyenin mikrofonunu kullanıyor; sorun kapandı,
kodda değişiklik yapılmadı. Ücretli sunucu tanıması (sessiz, süresiz)
satış aşamasında yeniden düşünülebilir.

## Günlükler bilgisayarda da kart (29 Eylül)

- Bilgisayardaki günlük tablosu kalktı; kullanıcı "çok verimsiz" buldu.
  Telefondaki kartlar tam genişlikte, alt alta: 1. satır tarih · taşeron,
  2. satır kişi · kat · giren, sonra yapılan iş ve not boydan boya; fotoğraf
  sağda, Düzenle / Sil altta. Telefonda kart değişmedi.
- Taşeron adı tarih kadar büyük ve kalın (kullanıcı: daha vurgulu olsun).

## Karar Defteri (29 Eylül, kullanıcı kararı)

Sahada verilen kararın (ör. "D12 mutfak asma tavanı 2,60'ta biter") kiminle,
ne zaman verildiği ve en son hangisinin geçerli olduğu kaydedilir.

- Form Yeni Günlük ile aynı düzen: fotoğraf üstte, karar kutusunda mikrofon.
  Alanlar: kiminle (taşeron/personel + dışarıdan ad), tarih, yer (bloklu),
  daire no, mahal (Mutfak, Banyo, Salon, Yatak odası, Balkon, Koridor, Antre,
  Diğer yazarak), konu (iş türü), karar.
- Liste Günlükler gibi: güne göre alt alta kartlar, bilgisayarda tam genişlik.
  Arama (karar, yer, daire, mahal, konu) ve "değişmiş eski kararları da göster".
- Silsile: merkez tarafı (merkez, şef, kalfa) şantiyedeki her taşerona ve
  personele karar yazar ve hepsini görür; taşeron yalnız kendi alt
  taşeronlarına yazar; taşeron kendi açtığı ve muhatap olduğu kararları görür.
- "Okudum": muhatap kişi ya da firma (firmanın bir kullanıcısı) kendi
  hesabından onaylar; kimin ne zaman okuduğu tutulur, geri alınamaz. Onay
  bekleyen karar ana sayfada sayılır.
- Düzeltme (kullanıcının seçtiği A yolu): kimse okumadan önce kaydı giren
  düzeltir ve siler. Biri okuduktan sonra düzeltme kapanır; "Kararı değiştir"
  ile yeni sürüm yazılır, eskisi "Değişti" olarak kalır, yeni sürüm için
  onaylar baştan istenir. Okunmuş kararı yalnız merkez siler.
- Yetki matrisinde "Karar Defteri" satırı var; merkez kişi ya da firma bazında
  kısabilir.

## Taşeron sayfası tek sayfa; şantiye ve süre içinde (29 Eylül, kullanıcı kararı)

Kullanıcı taşeron oluştururken şantiye ve süreyi bulamadı. İnceleme: ilk
sürümden beri iki adımdı (taşeron formu → ayrı "Sözleşme Ekle" sayfası);
hiçbir alan silinmemişti, ama ikinci adım gözden kaçıyor ve atlanınca
taşeron hiçbir şantiyede görünmüyordu.

- Yeni Taşeron ve Düzenle tek sayfa, tek Kaydet: 1) Firma (ad, yaptığı işler,
  yetkililer, vergi, IBAN) 2) Çalıştığı şantiyeler: onay kutusu; işaretlenince
  işin tarifi, süre (Başlangıç + bitiş / Yer teslim + gün / Henüz belli
  değil), belge 3) Giriş hesabı (isteğe bağlı, yalnız yeni taşeronda,
  merkez) 4) Alt taşeron.
- Yeni taşeron en az bir şantiyeyle kaydedilir (alt taşeron hariç; o ana
  taşeronun şantiyelerinde görünür).
- Süre zorunlu; bitişi belli olmayan iş için "Henüz belli değil" seçilir.
  Bitiş boş kalır, gecikme uyarısı çalışmaz, sayfada "Süre girilmedi" yazar.
- Şantiyeden çıkarılan taşeronun sözleşmesi silinmez, "iş bitti" olur;
  geçmiş kayıtlar kalır. Sözleşme silme kaldırıldı (veritabanında da).
  İşi biten taşeron o şantiyenin seçim listelerinde **kalır**: sözleşme
  biter ama eksik/hatalı işteki sorumluluğu sürer (30 Eylül, kullanıcı).
- Günlükte düzeltme/silme kuralı aynen kalır: merkez her zaman, kaydı giren
  24 saat içinde (30 Eylül, kullanıcı A'yı seçti).
- Taşeron silme yalnız hiç kaydı olmayan (yanlış açılmış) taşeron için;
  Karar Defteri'nde adı geçen taşeron da silinmez.
- Aynı şantiyede aynı işi yapan başka taşeron varsa önce uyarı, "Yine de
  kaydet" ile geçilir (eskisi gibi).

## Hatalı işte revizyon notları, zaman çizelgesi (1 Ekim, kullanıcı kararı)

- Hatalı iş tespit edildikten sonraki her gelişme "Rev. 1, Rev. 2…" diye
  not düşülür: sorumluyla konuşuldu, nasıl yapılacağı kararlaştırıldı,
  düzeltildi… Not + isteğe bağlı fotoğraf; yazı kutusunda mikrofon var.
- Sayfadaki "Geçmiş" yerine **Zaman Çizelgesi**: durum değişiklikleri ve
  revizyonlar eskiden yeniye, tek akışta. Yazanın adı, taşeronsa firması.
- Not ekleyen: işin sorumlusu olan herkes = o işin durumunu
  değiştirebilenler (şantiyenin şefi, merkez, işin taşeronu ve ana
  taşeronu). Yalnız gören roller (satın alma) eklemez.
- Revizyon **silinmez**. Yazan 24 saat içinde, merkez her zaman düzeltir;
  düzeltilen notta "Düzenlendi · zaman · kişi" yazar.
- Durum düğmeleri ayrı kalır (not ile durum tek kayıtta birleştirilmedi).
- Listede kartın altında son revizyon görünür ("Rev. 3 · 1 Eki · …").
- Revizyonu olan hatalı işi yalnız merkez silebilir.
- Talep/Tedarik'e aynısı şimdilik yapılmadı; sahada oturursa taşınır.

## Karar Defteri: yer elle yazılır, tarih kendiliğinden (1 Ekim, kullanıcı kararı)

- Yer listede yoksa "Listede yok, yazarak gir" ile elle yazılır ("Bahçede
  otopark rampasının duvarı"). Yazılan listeye eklenmez. Düğme alanın
  altında, her zaman görünür: "Diğer" seçeneği çok bloklu şantiyede sekme
  şeridinin sonunda kalıp görünmüyordu.
- Tarih alanı kalktı: karar kaydedildiği gün. Düzeltmede ilk gün kalır,
  "Kararı değiştir" ile açılan yeni sürüm açıldığı günü alır.

## Karar Defteri revizyonları zaman çizelgesi (1 Ekim, kullanıcı kararı)

- "Kararı değiştir" artık **revizyon**: düğme "Rev. N Yap". Bir karar ve
  bütün revizyonları tek kartta, eskiden yeniye zaman çizelgesi: Karar,
  Rev. 1, Rev. 2… Hepsi açık; ilk ne kararlaştırıldığı ve neye evrildiği
  kaydırarak okunur. Geçerli olan en altta, yeşil.
- Her revizyonda muhataplar yeniden "Okudum" der; eski hâllerde kimin
  okuduğu görünür kalır.
- Gün gruplaması son revizyonun gününe göre. Arama, zincirin herhangi bir
  hâlinde geçen kelimeyle bütün kartı bulur. "Değişmiş eski kararları da
  göster" seçeneği kalktı (hepsi zaten ekranda).
- Eski revizyonlar silinmez (göç 14). Yalnız son hâl silinebilir; silinince
  önceki hâl yeniden geçerli olur.
- Veri yapısı aynı (onceki_id zinciri); ayrı not tablosu açılmadı.
