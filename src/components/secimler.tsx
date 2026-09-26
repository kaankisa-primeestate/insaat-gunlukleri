"use client";

import { useState } from "react";
import { Minus, Plus, AlertTriangle } from "lucide-react";

export type TaseronSecenek = { id: string; firma_adi: string; is_turleri: string[]; gecikme: number | null };

/** Taşeron seçimi: büyük düğmeler, zorunlu. Gecikmedeki taşeron kırmızı etiketli. */
export function TaseronSecici({
  taseronlar,
  varsayilan,
  onChange,
}: {
  taseronlar: TaseronSecenek[];
  varsayilan?: string;
  onChange?: (t: TaseronSecenek) => void;
}) {
  if (taseronlar.length === 0) {
    return (
      <p className="rounded-xl bg-kirmizi px-4 py-3 font-semibold text-white">
        Bu şantiyede kayıtlı taşeron yok. Önce taşeron ve sözleşmesi girilmeli.
      </p>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-2">
      {taseronlar.map((t) => (
        <label key={t.id} className="min-w-0 cursor-pointer">
          <input
            type="radio"
            name="taseron_id"
            value={t.id}
            required
            defaultChecked={varsayilan === t.id || taseronlar.length === 1}
            onChange={() => onChange?.(t)}
            className="peer sr-only"
          />
          <span className="flex min-h-18 flex-col justify-center rounded-xl border-2 border-cizgi bg-yuzey px-3 py-2 peer-checked:border-yazi peer-checked:bg-koyu peer-checked:text-white peer-checked:ring-2 peer-checked:ring-yazi peer-focus-visible:outline-3 peer-focus-visible:outline-mavi">
            <span className="text-base leading-tight font-bold break-words">{t.firma_adi}</span>
            <span className="text-sm opacity-80">{t.is_turleri.join(", ")}</span>
            {t.gecikme != null && t.gecikme <= 7 && (
              <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-md bg-kirmizi px-1.5 text-xs font-bold text-white">
                <AlertTriangle className="size-3" /> {t.gecikme < 0 ? "Gecikti" : "Süre doluyor"}
              </span>
            )}
          </span>
        </label>
      ))}
    </div>
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
