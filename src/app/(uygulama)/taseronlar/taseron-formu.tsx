"use client";

import { useActionState, useState } from "react";
import { Building2, KeyRound, MapPin, Plus, Trash2, TriangleAlert, Users } from "lucide-react";
import { Alan, Form, Girdi, KaydetButonu, Mesaj } from "@/components/form";
import { SecimPenceresi } from "@/components/secim-penceresi";
import { BelgeYukleyici } from "@/components/belge-yukleyici";
import { IS_TURU_LISTESI, bugun, tarihYaz } from "@/lib/sabitler";
import { taseronKaydet } from "./eylemler";

export type Yetkili = { ad: string; telefon: string };

export type TaseronBilgi = {
  id?: string;
  firma_adi?: string;
  yetkililer?: Yetkili[];
  vergi_no?: string | null;
  iban?: string | null;
  is_turleri?: string[];
  ust_taseron_id?: string | null;
  alt_taseron_yetkisi?: boolean;
};

/** Taşeronun bir şantiyedeki sözleşmesi (çalıştığı şantiye ve süresi). */
export type Sozlesme = {
  id: string;
  santiye_id: string;
  is_tarifi: string;
  baslangic: string | null;
  bitis: string | null;
  yer_teslim: string | null;
  sure_gun: number | null;
  sure_belirsiz: boolean;
  belge_yolu: string | null;
  tamamlandi: boolean;
};

/**
 * Taşeronun tek sayfası: firma bilgileri, çalıştığı şantiyeler (her birinin
 * işi ve süresi), isteğe bağlı giriş hesabı ve alt taşeron ayarı. Yeni
 * taşeronda ve düzenlemede aynı form; tek "Kaydet".
 */
