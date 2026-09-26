"use client";

import { useState } from "react";
import Link from "next/link";
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
    // Çıkmaz sokak olmasın: neden boş olduğu ve nereye gidileceği söylenir.
    return (
      <div className="flex flex-col gap-3 rounded-xl border-2 border-kirmizi p-4">
        <p className="font-bold text-kirmizi">Bu şantiyede görevli taşeron yok.</p>
        <p className="text-soluk">
          Taşeron, sözleşmesi olan şantiyede görünür. Taşeron bu şantiyede de çalışıyorsa sayfasından bu şantiye için
          sözleşme ekleyin. Başka bir şantiyede işlem yapacaksanız çıkış yapıp o şantiyeye girin.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Link href="/taseronlar?hepsi=1" className="flex min-h-14 items-center justify-center rounded-xl bg-koyu px-2 text-center font-bold text-white">
            Taşeronlara git
          </Link>
          <Link href="/" className="flex min-h-14 items-center justify-center rounded-xl border-2 border-yazi px-2 text-center font-bold">
            Ana sayfa
          </Link>
        </div>
      </div>
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
