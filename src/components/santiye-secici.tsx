"use client";

import { useTransition } from "react";
import { MapPin } from "lucide-react";
import { santiyeSec } from "@/app/(uygulama)/eylemler";

export function SantiyeSecici({ santiyeler, secili }: { santiyeler: { id: string; ad: string }[]; secili?: string }) {
  const [bekliyor, basla] = useTransition();
  if (santiyeler.length === 0) return null;
  return (
    <label className="flex min-h-14 items-center gap-2 rounded-2xl border-2 border-cizgi bg-yuzey px-3">
      <MapPin className="size-6 shrink-0" />
      <span className="sr-only">Şantiye</span>
      <select
        value={secili}
        disabled={bekliyor || santiyeler.length === 1}
        onChange={(e) => basla(() => santiyeSec(e.target.value))}
        className="min-h-12 w-full min-w-0 appearance-none bg-transparent text-lg font-bold disabled:opacity-100"
      >
        {santiyeler.map((s) => (
          <option key={s.id} value={s.id}>
            {s.ad}
          </option>
        ))}
      </select>
    </label>
  );
}
