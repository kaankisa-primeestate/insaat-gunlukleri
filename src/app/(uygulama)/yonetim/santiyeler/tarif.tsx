"use client";

import { useActionState, useState } from "react";
import { Building2, Minus, Plus, Trees, X } from "lucide-react";
import { Alan, Form, Girdi, KaydetButonu, Mesaj } from "@/components/form";
import { alanOzeti, type SantiyeAlani } from "@/lib/yerler";
import { santiyeKaydet } from "../eylemler";

/** Dokunarak eklenen hazır çevre alanları. Katlı olanlar katlarıyla gelir. */
const CEVRE_HAZIR: Omit<SantiyeAlani, "tur">[] = [
  { ad: "Otopark", bodrum: 2, zemin: false, kat: 0, cati: false },
  { ad: "Peyzaj / Bahçe", bodrum: 0, zemin: false, kat: 0, cati: false },
  { ad: "Çevre duvarı", bodrum: 0, zemin: false, kat: 0, cati: false },
  { ad: "Altyapı", bodrum: 0, zemin: false, kat: 0, cati: false },
  { ad: "Yollar", bodrum: 0, zemin: false, kat: 0, cati: false },
  { ad: "Havuz", bodrum: 0, zemin: false, kat: 0, cati: false },
  { ad: "Sosyal tesis", bodrum: 0, zemin: true, kat: 1, cati: false },
  { ad: "Dükkânlar", bodrum: 0, zemin: true, kat: 0, cati: false },
  { ad: "Sığınak", bodrum: 1, zemin: false, kat: 0, cati: false },
  { ad: "Güvenlik kulübesi", bodrum: 0, zemin: false, kat: 0, cati: false },
  { ad: "Şantiye alanı", bodrum: 0, zemin: false, kat: 0, cati: false },
];

const harfAdi = (i: number) => `${String.fromCharCode(65 + i)} Blok`;
const varsayilanAdlar = (n: number) => (n === 1 ? ["Bina"] : Array.from({ length: n }, (_, i) => harfAdi(i)));
const yeniBlok = (ad: string, ornek?: SantiyeAlani): SantiyeAlani => ({
  tur: "blok",
  ad,
  bodrum: ornek?.bodrum ?? 1,
  zemin: true,
  kat: ornek?.kat ?? 4,
  cati: ornek?.cati ?? true,
});
const ayniMi = (b: SantiyeAlani[]) => b.every((x) => x.bodrum === b[0].bodrum && x.kat === b[0].kat && x.cati === b[0].cati);

/**
 * Şantiye tarifi: ad, adres, bloklar, çevre alanları. Yeni şantiyede boş
 * gelir; mevcut şantiyede kayıtlı tarifle. Sonda önizleme gösterilir.
 */
