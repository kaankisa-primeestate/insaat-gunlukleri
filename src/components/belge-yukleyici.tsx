"use client";

import { useRef, useState } from "react";
import { FileUp, LoaderCircle, FileCheck2, X } from "lucide-react";
import { supabaseTarayici } from "@/lib/supabase/client";
import { kucult } from "@/lib/foto";

const EN_BUYUK_MB = 10;

/** Sözleşme belgesi: PDF olduğu gibi, fotoğraf küçültülerek yüklenir. */
export function BelgeYukleyici({ firmaId, ad = "belge" }: { firmaId: string; ad?: string }) {
  const girdi = useRef<HTMLInputElement>(null);
  const [durum, setDurum] = useState<{ yol?: string; isim?: string; yukleniyor?: boolean; hata?: string }>({});

  async function yukle(dosya: File) {
    setDurum({ yukleniyor: true, isim: dosya.name });
    try {
      const pdf = dosya.type === "application/pdf";
      if (!pdf && !dosya.type.startsWith("image/")) throw new Error("Yalnızca PDF veya fotoğraf yüklenebilir.");
      const govde = pdf ? dosya : await kucult(dosya, 2000, 0.75);
      if (govde.size > EN_BUYUK_MB * 1024 * 1024) throw new Error(`Dosya ${EN_BUYUK_MB} MB'tan büyük.`);
      const yol = `${firmaId}/sozlesme/${crypto.randomUUID()}.${pdf ? "pdf" : "jpg"}`;
      const { error } = await supabaseTarayici()
        .storage.from("dosyalar")
        .upload(yol, govde, { contentType: pdf ? "application/pdf" : "image/jpeg" });
      if (error) throw new Error("Yüklenemedi.");
      setDurum({ yol, isim: dosya.name });
    } catch (e) {
      setDurum({ hata: e instanceof Error ? e.message : "Yüklenemedi." });
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {durum.yol ? (
        <div className="flex min-h-14 items-center gap-3 rounded-xl bg-yesil px-4 font-semibold text-white">
          <FileCheck2 className="size-6 shrink-0" />
          <span className="min-w-0 flex-1 truncate">{durum.isim}</span>
          <button type="button" aria-label="Kaldır" onClick={() => setDurum({})} className="grid size-10 place-items-center">
            <X className="size-6" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={durum.yukleniyor}
          onClick={() => girdi.current?.click()}
          className="flex min-h-16 items-center justify-center gap-2 rounded-xl border-2 border-dashed border-cizgi bg-yuzey text-lg font-bold"
        >
          {durum.yukleniyor ? <LoaderCircle className="size-6 animate-spin" /> : <FileUp className="size-6" />}
          {durum.yukleniyor ? "Yükleniyor…" : "PDF veya fotoğraf seç"}
        </button>
      )}
      {durum.hata && <p className="font-semibold text-kirmizi">{durum.hata}</p>}
      <input
        ref={girdi}
        type="file"
        accept="application/pdf,image/*"
        hidden
        onChange={(e) => {
          const d = e.target.files?.[0];
          e.target.value = "";
          if (d) void yukle(d);
        }}
      />
      {durum.yol && <input type="hidden" name={ad} value={durum.yol} />}
    </div>
  );
}
