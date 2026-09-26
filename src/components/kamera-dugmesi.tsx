"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import { fotoBirak } from "@/lib/foto";

/**
 * "Yeni kayıt" düğmesinin hemen yanındaki kamera: tek dokunuşla kamera
 * açılır, çekilen fotoğrafla kayıt formu başlar.
 */
export function KameraDugmesi({ hedef, etiket }: { hedef: string; etiket: string }) {
  const girdi = useRef<HTMLInputElement>(null);
  const router = useRouter();
  return (
    <>
      <button
        type="button"
        aria-label={etiket}
        onClick={() => girdi.current?.click()}
        className="flex min-h-20 w-20 shrink-0 flex-col items-center justify-center gap-0.5 rounded-2xl bg-koyu text-white active:scale-[0.97]"
      >
        <Camera className="size-9" strokeWidth={2.2} />
        <span className="text-xs font-bold">Foto</span>
      </button>
      <input
        ref={girdi}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => {
          const dosyalar = [...(e.target.files ?? [])];
          e.target.value = "";
          if (!dosyalar.length) return;
          fotoBirak(dosyalar);
          router.push(hedef);
        }}
      />
    </>
  );
}