export function SantiyeTarifi({
  santiye,
}: {
  santiye?: { id: string; ad: string; adres: string | null; alanlar: SantiyeAlani[] };
}) {
  const [durum, eylem, bekliyor] = useActionState(santiyeKaydet, undefined);
  const [bloklar, setBloklar] = useState<SantiyeAlani[]>(() => {
    const b = santiye?.alanlar.filter((a) => a.tur === "blok") ?? [];
    return b.length ? b : [yeniBlok("Bina")];
  });
  const [cevre, setCevre] = useState<SantiyeAlani[]>(() => santiye?.alanlar.filter((a) => a.tur === "cevre") ?? []);
  const [ayni, setAyni] = useState(() => ayniMi(bloklar));
  const [acikCevre, setAcikCevre] = useState<number | null>(null);

  function blokSayisi(n: number) {
    n = Math.max(1, Math.min(26, n));
    setBloklar((b) => {
      // Adlar hâlâ kendiliğinden verilmiş hâldeyse yeni sayıya göre yeniden adlandırılır.
      const kendiligindenMi = b.map((x) => x.ad).join("|") === varsayilanAdlar(b.length).join("|");
      const adlar = kendiligindenMi ? varsayilanAdlar(n) : null;
      const yeni = Array.from({ length: n }, (_, i) => {
        const eski = b[i] ?? yeniBlok(harfAdi(i), b[0]);
        return adlar ? { ...eski, ad: adlar[i] } : eski;
      });
      return yeni;
    });
  }
  function blokDegistir(i: number, d: Partial<SantiyeAlani>) {
    setBloklar((b) => b.map((x, j) => (ayni && !("ad" in d) ? { ...x, ...d } : j === i ? { ...x, ...d } : x)));
  }
  function cevreDegistir(i: number, d: Partial<SantiyeAlani>) {
    setCevre((c) => c.map((x, j) => (j === i ? { ...x, ...d } : x)));
  }
  function cevreEkle(h: Omit<SantiyeAlani, "tur"> | null) {
    setCevre((c) => [...c, h ? { ...h, tur: "cevre" } : { tur: "cevre", ad: "", bodrum: 0, zemin: false, kat: 0, cati: false }]);
    if (!h) setAcikCevre(cevre.length);
  }

  const eklenmemis = CEVRE_HAZIR.filter((h) => !cevre.some((c) => c.ad === h.ad));
  const tumu = [...bloklar, ...cevre];

  return (
    <Form eylem={eylem} bekliyor={bekliyor} className="flex flex-col gap-8">
      {santiye && <input type="hidden" name="id" value={santiye.id} />}
      <input type="hidden" name="alanlar" value={JSON.stringify(tumu)} />

      <section className="flex flex-col gap-4">
        <Baslik no={1} ad="Şantiye" />
        <Alan etiket="Şantiye adı" zorunlu>
          <Girdi name="ad" required maxLength={80} placeholder="Örn. Polenium Manzara" defaultValue={santiye?.ad} />
        </Alan>
        <Alan etiket="Adres">
          <Girdi name="adres" maxLength={200} defaultValue={santiye?.adres ?? ""} />
        </Alan>
      </section>

      <section className="flex flex-col gap-4">
        <Baslik no={2} ad="Binalar / bloklar" />
        <Alan etiket="Kaç blok var?" ipucu="Tek binalı şantiyede 1.">
          <Sayac deger={bloklar.length} en={1} ust={26} onChange={blokSayisi} etiket="Blok sayısı" />
        </Alan>

        {bloklar.length > 1 && (
          <Anahtar
            acik={ayni}
            onChange={(v) => {
              setAyni(v);
              if (v) setBloklar((b) => b.map((x) => ({ ...x, bodrum: b[0].bodrum, kat: b[0].kat, cati: b[0].cati })));
            }}
          >
            Bütün bloklar aynı (aynı kat sayısı)
          </Anahtar>
        )}

        {(ayni ? [bloklar[0]] : bloklar).map((b, i) => (
          <div key={i} className="flex flex-col gap-4 rounded-2xl border-2 border-cizgi p-4">
            {!ayni && bloklar.length > 1 && <p className="text-lg font-extrabold">{b.ad || `${i + 1}. blok`}</p>}
            <div className="grid grid-cols-2 gap-3">
              <Alan etiket="Bodrum kat">
                <Sayac deger={b.bodrum} en={0} ust={10} onChange={(v) => blokDegistir(i, { bodrum: v })} etiket="Bodrum kat" />
              </Alan>
              <Alan etiket="Normal kat" ipucu="Zemin hariç.">
                <Sayac deger={b.kat} en={0} ust={80} onChange={(v) => blokDegistir(i, { kat: v })} etiket="Normal kat" />
              </Alan>
            </div>
            <Anahtar acik={b.cati} onChange={(v) => blokDegistir(i, { cati: v })}>
              Çatı katı / teras var
            </Anahtar>
            <p className="text-soluk">{alanOzeti(b)}</p>
          </div>
        ))}

        {bloklar.length > 1 && (
          <Alan etiket="Blok adları" ipucu="İstediğiniz gibi değiştirebilirsiniz.">
            <div className="grid grid-cols-2 gap-2">
              {bloklar.map((b, i) => (
                <Girdi key={i} value={b.ad} maxLength={40} aria-label={`${i + 1}. blok adı`} onChange={(e) => blokDegistir(i, { ad: e.target.value })} />
              ))}
            </div>
          </Alan>
        )}
        {bloklar.length === 1 && (
          <Alan etiket="Bina adı" ipucu="Tek binada kayıtlara yalnız kat yazılır.">
            <Girdi value={bloklar[0].ad} maxLength={40} onChange={(e) => blokDegistir(0, { ad: e.target.value })} />
          </Alan>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <Baslik no={3} ad="Çevre alanları" />
        <p className="-mt-2 text-soluk">Binaların dışında iş yapılan yerler. Dokunarak ekleyin.</p>
        {cevre.length > 0 && (
          <ul className="flex flex-col gap-2">
            {cevre.map((c, i) => (
              <li key={i} className="rounded-2xl border-2 border-cizgi p-3">
                <div className="flex items-center gap-2">
                  <Girdi value={c.ad} maxLength={40} placeholder="Alan adı" aria-label="Alan adı" autoFocus={!c.ad} onChange={(e) => cevreDegistir(i, { ad: e.target.value })} />
                  <button type="button" aria-label={`${c.ad || "Alanı"} kaldır`} onClick={() => setCevre((x) => x.filter((_, j) => j !== i))} className="grid size-14 shrink-0 place-items-center rounded-xl border-2 border-cizgi text-kirmizi">
                    <X className="size-6" />
                  </button>
                </div>
                <button type="button" onClick={() => setAcikCevre(acikCevre === i ? null : i)} className="mt-2 min-h-11 font-semibold text-soluk underline">
                  {alanOzeti(c)} · katları {acikCevre === i ? "kapat" : "düzenle"}
                </button>
                {acikCevre === i && (
                  <div className="mt-2 flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Alan etiket="Bodrum / alt kat">
                        <Sayac deger={c.bodrum} en={0} ust={10} onChange={(v) => cevreDegistir(i, { bodrum: v })} etiket="Bodrum" />
                      </Alan>
                      <Alan etiket="Üst kat">
                        <Sayac deger={c.kat} en={0} ust={80} onChange={(v) => cevreDegistir(i, { kat: v })} etiket="Üst kat" />
                      </Alan>
                    </div>
                    <Anahtar acik={c.zemin} onChange={(v) => cevreDegistir(i, { zemin: v })}>
                      Zemin katı var
                    </Anahtar>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap gap-2">
          {eklenmemis.map((h) => (
            <button key={h.ad} type="button" onClick={() => cevreEkle(h)} className="flex min-h-12 items-center gap-1.5 rounded-full border-2 border-cizgi bg-yuzey px-4 font-bold">
              <Plus className="size-5" /> {h.ad}
            </button>
          ))}
          <button type="button" onClick={() => cevreEkle(null)} className="flex min-h-12 items-center gap-1.5 rounded-full border-2 border-dashed border-cizgi px-4 font-bold">
            <Plus className="size-5" /> Diğer (yazarak)
          </button>
        </div>
      </section>

      <section className="flex flex-col gap-2 rounded-2xl bg-yuzey p-4">
        <h2 className="text-lg font-extrabold">Önizleme</h2>
        <ul className="flex flex-col gap-1.5">
          {tumu.map((a, i) => (
            <li key={i} className="flex items-start gap-2">
              {a.tur === "blok" ? <Building2 className="mt-0.5 size-5 shrink-0" /> : <Trees className="mt-0.5 size-5 shrink-0 text-yesil" />}
              <span>
                <b>{a.ad || "(adsız)"}</b> <span className="text-soluk">· {alanOzeti(a)}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="text-sm text-soluk">
          Günlükte ve hatalı işte &quot;Yer&quot; seçerken bu liste çıkar. Sonradan değiştirebilirsiniz; eski kayıtlar bozulmaz.
        </p>
      </section>

      <Mesaj durum={durum} />
      <div className="sticky bottom-3">
        <KaydetButonu>{santiye ? "Değişiklikleri Kaydet" : "Şantiyeyi Oluştur"}</KaydetButonu>
      </div>
    </Form>
  );
}

function Baslik({ no, ad }: { no: number; ad: string }) {
  return (
    <h2 className="flex items-center gap-3 text-xl font-extrabold">
      <span className="grid size-9 place-items-center rounded-full bg-koyu text-base text-white">{no}</span>
      {ad}
    </h2>
  );
}

/** Eksi/artı ile sayı; küçük ekranda da yan yana sığar. */
function Sayac({ deger, en, ust, onChange, etiket }: { deger: number; en: number; ust: number; onChange: (v: number) => void; etiket: string }) {
  const ayarla = (v: number) => onChange(Math.max(en, Math.min(ust, v)));
  return (
    <div className="flex items-center gap-1.5">
      <button type="button" aria-label={`${etiket} azalt`} onClick={() => ayarla(deger - 1)} className="grid size-12 shrink-0 place-items-center rounded-xl bg-koyu text-white">
        <Minus className="size-6" strokeWidth={3} />
      </button>
      <input
        type="number"
        inputMode="numeric"
        aria-label={etiket}
        min={en}
        max={ust}
        value={deger}
        onChange={(e) => ayarla(Number(e.target.value) || 0)}
        className="min-h-12 w-full min-w-0 rounded-xl border-2 border-cizgi text-center text-2xl font-extrabold"
      />
      <button type="button" aria-label={`${etiket} artır`} onClick={() => ayarla(deger + 1)} className="grid size-12 shrink-0 place-items-center rounded-xl bg-koyu text-white">
        <Plus className="size-6" strokeWidth={3} />
      </button>
    </div>
  );
}

function Anahtar({ acik, onChange, children }: { acik: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={acik}
      onClick={() => onChange(!acik)}
      className="flex min-h-14 items-center justify-between gap-3 rounded-2xl border-2 border-cizgi px-4 text-left font-bold"
    >
      {children}
      <span className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${acik ? "bg-yesil" : "bg-cizgi"}`}>
        <span className={`absolute top-1 size-6 rounded-full bg-white shadow transition-all ${acik ? "left-7" : "left-1"}`} />
      </span>
    </button>
  );
}
