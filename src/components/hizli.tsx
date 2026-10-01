"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { CalendarDays, Camera, Check, List, PenLine, X } from "lucide-react";
import { bugun } from "@/lib/sabitler";
import { Alan, TarihSecici } from "./form";
import { FotoSecici } from "./foto-secici";

/*
 * Hızlı kayıt formlarının ortak parçaları (1 Ekim, kullanıcı kararı): asıl
 * alanlar (kim, ne, nerede, kaç) sırayla doldurulur; tarih ve fotoğraf gibi
 * ekler küçük düğme olarak durur, gerekince açılır.
 */

/** Formda sıradaki alana geç: ekrana getirir; `odak` ise yazı kutusuna imleci koyar. */
export function ilerle(id: string, odak = true) {
  setTimeout(() => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    const kutu = el.querySelector<HTMLElement>('input:not([type="hidden"]):not(.sr-only):not([type="radio"]):not([type="file"]), textarea');
    if (odak) kutu?.focus({ preventScroll: true });
  }, 120);
}

/**
 * Ek alan: kapalıyken küçük bir düğme ("📅 Tarih · Bugün"), dokununca içeriği
 * açılır. Açılan bir daha kapanmaz; girilen kaybolmasın.
 */
export function Ek({ simge, etiket, ozet, acik: ilk = false, children }: { simge: ReactNode; etiket: string; ozet?: string; acik?: boolean; children: ReactNode }) {
  const [acik, setAcik] = useState(ilk);
  if (acik) return <div className="basis-full">{children}</div>;
  return (
    <button
      type="button"
      onClick={() => setAcik(true)}
      className="flex min-h-12 items-center gap-2 rounded-full border-2 border-cizgi bg-yuzey px-4 font-bold"
    >
      {simge}
      {etiket}
      {ozet && <span className="font-semibold text-soluk">· {ozet}</span>}
    </button>
  );
}

/** Tarih eki: dokunulmazsa kayıt bugünün tarihini alır (sunucu atar). Geçmiş tarihli kayıt düzeltilirken açık gelir. */
export function TarihEki({ varsayilan }: { varsayilan?: string }) {
  const gecmis = Boolean(varsayilan && varsayilan !== bugun());
  return (
    <Ek simge={<CalendarDays className="size-5" />} etiket="Tarih" ozet="Bugün" acik={gecmis}>
      <Alan etiket="Tarih">
        <TarihSecici varsayilan={varsayilan} />
      </Alan>
    </Ek>
  );
}

/** Fotoğraf eki: nadiren gereken yerde (günlük) küçük düğme. */
export function FotoEki({ firmaId, klasor, mevcut = [] }: { firmaId: string; klasor: string; mevcut?: { yol: string; adres: string }[] }) {
  return (
    <Ek simge={<Camera className="size-5" />} etiket="Fotoğraf" acik={mevcut.length > 0}>
      <Alan etiket="Fotoğraf">
        <FotoSecici firmaId={firmaId} klasor={klasor} mevcut={mevcut} />
      </Alan>
    </Ek>
  );
}

/** Seçim alanının altında: "Listede yok, yazarak gir" / "Listeden seç". */
export function ElleDugmesi({ elle, onClick }: { elle: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex min-h-11 items-center gap-2 self-start font-bold text-yazi underline">
      {elle ? <List className="size-5" /> : <PenLine className="size-5" />}
      {elle ? "Listeden seç" : "Listede yok, yazarak gir"}
    </button>
  );
}

export type YazSecSecenek = { deger: string; ad: string; alt?: string; grup?: string };

/**
 * Yaz ya da listeden seç: üstte yazı kutusu, altında liste; yazdıkça liste
 * süzülür. Listeden seçilirse `secimAd` alanına kimliği gider; seçilmezse
 * yazılan metin `yaziAd` alanıyla gider. `secimAd` yoksa seçim yalnızca
 * kutuyu doldurur (ürün adı gibi).
 */