export function TaseronFormu({
  deger = {},
  anaTaseronlar,
  altTaseronModu,
  santiyeler = [],
  sozlesmeler = [],
  firmaId,
  hesapAcilabilir,
}: {
  deger?: TaseronBilgi;
  anaTaseronlar: { id: string; firma_adi: string }[];
  /** Ana taşeron kendi alt taşeronunu açıyor: şantiye ve hesap bölümü yok. */
  altTaseronModu?: boolean;
  santiyeler?: { id: string; ad: string }[];
  sozlesmeler?: Sozlesme[];
  firmaId?: string;
  /** Yeni taşeronda merkez giriş hesabını da burada açabilir. */
  hesapAcilabilir?: boolean;
}) {
  const [durum, eylem, bekliyor] = useActionState(taseronKaydet, undefined);
  const [isler, setIsler] = useState<string[]>(deger.is_turleri ?? []);
  const santiyeBolumu = !altTaseronModu && santiyeler.length > 0;

  return (
    <Form eylem={eylem} bekliyor={bekliyor} className="flex flex-col gap-8">
      {deger.id && <input type="hidden" name="id" value={deger.id} />}

      <Bolum no={1} ad="Firma" ikon={<Building2 />}>
        <Alan etiket="Firma adı" zorunlu>
          <Girdi name="firma_adi" required maxLength={120} defaultValue={deger.firma_adi} />
        </Alan>
        <Alan etiket="Yaptığı işler" zorunlu ipucu="Birden fazla seçebilirsiniz.">
          <SecimPenceresi
            ad="is_turleri"
            baslik="Yaptığı işler"
            coklu
            zorunlu
            sutun={2}
            bosYazi="İş seçmek için dokunun"
            varsayilan={deger.is_turleri}
            secenekler={IS_TURU_LISTESI.map((t) => ({ deger: t, ad: t }))}
            onChange={setIsler}
          />
        </Alan>
        <Alan etiket="Yetkililer" ipucu="Aynı firmada birden fazla yetkili ve telefon girebilirsiniz.">
          <Yetkililer baslangic={deger.yetkililer ?? []} />
        </Alan>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Alan etiket="Vergi no">
            <Girdi name="vergi_no" inputMode="numeric" maxLength={20} defaultValue={deger.vergi_no ?? ""} />
          </Alan>
          <Alan etiket="IBAN">
            <Girdi name="iban" maxLength={40} placeholder="TR.." defaultValue={deger.iban ?? ""} autoCapitalize="characters" />
          </Alan>
        </div>
      </Bolum>

      {santiyeBolumu && (
        <Bolum no={2} ad="Çalıştığı şantiyeler" ikon={<MapPin />} id="santiyeler">
          <p className="-mt-2 text-soluk">
            İşaretleyin; her şantiye için işi ve süresini girin. Taşeron yalnız işaretli şantiyelerde listelenir ve yalnız onların
            bilgilerini görür. İşaret kaldırılırsa sözleşme silinmez, &quot;iş bitti&quot; olarak kapanır.
          </p>
          <div className="flex flex-col gap-3">
            {santiyeler.map((s) => (
              <SantiyeBlogu
                key={s.id}
                santiye={s}
                sozlesme={sozlesmeler.find((x) => x.santiye_id === s.id)}
                isler={isler}
                firmaId={firmaId!}
              />
            ))}
          </div>
        </Bolum>
      )}

      {hesapAcilabilir && (
        <Bolum no={santiyeBolumu ? 3 : 2} ad="Giriş hesabı" ikon={<KeyRound />}>
          <p className="-mt-2 text-soluk">
            İsteğe bağlı. Taşeron yetkilisi kendi telefonundan girip kayıtlarını görsün diye. Sonradan taşeron sayfasındaki
            &quot;Hesaplar&quot; sekmesinden de açılabilir.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Alan etiket="Kullanıcı adı" ipucu="Küçük harf, Türkçe karaktersiz. Örn. mehmet.kalip">
              <Girdi name="hesap_kullanici" maxLength={32} autoCapitalize="none" autoCorrect="off" spellCheck={false} autoComplete="off" />
            </Alan>
            <Alan etiket="Şifre" ipucu="En az 6 karakter.">
              <Girdi name="hesap_sifre" minLength={6} autoComplete="new-password" />
            </Alan>
          </div>
          <Alan etiket="Hesap sahibinin adı" ipucu="Boş bırakılırsa ilk yetkilinin adı kullanılır.">
            <Girdi name="hesap_ad" maxLength={80} />
          </Alan>
        </Bolum>
      )}

      {!altTaseronModu && (
        <Bolum no={(santiyeBolumu ? 3 : 2) + (hesapAcilabilir ? 1 : 0)} ad="Alt taşeron" ikon={<Users />}>
          <Alan etiket="Ana taşeron" ipucu="Bu firma başka bir taşeronun alt taşeronuysa seçin. Ana taşeron alt taşeronunu görür, tersi olmaz.">
            <SecimPenceresi
              ad="ust_taseron_id"
              baslik="Ana taşeron"
              bosYazi="Yok, doğrudan firmaya bağlı"
              varsayilan={deger.ust_taseron_id ? [deger.ust_taseron_id] : []}
              secenekler={[
                { deger: "", ad: "Yok, doğrudan firmaya bağlı" },
                ...anaTaseronlar.filter((t) => t.id !== deger.id).map((t) => ({ deger: t.id, ad: t.firma_adi })),
              ]}
            />
          </Alan>
          <label className="flex min-h-14 items-center gap-3 rounded-xl border-2 border-cizgi bg-yuzey px-4 font-semibold">
            <input type="checkbox" name="alt_taseron_yetkisi" defaultChecked={deger.alt_taseron_yetkisi} className="size-7 shrink-0 accent-yesil" />
            Kendi alt taşeronunu tanımlayabilsin
          </label>
        </Bolum>
      )}

      <Mesaj durum={durum} />
      {durum?.uyari ? (
        <div className="flex flex-col gap-2">
          <button type="submit" name="onay" value="1" className="flex min-h-16 items-center justify-center gap-2 rounded-2xl bg-sari text-lg font-bold text-black">
            <TriangleAlert className="size-6" /> Yine de kaydet
          </button>
          <p className="text-center text-sm text-soluk">ya da yukarıdaki bilgileri değiştirip tekrar kaydedin</p>
        </div>
      ) : (
        <div className="sticky bottom-3">
          <KaydetButonu>{deger.id ? "Değişiklikleri Kaydet" : "Taşeronu Kaydet"}</KaydetButonu>
        </div>
      )}
    </Form>
  );
}

function Bolum({ no, ad, ikon, id, children }: { no: number; ad: string; ikon: React.ReactNode; id?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="flex scroll-mt-20 flex-col gap-4">
      <h2 className="flex items-center gap-3 text-xl font-extrabold">
        <span className="grid size-9 place-items-center rounded-full bg-koyu text-base text-white">{no}</span>
        {ad}
        <span className="text-soluk [&_svg]:size-6">{ikon}</span>
      </h2>
      {children}
    </section>
  );
}

const gunEkle = (t: string, gun: number) => {
  const d = new Date(t + "T12:00:00");
  d.setDate(d.getDate() + gun);
  return d.toISOString().slice(0, 10);
};
const gunFarki = (a: string, b: string) => Math.round((Date.parse(a + "T12:00:00") - Date.parse(b + "T12:00:00")) / 86400000);

/**
 * Bir şantiye: onay kutusu; işaretliyse işin tarifi, süresi ve belgesi.
 * Alan adları şantiye kimliğiyle ayrılır (s.<kimlik>.alan).
 */
