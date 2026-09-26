"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { kisaTarih } from "@/lib/sabitler";

/**
 * Takvimde istenen güne gitmek: telefonun kendi takvimi açılır, ileri
 * ya da geri istenen gün seçilir. Oklar bir gün ileri/geri götürür.
 */
export function GunSecici({ tarih, bugun, ek }: { tarih: string; bugun: string; ek: string }) {
  const router = useRouter();
  const git = (t: string) => router.replace(`/teslimat?tarih=${t}${ek}`);
  const kaydir = (gun: number) => {
    const d = new Date(tarih + "T12:00:00");
    d.setDate(d.getDate() + gun);
    git(d.toISOString().slice(0, 10));
  };
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <button type="button" aria-label="Önceki gün" onClick={() => kaydir(-1)} className="grid size-14 shrink-0 place-items-center rounded-xl bg-koyu text-white">
          <ChevronLeft className="size-8" />
        </button>
        <label className="relative flex min-h-14 min-w-0 flex-1 items-center justify-center rounded-xl border-2 border-yazi bg-zemin px-2 text-lg font-extrabold">
          {tarih === bugun ? "Bugün" : kisaTarih(tarih)}
          <span className="ml-2 text-sm font-semibold text-soluk">{tarih.split("-").reverse().join(".")}</span>
          {/* Görünmez tarih kutusu tüm alanı kaplar; dokununca takvim açılır. */}
          <input
            type="date"
            aria-label="Gün seç"
            value={tarih}
            onChange={(e) => e.target.value && git(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>
        <button type="button" aria-label="Sonraki gün" onClick={() => kaydir(1)} className="grid size-14 shrink-0 place-items-center rounded-xl bg-koyu text-white">
          <ChevronRight className="size-8" />
        </button>
      </div>
      {tarih !== bugun && (
        <button type="button" onClick={() => git(bugun)} className="min-h-12 rounded-xl border-2 border-cizgi font-semibold">
          Bugüne dön
        </button>
      )}
    </div>
  );
}
