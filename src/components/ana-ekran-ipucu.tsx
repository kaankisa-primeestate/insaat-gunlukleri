"use client";

import { useEffect, useState } from "react";
import { Share, SquarePlus, X } from "lucide-react";

const ANAHTAR = "ana-ekran-ipucu-kapandi";

/**
 * iPhone'da "ana ekrana ekle" ipucu. Android tarayıcısı eklemeyi kendisi
 * sorar; iPhone sormaz, yeri de bulunmaz. Simge zaten eklenmişse (uygulama
 * simgeden açılmışsa) ya da kullanıcı kapattıysa bir daha görünmez.
 */
export function AnaEkranIpucu() {
  const [durum, setDurum] = useState<"yok" | "safari" | "baska">("yok");

  useEffect(() => {
    const ua = navigator.userAgent;
    // iPad yeni sürümlerde kendini Mac olarak tanıtır; dokunmatik olmasından anlaşılır.
    const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
    const simgeden =
      (navigator as Navigator & { standalone?: boolean }).standalone === true ||
      window.matchMedia("(display-mode: standalone)").matches;
    let kapandi = false;
    try {
      kapandi = localStorage.getItem(ANAHTAR) === "1";
    } catch {}
    if (!ios || simgeden || kapandi) return;
    // iPhone'daki Chrome, Firefox vb. adlarında CriOS / FxiOS / EdgiOS taşır.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDurum(/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua) ? "baska" : "safari");
  }, []);

  if (durum === "yok") return null;

  function kapat() {
    try {
      localStorage.setItem(ANAHTAR, "1");
    } catch {}
    setDurum("yok");
  }

  return (
    <div className="relative rounded-2xl border-2 border-vurgu bg-zemin p-4 pr-14 shadow-sm">
      <p className="text-lg font-extrabold">Ana ekrana ekleyin</p>
      {durum === "safari" ? (
        <ol className="mt-1 flex flex-col gap-1 font-semibold">
          <li className="flex flex-wrap items-center gap-1.5">
            1. Alttaki <Share className="size-5 text-mavi" aria-label="Paylaş" /> <b>Paylaş</b> düğmesine basın
          </li>
          <li className="flex flex-wrap items-center gap-1.5">
            2. Menüyü kaydırıp <SquarePlus className="size-5" aria-hidden /> <span><b>Ana Ekrana Ekle</b>&apos;yi seçin</span>
          </li>
        </ol>
      ) : (
        <p className="mt-1 font-semibold">
          Bu adresi <b>Safari</b>&apos;de açın, sonra <Share className="inline size-5 text-mavi" aria-label="Paylaş" /> Paylaş → <b>Ana Ekrana Ekle</b>.
        </p>
      )}
      <p className="mt-1 text-sm text-soluk">Program simgeden uygulama gibi tam ekran açılır.</p>
      <button
        type="button"
        onClick={kapat}
        aria-label="Kapat"
        className="absolute top-2 right-2 grid size-11 place-items-center rounded-full text-soluk active:bg-yuzey"
      >
        <X className="size-6" />
      </button>
    </div>
  );
}