function SantiyeBlogu({
  santiye,
  sozlesme,
  isler,
  firmaId,
}: {
  santiye: { id: string; ad: string };
  sozlesme?: Sozlesme;
  isler: string[];
  firmaId: string;
}) {
  const on = `s.${santiye.id}.`;
  const [secili, setSecili] = useState(Boolean(sozlesme && !sozlesme.tamamlandi));
  const [tur, setTur] = useState<"net" | "sure" | "belirsiz">(
    sozlesme?.sure_belirsiz ? "belirsiz" : sozlesme?.yer_teslim ? "sure" : "net",
  );
  const [baslangic, setBaslangic] = useState(sozlesme?.yer_teslim ? "" : (sozlesme?.baslangic ?? ""));
  const [bitis, setBitis] = useState(sozlesme?.bitis ?? "");
  const [yerTeslim, setYerTeslim] = useState(sozlesme?.yer_teslim ?? sozlesme?.baslangic ?? "");
  const [sure, setSure] = useState(sozlesme?.sure_gun ? String(sozlesme.sure_gun) : "");
  const [tarif, setTarif] = useState(sozlesme?.is_tarifi ?? "");
  const [belgeKaldir, setBelgeKaldir] = useState(false);

  const varsayilanTarif = isler.filter((t) => t !== "Diğer");
  const gun = Number(sure);
  const hesap = tur === "net" ? bitis || null : tur === "sure" && yerTeslim && gun > 0 ? gunEkle(yerTeslim, gun) : null;
  const kalan = hesap ? gunFarki(hesap, bugun()) : null;
  const dugme = (aktif: boolean) =>
    `min-h-14 rounded-xl border-2 px-2 text-sm font-bold leading-tight ${aktif ? "border-yazi bg-koyu text-white" : "border-cizgi bg-zemin"}`;

  return (
    <div className={`rounded-2xl border-2 ${secili ? "border-yazi" : "border-cizgi"}`}>
      <label className="flex min-h-16 cursor-pointer items-center gap-3 px-4">
        <input
          type="checkbox"
          name={on + "secili"}
          checked={secili}
          onChange={(e) => {
            setSecili(e.target.checked);
            if (e.target.checked && !tarif && varsayilanTarif.length) setTarif(`${varsayilanTarif.join(", ")} işleri`);
          }}
          className="size-7 shrink-0 accent-yesil"
        />
        <span className="flex-1 text-lg font-extrabold">{santiye.ad}</span>
        {sozlesme?.tamamlandi && !secili && <span className="rounded-lg bg-gri-acik px-2 py-0.5 text-sm font-bold">İş bitti</span>}
        {sozlesme && !sozlesme.tamamlandi && !secili && (
          <span className="rounded-lg bg-sari px-2 py-0.5 text-sm font-bold text-black">Kaydedince &quot;iş bitti&quot; olur</span>
        )}
      </label>
      {sozlesme && <input type="hidden" name={on + "sozlesme"} value={sozlesme.id} />}

      {secili && (
        <div className="flex flex-col gap-4 border-t-2 border-cizgi p-4">
          <Alan etiket="İşin tarifi" zorunlu>
            <Girdi name={on + "tarif"} required maxLength={500} value={tarif} onChange={(e) => setTarif(e.target.value)} placeholder="Örn. Kalıp işleri, B blok" />
          </Alan>

          <Alan etiket="Süre" zorunlu>
            <div className="grid grid-cols-3 gap-2">
              <button type="button" onClick={() => setTur("net")} className={dugme(tur === "net")}>
                Başlangıç + bitiş
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!yerTeslim && baslangic) setYerTeslim(baslangic);
                  setTur("sure");
                }}
                className={dugme(tur === "sure")}
              >
                Yer teslim + gün
              </button>
              <button type="button" onClick={() => setTur("belirsiz")} className={dugme(tur === "belirsiz")}>
                Henüz belli değil
              </button>
            </div>
            <input type="hidden" name={on + "tur"} value={tur} />

            {tur === "net" && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 font-semibold">
                  Başlangıç
                  <Girdi type="date" name={on + "baslangic"} value={baslangic} onChange={(e) => setBaslangic(e.target.value)} />
                </label>
                <label className="flex flex-col gap-1 font-semibold">
                  Bitiş *
                  <Girdi type="date" name={on + "bitis"} required value={bitis} min={baslangic || undefined} onChange={(e) => setBitis(e.target.value)} />
                </label>
              </div>
            )}
            {tur === "sure" && (
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="flex flex-col gap-1 font-semibold">
                    Yer teslim *
                    <Girdi type="date" name={on + "yer_teslim"} required value={yerTeslim} onChange={(e) => setYerTeslim(e.target.value)} />
                  </label>
                  <label className="flex flex-col gap-1 font-semibold">
                    Süre (gün) *
                    <Girdi type="number" name={on + "sure_gun"} inputMode="numeric" min={1} max={3650} required value={sure} onChange={(e) => setSure(e.target.value)} />
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    [30, "1 ay"],
                    [60, "2 ay"],
                    [90, "3 ay"],
                    [180, "6 ay"],
                    [365, "1 yıl"],
                  ].map(([g, ad]) => (
                    <button key={g} type="button" onClick={() => setSure(String(g))} className={dugme(sure === String(g)) + " px-4"}>
                      {ad}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {tur === "belirsiz" && (
              <div className="flex flex-col gap-2">
                <label className="flex flex-col gap-1 font-semibold">
                  İşe başlama
                  <Girdi type="date" name={on + "baslangic"} value={yerTeslim} onChange={(e) => setYerTeslim(e.target.value)} />
                </label>
                <p className="rounded-xl bg-sari px-4 py-3 font-semibold text-black">
                  Bitiş belli olunca buradan girin. O zamana kadar gecikme uyarısı çalışmaz; listede &quot;süre girilmedi&quot; görünür.
                </p>
              </div>
            )}
            {hesap && kalan != null && (
              <p className={`rounded-xl px-4 py-3 text-lg font-bold ${kalan <= 7 ? "bg-kirmizi text-white" : "bg-koyu text-white"}`}>
                Bitiş: {tarihYaz(hesap)}
                <span className="block text-base font-semibold">
                  {kalan < 0 ? `${-kalan} gün önce bitmiş` : kalan === 0 ? "Bugün bitiyor" : `${kalan} gün sonra`}
                  {kalan <= 7 && ", tarih doğru mu kontrol edin"}
                </span>
              </p>
            )}
          </Alan>

          <Alan etiket="Sözleşme belgesi" ipucu="İsteğe bağlı.">
            {sozlesme?.belge_yolu && !belgeKaldir && (
              <div className="flex min-h-14 items-center gap-2 rounded-xl bg-yuzey px-4">
                <span className="flex-1 font-semibold">Kayıtlı belge var</span>
                <button type="button" onClick={() => setBelgeKaldir(true)} className="min-h-12 rounded-xl border-2 border-cizgi px-3 font-semibold">
                  Kaldır
                </button>
              </div>
            )}
            {belgeKaldir && <input type="hidden" name={on + "belge_kaldir"} value="1" />}
            <BelgeYukleyici firmaId={firmaId} ad={on + "belge"} />
          </Alan>
        </div>
      )}
    </div>
  );
}

