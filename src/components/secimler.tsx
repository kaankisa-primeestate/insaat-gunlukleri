"use client";

import { useState } from "react";
import { Minus, Plus, AlertTriangle } from "lucide-react";
import { SecimPenceresi, type PencereSecenegi } from "./secim-penceresi";

export type TaseronSecenek = { id: string; firma_adi: string; is_turleri: string[]; gecikme: number | null };

function gecikmeEtiketi(g: number | null) {
  if (g == null || g > 7) return undefined;
  return (
    <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-md bg-kirmizi px-1.5 text-xs font-bold text-white">
      <AlertTriangle className="size-3" /> {g < 0 ? "Gecikti" : "Süre doluyor"}
    </span>
  );
}

export function taseronSecenekleri(taseronlar: TaseronSecenek[], grup?: string, onEk = ""): PencereSecenegi[] {
  return taseronlar.map((t) => ({
    deger: onEk + t.id,
    ad: t.firma_adi,
    alt: t.is_turleri.join(", "),
    grup,
    etiket: gecikmeEtiketi(t.gecikme),
  }));
}

/**
 * Taşeron seçimi (zorunlu): dokununca açılan pencereden. Gecikmedeki taşeron
 * kırmızı etiketli. Tek taşeron varsa kendiliğinden seçilir.
 */
export function TaseronSecici({
  taseronlar,
  varsayilan,
  onChange,
}: {
  taseronlar: TaseronSecenek[];
  varsayilan?: string;
  onChange?: (t: TaseronSecenek | undefined) => void;
}) {
  if (taseronlar.length === 0) {
    return (
      <p className="rounded-xl bg-kirmizi px-4 py-3 font-semibold text-white">
        Bu şantiyede kayıtlı taşeron yok. Önce taşeron ve sözleşmesi girilmeli.
      </p>
    );
  }
  const ilk = varsayilan ?? (taseronlar.length === 1 ? taseronlar[0].id : undefined);
  return (
    <SecimPenceresi
      ad="taseron_id"
      baslik="Taşeron seçin"
      zorunlu
      bosYazi="Taşeron seçmek için dokunun"
      varsayilan={ilk ? [ilk] : []}
      secenekler={taseronSecenekleri(taseronlar)}
      onChange={(d) => onChange?.(taseronlar.find((t) => t.id === d[0]))}
    />
  );
}

/** Kişi sayısı: büyük eksi/artı ve hızlı seçimler. */
export function SayiSecici({ ad, varsayilan = 1, en = 500 }: { ad: string; varsayilan?: number; en?: number }) {
  const [n, setN] = useState(varsayilan);
  const degistir = (v: number) => setN(Math.max(0, Math.min(en, v)));
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <button type="button" aria-label="Azalt" onClick={() => degistir(n - 1)} className="grid size-16 place-items-center rounded-xl bg-koyu text-white">
          <Minus className="size-8" strokeWidth={3} />
        </button>
        <input
          name={ad}
          type="number"
          inputMode="numeric"
          min={0}
          max={en}
          value={n}
          onChange={(e) => degistir(Number(e.target.value) || 0)}
          className="min-h-16 w-full min-w-0 rounded-xl border-2 border-cizgi text-center text-3xl font-extrabold"
        />
        <button type="button" aria-label="Artır" onClick={() => degistir(n + 1)} className="grid size-16 place-items-center rounded-xl bg-koyu text-white">
          <Plus className="size-8" strokeWidth={3} />
        </button>
      </div>
      <div className="grid grid-cols-6 gap-2">
        {[2, 4, 6, 8, 10, 15].map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setN(v)}
            className={`min-h-12 rounded-xl border-2 font-bold ${n === v ? "border-yazi bg-koyu text-white" : "border-cizgi bg-yuzey"}`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}
