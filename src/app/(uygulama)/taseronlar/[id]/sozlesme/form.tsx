"use client";

import { useActionState, useState } from "react";
import { Alan, Girdi, KaydetButonu, Mesaj, Metin, Secim } from "@/components/form";
import { BelgeYukleyici } from "@/components/belge-yukleyici";
import { tarihYaz } from "@/lib/sabitler";
import { sozlesmeEkle } from "../../eylemler";

export function SozlesmeFormu({
  taseronId,
  isTurleri,
  firmaId,
  santiyeler,
  seciliSantiye,
}: {
  taseronId: string;
  isTurleri: string[];
  firmaId: string;
  santiyeler: { id: string; ad: string }[];
  seciliSantiye?: string;
}) {
  const [durum, eylem] = useActionState(sozlesmeEkle, undefined);
  const [tur, setTur] = useState<"net" | "sure">("net");
  const [yerTeslim, setYerTeslim] = useState("");
  const [sure, setSure] = useState("");

  // Yer teslim + süre girildikçe hesaplanan bitiş tarihi gösterilir.
  let hesap: string | null = null;
  const gun = Number(sure);
  if (yerTeslim && gun > 0) {
    const d = new Date(yerTeslim + "T12:00:00");
    d.setDate(d.getDate() + gun);
    hesap = d.toISOString().slice(0, 10);
  }

  return (
    <form action={eylem} className="flex flex-col gap-5">
      <input type="hidden" name="taseron_id" value={taseronId} />
      <Alan etiket="Şantiye" zorunlu>
        <Secim ad="santiye_id" zorunlu sutun={2} varsayilan={seciliSantiye} secenekler={santiyeler.map((s) => ({ deger: s.id, ad: s.ad }))} />
      </Alan>
      <Alan etiket="İşin tarifi" zorunlu>
        <Metin name="is_tarifi" required maxLength={500} rows={3} defaultValue={isTurleri.filter((t) => t !== "Diğer").length ? `${isTurleri.filter((t) => t !== "Diğer").join(", ")} işleri` : ""} />
      </Alan>

      <Alan etiket="Süre" zorunlu>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ["net", "Net tarihler var"],
              ["sure", "Yer teslim + süre"],
            ] as const
          ).map(([k, ad]) => (
            <button
              key={k}
              type="button"
              onClick={() => setTur(k)}
              className={`min-h-14 rounded-xl border-2 px-2 font-semibold ${tur === k ? "border-yazi bg-koyu text-white" : "border-cizgi bg-yuzey"}`}
            >
              {ad}
            </button>
          ))}
        </div>
        <input type="hidden" name="tur" value={tur} />
        {tur === "net" ? (
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 font-semibold">
              Başlangıç
              <Girdi type="date" name="baslangic" />
            </label>
            <label className="flex flex-col gap-1 font-semibold">
              Bitiş *
              <Girdi type="date" name="bitis" required />
            </label>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 font-semibold">
                Yer teslim *
                <Girdi type="date" name="yer_teslim" required value={yerTeslim} onChange={(e) => setYerTeslim(e.target.value)} />
              </label>
              <label className="flex flex-col gap-1 font-semibold">
                Süre (gün) *
                <Girdi
                  type="number"
                  name="sure_gun"
                  inputMode="numeric"
                  min={1}
                  max={3650}
                  required
                  value={sure}
                  onChange={(e) => setSure(e.target.value)}
                />
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              {[30, 60, 90, 120, 180, 365].map((g) => (
                <button key={g} type="button" onClick={() => setSure(String(g))} className="min-h-12 rounded-xl border-2 border-cizgi bg-yuzey px-4 font-semibold">
                  {g} gün
                </button>
              ))}
            </div>
            {hesap && (
              <p className="rounded-xl bg-koyu px-4 py-3 text-lg font-bold text-white">Bitiş: {tarihYaz(hesap)}</p>
            )}
          </div>
        )}
      </Alan>

      <Alan etiket="Sözleşme belgesi">
        <BelgeYukleyici firmaId={firmaId} />
      </Alan>

      <Mesaj durum={durum} />
      <KaydetButonu>Sözleşmeyi Kaydet</KaydetButonu>
    </form>
  );
}
