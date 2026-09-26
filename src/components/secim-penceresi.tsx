"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";

export type PencereSecenegi = {
  deger: string;
  ad: string;
  /** Adın altında küçük açıklama (ör. taşeronun işleri). */
  alt?: string;
  /** Başlık altında gruplamak için (ör. "Taşeronlar", "Personel"). */
  grup?: string;
  /** Sağda gösterilecek küçük uyarı etiketi. */
  etiket?: ReactNode;
};

/**
 * Uzun listeler sayfayı kaplamasın diye: alanda yalnızca seçilenler görünür,
 * dokununca alttan bir pencere açılır. Tek seçimde seçer seçmez kapanır;
 * çoklu seçimde "Tamam" ile kapanır. Seçenek çoksa arama kutusu çıkar.
 * Seçilen değerler gizli alanlarla forma eklenir.
 */
export function SecimPenceresi({
  ad,
  baslik,
  secenekler,
  coklu = false,
  varsayilan = [],
  zorunlu = false,
  bosYazi = "Seçmek için dokunun",
  sutun = 2,
  onChange,
}: {
  ad: string;
  baslik: string;
  secenekler: PencereSecenegi[];
  coklu?: boolean;
  varsayilan?: string[];
  zorunlu?: boolean;
  bosYazi?: string;
  sutun?: 1 | 2 | 3 | 4;
  onChange?: (degerler: string[]) => void;
}) {
  const [secili, setSecili] = useState<string[]>(() => varsayilan.filter((v) => secenekler.some((s) => s.deger === v)));
  const [acik, setAcik] = useState(false);
  const [ara, setAra] = useState("");
  const denetim = useRef<HTMLInputElement>(null);

  const uyari = zorunlu && secili.length === 0 ? `${baslik}: seçim yapın.` : "";
  useEffect(() => {
    denetim.current?.setCustomValidity(uyari);
  }, [uyari]);

  // Pencere açıkken arkadaki sayfa kaymasın; geri tuşu / Esc pencereyi kapatsın.
  useEffect(() => {
    if (!acik) return;
    const onceki = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAcik(false);
    window.addEventListener("keydown", esc);
    return () => {
      document.body.style.overflow = onceki;
      window.removeEventListener("keydown", esc);
    };
  }, [acik]);

  function degistir(yeni: string[]) {
    setSecili(yeni);
    onChange?.(yeni);
  }

  function dokun(deger: string) {
    if (coklu) {
      degistir(secili.includes(deger) ? secili.filter((x) => x !== deger) : [...secili, deger]);
    } else {
      degistir([deger]);
      setAcik(false);
    }
  }

  const aranan = ara.trim().toLocaleLowerCase("tr");
  const gorunen = aranan
    ? secenekler.filter((s) => (s.ad + " " + (s.alt ?? "")).toLocaleLowerCase("tr").includes(aranan))
    : secenekler;
  const gruplar = [...new Set(gorunen.map((s) => s.grup ?? ""))];
  const seciliAdlar = secenekler.filter((s) => secili.includes(s.deger));
  const izgara = { 1: "grid-cols-1", 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4" }[sutun];

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setAra("");
          setAcik(true);
        }}
        className={`flex min-h-16 w-full items-center gap-2 rounded-xl border-2 px-4 py-2 text-left ${
          seciliAdlar.length ? "border-yazi bg-koyu text-white" : "border-cizgi bg-yuzey"
        }`}
      >
        <span className="min-w-0 flex-1">
          {seciliAdlar.length === 0 ? (
            <span className="text-lg font-semibold text-soluk">{bosYazi}</span>
          ) : (
            <span className="flex flex-wrap gap-1.5">
              {seciliAdlar.map((s) => (
                <span key={s.deger} className="rounded-lg bg-white/15 px-2 py-0.5 text-base font-bold break-words">
                  {s.ad}
                </span>
              ))}
            </span>
          )}
        </span>
        <ChevronDown className="size-7 shrink-0" />
      </button>

      {secili.map((d) => (
        <input key={d} type="hidden" name={ad} value={d} />
      ))}
      <input ref={denetim} type="text" tabIndex={-1} aria-hidden className="sr-only" value="" onChange={() => {}} />

      {acik && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50" onClick={() => setAcik(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={baslik}
            onClick={(e) => e.stopPropagation()}
            className="mx-auto flex max-h-[85dvh] w-full max-w-2xl flex-col rounded-t-3xl bg-zemin pb-[env(safe-area-inset-bottom)]"
          >
            <div className="flex items-center gap-2 border-b-2 border-cizgi px-4 py-3">
              <p className="min-w-0 flex-1 text-xl font-extrabold">{baslik}</p>
              <button type="button" aria-label="Kapat" onClick={() => setAcik(false)} className="grid size-12 place-items-center rounded-xl active:bg-yuzey">
                <X className="size-7" />
              </button>
            </div>

            {secenekler.length > 20 && (
              <label className="mx-4 mt-3 flex min-h-12 items-center gap-2 rounded-xl border-2 border-cizgi px-3">
                <Search className="size-5 text-soluk" />
                <input
                  value={ara}
                  onChange={(e) => setAra(e.target.value)}
                  placeholder="Ara…"
                  className="min-h-11 w-full bg-transparent text-lg outline-none"
                />
              </label>
            )}

            <div className="flex-1 overflow-y-auto px-4 py-3">
              {gorunen.length === 0 && <p className="py-6 text-center text-soluk">Sonuç yok.</p>}
              {gruplar.map((g) => (
                <div key={g} className="mb-3">
                  {g && <p className="mb-2 text-sm font-bold tracking-wide text-soluk uppercase">{g}</p>}
                  <div className={`grid ${izgara} gap-2`}>
                    {gorunen
                      .filter((s) => (s.grup ?? "") === g)
                      .map((s) => {
                        const on = secili.includes(s.deger);
                        return (
                          <button
                            key={s.deger}
                            type="button"
                            onClick={() => dokun(s.deger)}
                            aria-pressed={on}
                            className={`relative flex min-h-14 min-w-0 flex-col justify-center rounded-xl border-2 px-2.5 py-2 text-left ${
                              on ? "border-yazi bg-koyu text-white ring-2 ring-yazi" : "border-cizgi bg-yuzey"
                            }`}
                          >
                            {/* Onay işareti köşede durur; yazıdan yer almaz, kelimeyi bölmez. */}
                            {on && (
                              <span className="absolute -top-2 -right-2 grid size-6 place-items-center rounded-full bg-yesil text-white ring-2 ring-zemin">
                                <Check className="size-4" strokeWidth={3.5} />
                              </span>
                            )}
                            <span className="text-base leading-tight font-bold break-words">{s.ad}</span>
                            {s.alt && <span className="text-sm opacity-80">{s.alt}</span>}
                            {s.etiket}
                          </button>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t-2 border-cizgi p-3">
              <button
                type="button"
                onClick={() => setAcik(false)}
                className="flex min-h-16 w-full items-center justify-center gap-2 rounded-2xl bg-vurgu text-xl font-bold text-black"
              >
                <Check className="size-6" strokeWidth={3} />
                Tamam{coklu && secili.length > 0 ? ` (${secili.length} seçili)` : ""}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
