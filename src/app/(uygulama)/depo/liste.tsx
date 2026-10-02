"use client";

import { useState } from "react";
import Link from "next/link";
import { Package, Search, X } from "lucide-react";
import { miktarYaz, yerYazisi, type DepoKalemi } from "@/lib/depo";

type Suzgec = "hepsi" | "disarida" | "kapali" | `yer:${string}`;

/**
 * Depo listesi: üstte arama (ad, özellik, not, yer içinde; yazdıkça süzülür),
 * altında yere göre süzgeç. Kapanmış (elden çıkmış) kayıtlar ayrı süzgeçte.
 */
export function DepoListesi({ kalemler, adresler }: { kalemler: DepoKalemi[]; adresler: Record<string, string> }) {
  const [ara, setAra] = useState("");
  const [suzgec, setSuzgec] = useState<Suzgec>("hepsi");
  const yerler = [...new Set(kalemler.filter((k) => !k.kapandi).map(yerYazisi))].sort((a, b) => a.localeCompare(b, "tr"));
  const aranan = ara.trim().toLocaleLowerCase("tr");
  const gorunen = kalemler.filter((k) => {
    if (suzgec === "kapali" ? !k.kapandi : k.kapandi) return false;
    if (suzgec === "disarida" && !(k.disarida > 0)) return false;
    if (suzgec.startsWith("yer:") && yerYazisi(k) !== suzgec.slice(4)) return false;
    if (!aranan) return true;
    return [k.ad, k.ozellik, k.notu, yerYazisi(k)].some((x) => x?.toLocaleLowerCase("tr").includes(aranan));
  });
  const cip = (on: boolean) =>
    `flex min-h-11 shrink-0 items-center rounded-full border-2 px-4 font-bold whitespace-nowrap ${on ? "border-yazi bg-koyu text-white" : "border-cizgi bg-yuzey"}`;

  return (
    <>
      <label className="sticky top-[4.75rem] z-[9] flex min-h-14 items-center gap-2 rounded-2xl border-2 border-yazi bg-zemin px-4 shadow-sm">
        <Search className="size-6 shrink-0 text-soluk" />
        <input
          type="search"
          value={ara}
          onChange={(e) => setAra(e.target.value)}
          placeholder="Ara: matkap, seramik, nivo…"
          className="min-h-12 w-full bg-transparent text-lg outline-none"
        />
        {ara && (
          <button type="button" aria-label="Aramayı temizle" onClick={() => setAra("")} className="grid size-10 place-items-center">
            <X className="size-6" />
          </button>
        )}
      </label>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <button type="button" onClick={() => setSuzgec("hepsi")} className={cip(suzgec === "hepsi")}>Tümü</button>
        {yerler.map((y) => (
          <button key={y} type="button" onClick={() => setSuzgec(`yer:${y}`)} className={cip(suzgec === `yer:${y}`)}>
            {y}
          </button>
        ))}
        <button type="button" onClick={() => setSuzgec("disarida")} className={cip(suzgec === "disarida")}>Dışarıda olanlar</button>
        <button type="button" onClick={() => setSuzgec("kapali")} className={cip(suzgec === "kapali")}>Elden çıkanlar</button>
      </div>

      {gorunen.length === 0 && (
        <p className="rounded-2xl bg-yuzey px-4 py-6 text-center text-soluk">{aranan ? "Bulunamadı." : "Kayıt yok."}</p>
      )}
      <div className="flex flex-col gap-2 lg:grid lg:grid-cols-2">
        {gorunen.map((k) => {
          const foto = k.fotograflar[0] && adresler[k.fotograflar[0]];
          return (
            <Link key={k.id} href={`/depo/${k.id}`} className="flex gap-3 rounded-2xl border-2 border-cizgi p-3 active:bg-yuzey">
              {foto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={foto} alt="" loading="lazy" className="size-20 shrink-0 rounded-xl object-cover" />
              ) : (
                <span className="grid size-20 shrink-0 place-items-center rounded-xl bg-yuzey text-soluk">
                  <Package className="size-8" />
                </span>
              )}
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p className="text-lg leading-tight font-bold break-words">{k.ad}</p>
                {k.ozellik && <p className="truncate text-sm text-soluk">{k.ozellik}</p>}
                <p className="font-semibold">
                  {miktarYaz(k.depoda, k.birim)} · {yerYazisi(k)}
                </p>
                {k.disarida > 0 && (
                  <span className="w-fit rounded-lg bg-sari px-2 py-0.5 text-sm font-bold text-black">{miktarYaz(k.disarida, k.birim)} dışarıda</span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
