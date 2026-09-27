import { Droplets, MapPinOff } from "lucide-react";
import Link from "next/link";
import { anlikHava, type Konum } from "@/lib/hava";
import { havaAdi } from "@/components/hava";

/**
 * Ana sayfadaki şu anki hava. Suspense içinde çizilir: hava servisi
 * gecikirse sayfanın geri kalanı beklemez.
 */
export async function AnlikHava({ konum, merkez, koyu }: { konum: Konum; merkez: boolean; koyu?: boolean }) {
  if (konum.enlem == null || konum.boylam == null) {
    // Konum yoksa yalnız merkeze, ayarlayacağı yeri gösteren bir ipucu.
    return merkez ? (
      <Link href="/yonetim/santiyeler" className={`inline-flex items-center gap-1.5 text-sm font-semibold underline ${koyu ? "text-white/75" : "text-soluk"}`}>
        <MapPinOff className="size-4" /> Hava durumu için şantiye konumu girin
      </Link>
    ) : null;
  }
  const h = await anlikHava(konum);
  if (!h) return null;
  const { ad, Ikon } = havaAdi(h.kod);
  return (
    <p className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px] ${koyu ? "text-white/80" : "text-soluk"}`}>
      <span className={`inline-flex items-center gap-1.5 font-bold ${koyu ? "text-white" : "text-yazi"}`}>
        <Ikon className="size-5" aria-hidden />
        {h.sicaklik != null ? `${Math.round(h.sicaklik)}°` : ""} {ad}
      </span>
      <span>
        · {h.en_yuksek != null ? Math.round(h.en_yuksek) : "–"}° / {h.en_dusuk != null ? Math.round(h.en_dusuk) : "–"}°
      </span>
      {(h.yagis ?? 0) >= 1 && (
        <span className={`inline-flex items-center gap-0.5 font-bold ${koyu ? "text-mavi-parlak" : "text-mavi"}`}>
          <Droplets className="size-4" aria-hidden /> {Number(h.yagis).toLocaleString("tr-TR")} mm yağış
        </span>
      )}
    </p>
  );
}
