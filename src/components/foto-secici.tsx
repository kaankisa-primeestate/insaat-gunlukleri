"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, LoaderCircle, X, CircleAlert } from "lucide-react";
import { supabaseTarayici } from "@/lib/supabase/client";
import { kucult } from "@/lib/foto";
import { agHatasi, fotoSakla } from "@/lib/cevrimdisi";

type Foto = { anahtar: string; onizleme: string; yol?: string; hata?: boolean; telefonda?: boolean };

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
  mevcut = [],
  cevrimdisi = false,
}: {
  firmaId: string;
  klasor: string;
  ad?: string;
  en?: number;
  zorunlu?: boolean;
  /** Düzenlemede kayıtlı fotoğraflar (depo yolu + görüntü adresi). */
  mevcut?: { yol: string; adres: string }[];
  /** Çevrimdışı çalışan formda internet yoksa fotoğraf telefonda bekler, kayıtla gider. */
  cevrimdisi?: boolean;
}) {
  const [fotolar, setFotolar] = useState<Foto[]>(() =>
    mevcut.map((m) => ({ anahtar: m.yol, onizleme: m.adres, yol: m.yol })),
  );
  const kamera = useRef<HTMLInputElement>(null);
  const galeri = useRef<HTMLInputElement>(null);

  async function ekle(dosyalar: File[]) {
    const yer = Math.max(0, en - fotolar.length);
    const secilen = dosyalar.slice(0, yer);
    for (const dosya of secilen) {
      const anahtar = crypto.randomUUID();
      const onizleme = URL.createObjectURL(dosya);
      setFotolar((f) => [...f, { anahtar, onizleme }]);
      const yol = `${firmaId}/${klasor}/${anahtar}.jpg`;
      let blob: Blob | undefined;
      try {
        blob = await kucult(dosya);
        if (cevrimdisi && !navigator.onLine) throw new Error("network");
        const { error } = await supabaseTarayici()
          .storage.from("dosyalar")
          .upload(yol, blob, { contentType: "image/jpeg", upsert: false });
        if (error) throw error;
        setFotolar((f) => f.map((x) => (x.anahtar === anahtar ? { ...x, yol } : x)));
      } catch (e) {
        // İnternet yok: fotoğraf telefonda saklanır, kayıt gönderilirken yüklenir.
        if (cevrimdisi && blob && agHatasi(e)) {
          try {
            await fotoSakla(yol, blob);
            setFotolar((f) => f.map((x) => (x.anahtar === anahtar ? { ...x, yol, telefonda: true } : x)));
            continue;
          } catch {
            // Telefon hafızası da yoksa aşağıda "Yüklenemedi".
          }
        }
        setFotolar((f) => f.map((x) => (x.anahtar === anahtar ? { ...x, hata: true } : x)));
      }
    }
  }

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
              {f.telefonda && (
                <span className="absolute bottom-1 left-1 rounded-md bg-black/70 px-1.5 text-xs font-bold text-white">Telefonda</span>
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