export function YazSec({
  yaziAd,
  secimAd,
  secenekler,
  varsayilanYazi = "",
  varsayilanSecim,
  placeholder,
  zorunlu = false,
  yazilamaz = false,
  sonra,
}: {
  yaziAd: string;
  secimAd?: string;
  secenekler: YazSecSecenek[];
  varsayilanYazi?: string;
  varsayilanSecim?: string;
  placeholder?: string;
  zorunlu?: boolean;
  /** Yalnız listeden seçilir (taşeron hesabı yazılı ad giremez). */
  yazilamaz?: boolean;
  sonra?: () => void;
}) {
  const [yazi, setYazi] = useState(varsayilanYazi);
  const [secim, setSecim] = useState<YazSecSecenek | undefined>(secenekler.find((s) => s.deger === varsayilanSecim));
  const denetim = useRef<HTMLInputElement>(null);

  const temiz = yazi.trim();
  const aranan = temiz.toLocaleLowerCase("tr");
  const tamEslesen = secenekler.find((s) => s.ad.toLocaleLowerCase("tr") === aranan);
  // Kimlik taşımayan seçimde (ürün) seçilen ad kutuya yazılır; liste kapanır.
  const secildi = secimAd ? Boolean(secim) : Boolean(tamEslesen);
  const gorunen = secildi ? [] : secenekler.filter((s) => !aranan || (s.ad + " " + (s.alt ?? "")).toLocaleLowerCase("tr").includes(aranan)).slice(0, 40);
  const gruplar = [...new Set(gorunen.map((s) => s.grup ?? ""))];

  const eksik = zorunlu && !secim && (yazilamaz || !temiz);
  useEffect(() => {
    denetim.current?.setCustomValidity(eksik ? (yazilamaz ? "Listeden seçin." : "Yazın ya da listeden seçin.") : "");
  }, [eksik, yazilamaz]);

  function sec(s: YazSecSecenek) {
    if (secimAd) setSecim(s);
    setYazi(s.ad);
    sonra?.();
  }

  return (
    <div className="flex flex-col gap-2">
      {secimAd && secim ? (
        <div className="flex min-h-16 items-center gap-2 rounded-xl border-2 border-yazi bg-koyu px-4 text-white">
          <Check className="size-6 shrink-0" strokeWidth={3} />
          <span className="min-w-0 flex-1 text-lg font-bold break-words">{secim.ad}</span>
          <button
            type="button"
            onClick={() => {
              setSecim(undefined);
              setYazi("");
            }}
            className="flex min-h-11 items-center gap-1 rounded-lg bg-white/15 px-3 font-bold"
          >
            <X className="size-5" /> Değiştir
          </button>
          <input type="hidden" name={secimAd} value={secim.deger} />
        </div>
      ) : (
        !yazilamaz && (
          <input
            name={yaziAd}
            value={yazi}
            maxLength={80}
            autoComplete="off"
            placeholder={placeholder}
            onChange={(e) => setYazi(e.target.value)}
            className="min-h-14 w-full rounded-xl border-2 border-cizgi bg-zemin px-4 text-lg text-yazi placeholder:text-soluk focus:border-mavi focus:outline-none"
          />
        )
      )}
      {/* Listedeki ad elle tam yazıldıysa seçilmiş sayılır: taşeron yazılı ad olarak kalmasın. */}
      {secimAd && !secim && tamEslesen && <input type="hidden" name={secimAd} value={tamEslesen.deger} />}
      <input ref={denetim} type="text" tabIndex={-1} aria-hidden className="sr-only" value="" onChange={() => {}} />

      {!secildi && temiz && !yazilamaz && !tamEslesen && (
        <p className="flex items-center gap-2 rounded-lg bg-yuzey px-3 py-2 text-sm font-semibold">
          <PenLine className="size-4 shrink-0" /> “{temiz}” olarak yazılacak; listeden de seçebilirsiniz.
        </p>
      )}
      {gruplar.map((g) => (
        <div key={g} className="flex flex-col gap-1.5">
          {g && <p className="text-sm font-bold tracking-wide text-soluk uppercase">{g}</p>}
          <div className="flex flex-wrap gap-2">
            {gorunen
              .filter((s) => (s.grup ?? "") === g)
              .map((s) => (
                <button
                  key={s.deger}
                  type="button"
                  onClick={() => sec(s)}
                  className="flex min-h-12 max-w-full flex-col justify-center rounded-xl border-2 border-cizgi bg-yuzey px-3 py-1.5 text-left"
                >
                  <span className="font-bold break-words">{s.ad}</span>
                  {s.alt && <span className="text-xs text-soluk">{s.alt}</span>}
                </button>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const gunEkle = (gun: string, n: number) => {
  const d = new Date(gun + "T12:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

/** Termin: Belli değil (varsayılan) · Bugün · Yarın · Bu hafta (pazar) · Tarih seç. */
export function TerminSecici({ ad = "termin", varsayilan }: { ad?: string; varsayilan?: string | null }) {
  const b = bugun();
  const secenekler = [
    { kod: "", ad: "Belli değil" },
    { kod: b, ad: "Bugün" },
    { kod: gunEkle(b, 1), ad: "Yarın" },
    { kod: gunEkle(b, (7 - new Date(b + "T12:00:00").getDay()) % 7 || 7), ad: "Bu hafta" },
  ];
  const [deger, setDeger] = useState(varsayilan ?? "");
  const hazir = secenekler.some((s) => s.kod === deger);
  const [y, a, g] = deger.split("-");
  const dugme = (on: boolean) =>
    `flex min-h-12 items-center justify-center gap-1.5 rounded-xl border-2 px-3 font-bold ${on ? "border-yazi bg-koyu text-white" : "border-cizgi bg-yuzey"}`;
  return (
    <div className="flex flex-wrap gap-2">
      {secenekler.map((s) => (
        <button key={s.ad} type="button" aria-pressed={deger === s.kod} onClick={() => setDeger(s.kod)} className={dugme(deger === s.kod)}>
          {s.ad}
        </button>
      ))}
      <label className={`relative cursor-pointer ${dugme(!hazir)}`}>
        <CalendarDays className="size-5" aria-hidden />
        {hazir ? "Tarih seç" : `${g}.${a}.${y}`}
        <input
          type="date"
          min={b}
          value={deger}
          aria-label="Termin tarihi seç"
          onChange={(e) => setDeger(e.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </label>
      <input type="hidden" name={ad} value={deger} />
    </div>
  );
}
