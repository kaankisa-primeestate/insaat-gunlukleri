"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, LoaderCircle, X, CircleAlert } from "lucide-react";
import { supabaseTarayici } from "@/lib/supabase/client";
import { fotoAl, kucult } from "@/lib/foto";

type Foto = { anahtar: string; onizleme: string; yol?: string; hata?: boolean };

/**
 * Fotoğraf çek/seç, küçült, yükle. Yüklenen dosyaların depo yolları gizli
 * alanlarla forma eklenir; kayıt sunucuya yalnızca yollarla gider.
 */
export function FotoSecici({
  firmaId,
  klasor,
  ad = "fotograflar",
  en = 6,
  zorunlu = false,
}: {
  firmaId: string;
  klasor: string;
  ad?: string;
  en?: number;
  zorunlu?: boolean;
}) {
  const [fotolar, setFotolar] = useState<Foto[]>([]);
  const kamera = useRef<HTMLInputElement>(null);
  const galeri = useRef<HTMLInputElement>(null);

  async function ekle(dosyalar: File[]) {
    const yer = Math.max(0, en - fotolar.length);
    const secilen = dosyalar.slice(0, yer);
    for (const dosya of secilen) {
      const anahtar = crypto.randomUUID();
      const onizleme = URL.createObjectURL(dosya);
      setFotolar((f) => [...f, { anahtar, onizleme }]);
      try {
        const blob = await kucult(dosya);
        const yol = `${firmaId}/${klasor}/${anahtar}.jpg`;
        const { error } = await supabaseTarayici()
          .storage.from("dosyalar")
          .upload(yol, blob, { contentType: "image/jpeg", upsert: false });
        if (error) throw error;
        setFotolar((f) => f.map((x) => (x.anahtar === anahtar ? { ...x, yol } : x)));
      } catch {
        setFotolar((f) => f.map((x) => (x.anahtar === anahtar ? { ...x, hata: true } : x)));
      }
    }
  }

  // Ana sayfadaki kamera düğmesiyle çekilmiş fotoğraf varsa hemen yükle.
  useEffect(() => {
    const t = setTimeout(() => {
      const bekleyen = fotoAl();
      if (bekleyen.length) void ekle(bekleyen);
    }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const yukleniyor = fotolar.some((f) => !f.yol && !f.hata);
  const hazir = fotolar.filter((f) => f.yol);
  const denetim = useRef<HTMLInputElement>(null);
  const uyari = yukleniyor
    ? "Fotoğraf yükleniyor, lütfen bekleyin."
    : zorunlu && hazir.length === 0
      ? "En az bir fotoğraf gerekli."
      : "";
  useEffect(() => {
    denetim.current?.setCustomValidity(uyari);
  }, [uyari]);

  return (
    <div className="flex flex-col gap-3">
      {fotolar.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {fotolar.map((f) => (
            <div key={f.anahtar} className="relative aspect-square overflow-hidden rounded-xl bg-yuzey">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.onizleme} alt="" className="size-full object-cover" />
              {!f.yol && !f.hata && (
                <div className="absolute inset-0 grid place-items-center bg-black/50">
                  <LoaderCircle className="size-8 animate-spin text-white" />
                </div>
              )}
              {f.hata && (
                <div className="absolute inset-0 grid place-items-center bg-kirmizi/80 p-1 text-center text-xs font-bold text-white">
                  <CircleAlert className="size-6" />
                  Yüklenemedi
                </div>
              )}
              <button
                type="button"
                aria-label="Fotoğrafı kaldır"
                onClick={() => setFotolar((l) => l.filter((x) => x.anahtar !== f.anahtar))}
                className="absolute top-1 right-1 grid size-9 place-items-center rounded-full bg-black/70 text-white"
              >
                <X className="size-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {fotolar.length < en && (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => kamera.current?.click()}
            className="flex min-h-16 items-center justify-center gap-2 rounded-xl bg-koyu text-lg font-bold text-white"
          >
            <Camera className="size-7" /> Çek
          </button>
          <button
            type="button"
            onClick={() => galeri.current?.click()}
            className="flex min-h-16 items-center justify-center gap-2 rounded-xl border-2 border-cizgi bg-yuzey text-lg font-bold"
          >
            <ImagePlus className="size-7" /> Galeri
          </button>
        </div>
      )}

      <input
        ref={kamera}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => {
          void ekle([...(e.target.files ?? [])]);
          e.target.value = "";
        }}
      />
      <input
        ref={galeri}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          void ekle([...(e.target.files ?? [])]);
          e.target.value = "";
        }}
      />

      {hazir.map((f) => (
        <input key={f.anahtar} type="hidden" name={ad} value={f.yol} />
      ))}
      {/* Yükleme sürerken veya zorunlu fotoğraf yokken form gönderilmesin. */}
      <input ref={denetim} type="text" tabIndex={-1} aria-hidden className="sr-only" value="" onChange={() => {}} />
      {yukleniyor && <p className="text-sm font-semibold text-soluk">Fotoğraf yükleniyor…</p>}
    </div>
  );
}
