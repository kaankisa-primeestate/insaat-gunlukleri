"use client";

import { useActionState, useState } from "react";
import { TriangleAlert } from "lucide-react";
import { Alan, Form, Girdi, KaydetButonu, Mesaj, Metin, Secim } from "@/components/form";
import { BelgeYukleyici } from "@/components/belge-yukleyici";
import { bugun, tarihYaz } from "@/lib/sabitler";
import { sozlesmeKaydet } from "../../eylemler";

export type SozlesmeDeger = {
  id: string;
  santiye_id: string;
  is_tarifi: string;
  baslangic: string | null;
  bitis: string | null;
  yer_teslim: string | null;
  sure_gun: number | null;
  belge_yolu: string | null;
};

function gunEkle(t: string, gun: number) {
  const d = new Date(t + "T12:00:00");
  d.setDate(d.getDate() + gun);
  return d.toISOString().slice(0, 10);
}

function gunFarki(a: string, b: string) {
  return Math.round((Date.parse(a + "T12:00:00") - Date.parse(b + "T12:00:00")) / 86400000);
}

/** Yeni sözleşme ve mevcut sözleşmenin düzeltilmesi için ortak form. */
export function SozlesmeFormu({
  taseronId,
  isTurleri,
  firmaId,
  santiyeler,
  seciliSantiye,
  deger,
}: {
  taseronId: string;
  isTurleri: string[];
  firmaId: string;
  santiyeler: { id: string; ad: string }[];
  seciliSantiye?: string;
  deger?: SozlesmeDeger;
}) {
  const [durum, eylem, bekliyor] = useActionState(sozlesmeKaydet, undefined);
  const [tur, setTur] = useState<"net" | "sure">(deger?.yer_teslim ? "sure" : "net");
  const [baslangic, setBaslangic] = useState(deger?.yer_teslim ? "" : (deger?.baslangic ?? ""));
  const [bitis, setBitis] = useState(deger?.bitis ?? "");
  const [yerTeslim, setYerTeslim] = useState(deger?.yer_teslim ?? "");
  const [sure, setSure] = useState(deger?.sure_gun ? String(deger.sure_gun) : "");
  const [belgeKaldir, setBelgeKaldir] = useState(false);

  // Hangi yöntemle girilirse girilsin, bitiş tarihi ve kalan gün canlı gösterilir:
  // yanlış girilen tarih kaydetmeden önce gözle yakalansın.
  const gun = Number(sure);
  const hesap = tur === "net" ? bitis || null : yerTeslim && gun > 0 ? gunEkle(yerTeslim, gun) : null;
  const kalan = hesap ? gunFarki(hesap, bugun()) : null;

  // Yöntem değişince girilmiş tarihler taşınır; düzeltme yaparken baştan
  // girmek gerekmesin.
  function yontemDegistir(yeni: "net" | "sure") {
    if (yeni === tur) return;
    if (yeni === "net") {
      if (!baslangic && yerTeslim) setBaslangic(yerTeslim);
      if (!bitis && hesap) setBitis(hesap);
    } else {
      if (!yerTeslim && baslangic) setYerTeslim(baslangic);
      if (!sure && baslangic && bitis) setSure(String(Math.max(1, gunFarki(bitis, baslangic))));
    }
    setTur(yeni);
  }

  const varsayilanTarif = isTurleri.filter((t) => t !== "Diğer");
  const secenekDugmesi = (aktif: boolean) =>
    `min-h-14 rounded-xl border-2 px-2 font-semibold ${aktif ? "border-yazi bg-koyu text-white" : "border-cizgi bg-yuzey"}`;

  return (
    <Form eylem={eylem} bekliyor={bekliyor} className="flex flex-col gap-5">
      <input type="hidden" name="taseron_id" value={taseronId} />
      {deger && <input type="hidden" name="id" value={deger.id} />}
      <Alan etiket="Şantiye" zorunlu>
        <Secim
          ad="santiye_id"
          zorunlu
          sutun={2}
          varsayilan={deger?.santiye_id ?? seciliSantiye}
          secenekler={santiyeler.map((s) => ({ deger: s.id, ad: s.ad }))}
        />
      </Alan>
      <Alan etiket="İşin tarifi" zorunlu>
        <Metin
          name="is_tarifi"
          required
          maxLength={500}
          rows={3}
          defaultValue={deger?.is_tarifi ?? (varsayilanTarif.length ? `${varsayilanTarif.join(", ")} işleri` : "")}
        />
      </Alan>

      <Alan etiket="Süre" zorunlu>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => yontemDegistir("net")} className={secenekDugmesi(tur === "net")}>
            Başlangıç + bitiş tarihi
          </button>
          <button type="button" onClick={() => yontemDegistir("sure")} className={secenekDugmesi(tur === "sure")}>
            Yer teslim + gün sayısı
          </button>
        </div>
        <input type="hidden" name="tur" value={tur} />
        {tur === "net" ? (
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 font-semibold">
              Başlangıç
              <Girdi type="date" name="baslangic" value={baslangic} onChange={(e) => setBaslangic(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1 font-semibold">
              Bitiş *
              <Girdi type="date" name="bitis" required value={bitis} min={baslangic || undefined} onChange={(e) => setBitis(e.target.value)} />
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
            <div className="grid grid-cols-3 gap-2">
              {[
                [30, "1 ay"],
                [60, "2 ay"],
                [90, "3 ay"],
                [120, "4 ay"],
                [180, "6 ay"],
                [365, "1 yıl"],
              ].map(([g, ad]) => (
                <button key={g} type="button" onClick={() => setSure(String(g))} className={secenekDugmesi(Number(sure) === g)}>
                  {ad}
                </button>
              ))}
            </div>
          </div>
        )}
        {hesap && kalan != null && (
          <p className={`rounded-xl px-4 py-3 text-lg font-bold ${kalan <= 7 ? "bg-kirmizi text-white" : "bg-koyu text-white"}`}>
            Bitiş: {tarihYaz(hesap)}
            <span className="block text-base font-semibold">
              {kalan < 0 ? `${-kalan} gün önce bitmiş` : kalan === 0 ? "Bugün bitiyor" : `${kalan} gün sonra`}
              {kalan <= 7 && " — tarih doğru mu kontrol edin"}
            </span>
          </p>
        )}
      </Alan>

      <Alan etiket="Sözleşme belgesi">
        {deger?.belge_yolu && !belgeKaldir && (
          <div className="flex min-h-14 items-center gap-2 rounded-xl bg-yuzey px-4">
            <span className="flex-1 font-semibold">Kayıtlı belge var</span>
            <button type="button" onClick={() => setBelgeKaldir(true)} className="min-h-12 rounded-xl border-2 border-cizgi px-3 font-semibold">
              Kaldır
            </button>
          </div>
        )}
        {belgeKaldir && <input type="hidden" name="belge_kaldir" value="1" />}
        <BelgeYukleyici firmaId={firmaId} />
        {deger?.belge_yolu && !belgeKaldir && <p className="text-sm text-soluk">Yeni belge seçerseniz eskisinin yerine geçer.</p>}
      </Alan>

      <Mesaj durum={durum} />
      {durum?.uyari ? (
        <div className="flex flex-col gap-2">
          <button
            type="submit"
            name="onay"
            value="1"
            className="flex min-h-16 items-center justify-center gap-2 rounded-2xl bg-sari text-lg font-bold text-black"
          >
            <TriangleAlert className="size-6" /> Yine de kaydet
          </button>
          <p className="text-center text-sm text-soluk">ya da yukarıdan bilgileri değiştirip tekrar kaydedin</p>
          <KaydetButonu>{deger ? "Değişiklikleri Kaydet" : "Sözleşmeyi Kaydet"}</KaydetButonu>
        </div>
      ) : (
        <KaydetButonu>{deger ? "Değişiklikleri Kaydet" : "Sözleşmeyi Kaydet"}</KaydetButonu>
      )}
    </Form>
  );
}
