"use client";

import { useCallback, useEffect, useState } from "react";
import { CloudOff, RotateCcw, Trash2, TriangleAlert } from "lucide-react";
import { TUR_ADI, bekleyenler, gonder, kuyrukDinle, vazgec, type Bekleyen } from "@/lib/cevrimdisi";
import { useCevrimdisi } from "@/components/cevrimdisi-katman";

const zaman = (t: string) =>
  new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" }).format(new Date(t));

/**
 * Telefonda bekleyen kayıtlar (yalnız bu kullanıcının, yalnız bu telefonda).
 * Gönderilemeyen kayıt sebebiyle durur; tekrar gönderilir ya da vazgeçilir.
 */
export function BekleyenListesi() {
  const b = useCevrimdisi();
  const [liste, setListe] = useState<Bekleyen[] | null>(null);
  const [mesaj, setMesaj] = useState<string | null>(null);
  const [mesgul, setMesgul] = useState<string | null>(null);

  const oku = useCallback(async () => {
    if (!b) return;
    setListe(await bekleyenler(b.kullanici).catch(() => []));
  }, [b]);

  useEffect(() => {
    const ilk = setTimeout(() => void oku(), 0);
    const birak = kuyrukDinle(() => void oku());
    return () => {
      clearTimeout(ilk);
      birak();
    };
  }, [oku]);

  async function tekrar(k: Bekleyen) {
    setMesgul(k.id);
    setMesaj(null);
    const s = await gonder({ ...k, hata: undefined });
    setMesgul(null);
    setMesaj(s === "ag" ? "İnternet yok; kayıt bekliyor, internet gelince gönderilecek." : "git" in s ? "✓ Gönderildi" : null);
  }

  async function sil(k: Bekleyen) {
    if (!confirm("Bu kayıt sunucuya hiç gitmedi. Vazgeçerseniz kaybolur. Emin misiniz?")) return;
    await vazgec(k);
  }

  if (liste === null) return <p className="text-soluk">Yükleniyor…</p>;
  if (!liste.length)
    return <p className="rounded-2xl bg-yuzey px-4 py-6 text-center text-soluk">Telefonda bekleyen kayıt yok. Hepsi gönderildi.</p>;

  return (
    <div className="flex flex-col gap-3">
      {mesaj && <p className="rounded-xl bg-yuzey px-4 py-3 font-bold">{mesaj}</p>}
      {liste.map((k) => (
        <article key={k.id} className={`flex flex-col gap-2 rounded-2xl border-2 p-3 ${k.hata ? "border-kirmizi" : "border-cizgi"}`}>
          <p className="flex flex-wrap items-center gap-x-2">
            <span className="rounded-lg bg-koyu px-2 py-0.5 font-extrabold text-white">{TUR_ADI[k.tur]}</span>
            <span className="text-sm text-soluk">
              {zaman(k.zaman)} · {k.santiye_ad}
            </span>
          </p>
          <p className="text-lg font-semibold break-words">{k.ozet || "—"}</p>
          {k.hata ? (
            <p className="flex items-start gap-2 rounded-xl bg-kirmizi px-3 py-2 font-semibold text-white">
              <TriangleAlert className="mt-0.5 size-5 shrink-0" /> Gönderilemedi: {k.hata}
            </p>
          ) : (
            <p className="flex items-center gap-2 text-soluk">
              <CloudOff className="size-5" /> İnternet gelince gönderilecek
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={mesgul === k.id}
              onClick={() => void tekrar(k)}
              className="flex min-h-12 items-center gap-1.5 rounded-xl bg-koyu px-4 font-bold text-white disabled:opacity-60"
            >
              <RotateCcw className="size-5" /> {mesgul === k.id ? "Gönderiliyor…" : "Şimdi gönder"}
            </button>
            {k.hata && (
              <button type="button" onClick={() => void sil(k)} className="flex min-h-12 items-center gap-1.5 rounded-xl border-2 border-kirmizi px-4 font-bold text-kirmizi">
                <Trash2 className="size-5" /> Vazgeç
              </button>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
