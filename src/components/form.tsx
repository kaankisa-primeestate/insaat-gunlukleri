"use client";

import { useFormStatus } from "react-dom";
import { createContext, startTransition, useContext, useState, type ReactNode, type Ref } from "react";
import { Check, LoaderCircle } from "lucide-react";
import { bugun } from "@/lib/sabitler";

export type FormDurumu = { hata?: string; tamam?: string; uyari?: string } | undefined;

const BekliyorBaglami = createContext(false);

/**
 * Sunucu işlemine giden form. React 19 `<form action>` kullanıldığında işlem
 * bitince formu sıfırlar: hata ya da uyarı dönse bile kullanıcının seçtiği
 * şantiye, taşeron, kat gibi alanlar varsayılana döner ve tekrar gönderimde
 * yanlış değer kaydedilir. Bu bileşen gönderimi kendisi yapar, form sıfırlanmaz.
 * Tarayıcının zorunlu alan denetimi yine çalışır (submit olayı ondan sonra gelir).
 */
export function Form({
  eylem,
  bekliyor,
  onayla,
  className,
  children,
  ref,
}: {
  eylem: (form: FormData) => void;
  bekliyor: boolean;
  /** Doluysa göndermeden önce bu soruyla onay istenir. */
  onayla?: string;
  className?: string;
  children: ReactNode;
  ref?: Ref<HTMLFormElement>;
}) {
  return (
    <BekliyorBaglami.Provider value={bekliyor}>
      <form
        ref={ref}
        className={className}
        onSubmit={(e) => {
          e.preventDefault();
          if (bekliyor) return;
          if (onayla && !confirm(onayla)) return;
          const veri = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter);
          startTransition(() => eylem(veri));
        }}
      >
        {children}
      </form>
    </BekliyorBaglami.Provider>
  );
}

export function KaydetButonu({ children = "Kaydet", renk = "vurgu" }: { children?: ReactNode; renk?: "vurgu" | "koyu" | "kirmizi" | "yesil" }) {
  const { pending: formBekliyor } = useFormStatus();
  const pending = useContext(BekliyorBaglami) || formBekliyor;
  const renkler = {
    vurgu: "bg-vurgu text-black",
    koyu: "bg-koyu text-white",
    kirmizi: "bg-kirmizi text-white",
    yesil: "bg-yesil text-white",
  };
  return (
    <button
      type="submit"
      disabled={pending}
      className={`${renkler[renk]} flex min-h-16 w-full items-center justify-center gap-2 rounded-2xl px-4 text-xl font-bold shadow-sm active:scale-[0.98] disabled:opacity-60`}
    >
      {pending ? <LoaderCircle className="size-6 animate-spin" /> : <Check className="size-6" strokeWidth={3} />}
      {pending ? "Kaydediliyor…" : children}
    </button>
  );
}

export function Mesaj({ durum }: { durum: FormDurumu }) {
  if (!durum?.hata && !durum?.tamam && !durum?.uyari) return null;
  const sinif = durum.hata ? "bg-kirmizi text-white" : durum.uyari ? "bg-sari text-black" : "bg-yesil text-white";
  return (
    <p role="alert" className={`rounded-xl px-4 py-3 text-base font-semibold ${sinif}`}>
      {durum.hata ?? durum.uyari ?? durum.tamam}
    </p>
  );
}

export function Alan({ etiket, zorunlu, children, ipucu }: { etiket: string; zorunlu?: boolean; children: ReactNode; ipucu?: string }) {
  return (
    <fieldset className={`flex flex-col gap-2 ${zorunlu ? "rounded-2xl border-l-4 border-vurgu pl-3" : ""}`}>
      <legend className="mb-2 text-lg font-bold">
        {etiket}
        {zorunlu && <span className="ml-2 rounded-md bg-vurgu px-2 py-0.5 text-sm font-bold text-black">Zorunlu</span>}
      </legend>
      {children}
      {ipucu && <p className="text-sm text-soluk">{ipucu}</p>}
    </fieldset>
  );
}

const girdiSinifi =
  "min-h-14 w-full rounded-xl border-2 border-cizgi bg-zemin px-4 text-lg text-yazi placeholder:text-soluk focus:border-mavi focus:outline-none";

