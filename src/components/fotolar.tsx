"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

/**
 * Küçük fotoğraflar; dokununca tam ekran görüntüleyici açılır. Oklarla ya da
 * klavyeyle (← →, Esc) geçilir. Bilgisayarda hataları incelemek için.
 */
export function Fotolar({ yollar, adresler, boyut = "size-24" }: { yollar: string[]; adresler: Record<string, string>; boyut?: string }) {
  const liste = yollar.map((y) => adresler[y]).filter(Boolean);
  const [acik, setAcik] = useState<number | null>(null);

  useEffect(() => {
    if (acik == null) return;
    const tus = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAcik(null);
      if (e.key === "ArrowRight") setAcik((i) => (i == null ? i : (i + 1) % liste.length));
      if (e.key === "ArrowLeft") setAcik((i) => (i == null ? i : (i - 1 + liste.length) % liste.length));
    };
    window.addEventListener("keydown", tus);
    return () => window.removeEventListener("keydown", tus);
  }, [acik, liste.length]);

  if (!liste.length) return null;
  return (
    <>
      <div className="flex gap-2 overflow-x-auto">
        {liste.map((adres, i) => (
          <button key={adres} type="button" onClick={() => setAcik(i)} className="shrink-0" aria-label={`Fotoğraf ${i + 1}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={adres} alt="" loading="lazy" className={`${boyut} rounded-xl object-cover`} />
          </button>
        ))}
      </div>
      {acik != null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onClick={() => setAcik(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={liste[acik]} alt="" className="max-h-[90dvh] max-w-[95vw] object-contain" onClick={(e) => e.stopPropagation()} />
          <button type="button" aria-label="Kapat" onClick={() => setAcik(null)} className="absolute top-3 right-3 grid size-12 place-items-center rounded-full bg-white/15 text-white">
            <X className="size-7" />
          </button>
          {liste.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Önceki"
                onClick={(e) => {
                  e.stopPropagation();
                  setAcik((acik - 1 + liste.length) % liste.length);
                }}
                className="absolute left-3 grid size-14 place-items-center rounded-full bg-white/15 text-white"
              >
                <ChevronLeft className="size-8" />
              </button>
              <button
                type="button"
                aria-label="Sonraki"
                onClick={(e) => {
                  e.stopPropagation();
                  setAcik((acik + 1) % liste.length);
                }}
                className="absolute right-3 grid size-14 place-items-center rounded-full bg-white/15 text-white"
              >
                <ChevronRight className="size-8" />
              </button>
              <p className="absolute bottom-4 rounded-full bg-white/15 px-3 py-1 text-white">
                {acik + 1} / {liste.length}
              </p>
            </>
          )}
        </div>
      )}
    </>
  );
}