/** Yetkili satırları: ad + telefon, satır eklenip çıkarılabilir. */
function Yetkililer({ baslangic }: { baslangic: Yetkili[] }) {
  const [satirlar, setSatirlar] = useState(() =>
    (baslangic.length ? baslangic : [{ ad: "", telefon: "" }]).map((y) => ({ ...y, anahtar: crypto.randomUUID() })),
  );
  return (
    <div className="flex flex-col gap-3">
      {satirlar.map((y, i) => (
        <div key={y.anahtar} className="flex flex-col gap-2 rounded-xl border-2 border-cizgi p-3">
          <div className="flex items-center justify-between">
            <span className="font-bold">{i + 1}. yetkili</span>
            {satirlar.length > 1 && (
              <button
                type="button"
                aria-label={`${i + 1}. yetkiliyi kaldır`}
                onClick={() => setSatirlar((l) => l.filter((x) => x.anahtar !== y.anahtar))}
                className="grid size-11 place-items-center rounded-xl text-kirmizi active:bg-yuzey"
              >
                <Trash2 className="size-6" />
              </button>
            )}
          </div>
          <Girdi name="yetkili_ad" placeholder="Ad soyad" maxLength={80} defaultValue={y.ad} autoComplete="off" />
          <Girdi name="yetkili_tel" placeholder="Telefon" type="tel" inputMode="tel" maxLength={20} defaultValue={y.telefon} autoComplete="off" />
        </div>
      ))}
      {satirlar.length < 10 && (
        <button
          type="button"
          onClick={() => setSatirlar((l) => [...l, { ad: "", telefon: "", anahtar: crypto.randomUUID() }])}
          className="flex min-h-14 items-center justify-center gap-2 rounded-xl border-2 border-dashed border-cizgi font-bold"
        >
          <Plus className="size-6" /> Yetkili ekle
        </button>
      )}
    </div>
  );
}