export function Girdi(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${girdiSinifi} ${props.className ?? ""}`} />;
}

export function Metin(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={2} {...props} className={`${girdiSinifi} py-3 ${props.className ?? ""}`} />;
}

export function Liste(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${girdiSinifi} ${props.className ?? ""}`} />;
}

type Secenek = { deger: string; ad: ReactNode; renk?: string };

/**
 * Büyük dokunmatik seçenekler. Altta gerçek radyo düğmeleri var; form
 * JavaScript'siz de gönderilir, klavyeyle de gezilir.
 */
export function Secim({
  ad,
  secenekler,
  varsayilan,
  zorunlu,
  sutun = 3,
  onChange,
}: {
  ad: string;
  secenekler: Secenek[];
  varsayilan?: string;
  zorunlu?: boolean;
  sutun?: 1 | 2 | 3 | 4;
  onChange?: (deger: string) => void;
}) {
  const izgara = { 1: "grid-cols-1", 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4" }[sutun];
  return (
    <div className={`grid ${izgara} gap-2`}>
      {secenekler.map((s) => (
        <label key={s.deger} className="min-w-0 cursor-pointer">
          <input
            type="radio"
            name={ad}
            value={s.deger}
            defaultChecked={varsayilan === s.deger}
            required={zorunlu}
            onChange={() => onChange?.(s.deger)}
            className="peer sr-only"
          />
          <span
            className={`flex min-h-14 items-center justify-center rounded-xl border-2 border-cizgi bg-yuzey px-2 py-2 text-center text-base font-semibold break-words peer-checked:border-yazi peer-checked:ring-2 peer-checked:ring-yazi peer-focus-visible:outline-3 peer-focus-visible:outline-mavi ${
              s.renk ?? "peer-checked:bg-koyu peer-checked:text-white"
            }`}
          >
            {s.ad}
          </span>
        </label>
      ))}
    </div>
  );
}

/** Birden fazla seçilebilen büyük düğmeler (onay kutusu). */
export function CokluSecim({
  ad,
  secenekler,
  varsayilan = [],
  sutun = 3,
}: {
  ad: string;
  secenekler: Secenek[];
  varsayilan?: string[];
  sutun?: 2 | 3 | 4;
}) {
  const izgara = { 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4" }[sutun];
  return (
    <div className={`grid ${izgara} gap-2`}>
      {secenekler.map((s) => (
        <label key={s.deger} className="min-w-0 cursor-pointer">
          <input type="checkbox" name={ad} value={s.deger} defaultChecked={varsayilan.includes(s.deger)} className="peer sr-only" />
          <span className="flex min-h-14 items-center justify-center rounded-xl border-2 border-cizgi bg-yuzey px-2 py-2 text-center text-base font-semibold break-words peer-checked:border-yazi peer-checked:bg-koyu peer-checked:text-white peer-checked:ring-2 peer-checked:ring-yazi peer-focus-visible:outline-3 peer-focus-visible:outline-mavi">
            {s.ad}
          </span>
        </label>
      ))}
    </div>
  );
}

/** Tarih seçici: bugün varsayılan, geçmiş seçilebilir, ileri tarih kapalı. */
export function TarihSecici({ ad = "is_tarihi", varsayilan }: { ad?: string; varsayilan?: string }) {
  const b = bugun();
  const [deger, setDeger] = useState(varsayilan ?? b);
  const dun = new Date(b + "T12:00:00");
  dun.setDate(dun.getDate() - 1);
  const dunStr = dun.toISOString().slice(0, 10);
  const gecmis = deger < b;
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        {[
          { d: b, ad: "Bugün" },
          { d: dunStr, ad: "Dün" },
        ].map((x) => (
          <button
            key={x.d}
            type="button"
            onClick={() => setDeger(x.d)}
            className={`min-h-14 rounded-xl border-2 text-base font-semibold ${
              deger === x.d ? "border-yazi bg-koyu text-white" : "border-cizgi bg-yuzey"
            }`}
          >
            {x.ad}
          </button>
        ))}
      </div>
      <Girdi type="date" name={ad} value={deger} max={b} required onChange={(e) => setDeger(e.target.value)} />
      {gecmis && deger !== dunStr && (
        <p className="rounded-lg bg-sari px-3 py-2 text-sm font-semibold text-black">
          Geçmişe dönük kayıt: iş bu tarihe işlenecek.
        </p>
      )}
    </div>
  );
}
