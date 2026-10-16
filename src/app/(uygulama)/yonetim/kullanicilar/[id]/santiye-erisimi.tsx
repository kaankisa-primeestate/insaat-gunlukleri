"use client";

import { useState } from "react";
import { SecimPenceresi } from "@/components/secim-penceresi";
import { santiyeAta } from "../../eylemler";

/**
 * Merkez personeli ve satın alma rolü için: tüm şantiyeleri mi, yoksa
 * yalnızca seçilen şantiyeleri mi görebilsin. Hiç şantiye seçilmeden
 * kaydedilirse (ya da "Tüm şantiyeler" seçiliyken) kayıt boşalır — bu,
 * veritabanı tarafında "tüm şantiyeleri görür" anlamına gelir (bkz. göç 19).
 */
export function SantiyeErisimi({
  kullaniciId,
  atananlar,
  santiyeler,
}: {
  kullaniciId: string;
  atananlar: string[];
  santiyeler: { id: string; ad: string }[];
}) {
  const [mod, setMod] = useState<"tum" | "secili">(atananlar.length > 0 ? "secili" : "tum");

  return (
    <form action={santiyeAta} className="flex flex-col gap-3">
      <input type="hidden" name="id" value={kullaniciId} />
      <div className="flex flex-col gap-2">
        <label
          className={`flex min-h-12 items-center gap-3 rounded-xl border-2 px-4 ${mod === "tum" ? "border-yazi bg-yuzey" : "border-cizgi"}`}
        >
          <input
            type="radio"
            checked={mod === "tum"}
            onChange={() => setMod("tum")}
            className="size-5 accent-yazi"
          />
          <span className="font-bold">Tüm şantiyeleri görsün</span>
        </label>
        <label
          className={`flex min-h-12 items-center gap-3 rounded-xl border-2 px-4 ${mod === "secili" ? "border-yazi bg-yuzey" : "border-cizgi"}`}
        >
          <input
            type="radio"
            checked={mod === "secili"}
            onChange={() => setMod("secili")}
            className="size-5 accent-yazi"
          />
          <span className="font-bold">Yalnızca seçtiğim şantiye(leri) görsün</span>
        </label>
      </div>
      {mod === "secili" && (
        <div>
          <SecimPenceresi
            ad="santiye"
            baslik="Görebileceği şantiyeler"
            coklu
            bosYazi="Şantiye seçmek için dokunun"
            varsayilan={atananlar}
            secenekler={santiyeler.map((s) => ({ deger: s.id, ad: s.ad }))}
          />
          <p className="mt-1 text-sm text-soluk">Hiç seçmeden kaydederseniz yine tüm şantiyeleri görür.</p>
        </div>
      )}
      <button className="min-h-14 rounded-2xl bg-koyu text-lg font-bold text-white">Kaydet</button>
    </form>
  );
}
