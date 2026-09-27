"use client";

import { useState, useTransition } from "react";
import { LocateFixed, MapPin, Search } from "lucide-react";
import { Mesaj, type FormDurumu } from "@/components/form";
import { santiyeKonumAra, santiyeKonumKaydet } from "../eylemler";

type Sonuc = { id: number; ad: string; enlem: number; boylam: number };

/**
 * Şantiye konumu: ilçe/şehir adıyla arayıp seçmek ya da şantiyedeyken
 * telefonun konumunu kullanmak. Hava durumu bu noktadan alınır; ilçe
 * düzeyi yeterlidir (hava modeli birkaç kilometrelik ızgara kullanır).
 */
export function KonumAyarla({ id, mevcut }: { id: string; mevcut: string | null }) {
  const [acik, setAcik] = useState(false);
  const [sorgu, setSorgu] = useState("");
  const [sonuclar, setSonuclar] = useState<Sonuc[] | null>(null);
  const [durum, setDurum] = useState<FormDurumu>(undefined);
  const [bekliyor, basla] = useTransition();

  function ara(e: React.FormEvent) {
    e.preventDefault();
    basla(async () => {
      setDurum(undefined);
      setSonuclar(await santiyeKonumAra(sorgu));
    });
  }

  function kaydet(enlem: number, boylam: number, ad: string) {
    basla(async () => {
      const d = await santiyeKonumKaydet(id, enlem, boylam, ad);
      setDurum(d);
      if (d?.tamam) {
        setAcik(false);
        setSonuclar(null);
        setSorgu("");
      }
    });
  }

  function buradayim() {
    if (!navigator.geolocation) return setDurum({ hata: "Bu cihaz konum vermiyor." });
    setDurum(undefined);
    navigator.geolocation.getCurrentPosition(
      (p) => kaydet(p.coords.latitude, p.coords.longitude, "Telefon konumu"),
      () => setDurum({ hata: "Konum alınamadı. Telefonun konum izni açık olmalı." }),
      { enableHighAccuracy: false, timeout: 15000 },
    );
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      <p className="flex items-center gap-1.5 text-soluk">
        <MapPin className="size-5 shrink-0" />
        {mevcut ? <span>Hava durumu konumu: <b className="text-yazi">{mevcut}</b></span> : <span className="font-semibold text-kirmizi">Konum yok, hava durumu gösterilemiyor</span>}
      </p>
      {!acik ? (
        <button type="button" onClick={() => setAcik(true)} className="min-h-12 self-start rounded-xl border-2 border-cizgi px-4 font-semibold">
          {mevcut ? "Konumu değiştir" : "Konum ekle"}
        </button>
      ) : (
        <div className="flex flex-col gap-2 rounded-2xl bg-yuzey p-3">
          <form onSubmit={ara} className="flex gap-2">
            <input
              value={sorgu}
              onChange={(e) => setSorgu(e.target.value)}
              placeholder="İlçe ya da şehir, örn. Karamürsel"
              className="min-h-12 w-full min-w-0 rounded-xl border-2 border-cizgi bg-zemin px-3 text-lg"
              autoFocus
            />
            <button disabled={bekliyor || sorgu.trim().length < 2} className="grid min-h-12 min-w-12 place-items-center rounded-xl bg-koyu text-white disabled:opacity-50" aria-label="Ara">
              <Search className="size-6" />
            </button>
          </form>
          {sonuclar?.length === 0 && <p className="text-soluk">Bulunamadı. İlçe ya da şehir adını deneyin.</p>}
          {!!sonuclar?.length && (
            <ul className="flex flex-col gap-1">
              {sonuclar.map((s) => (
                <li key={s.id}>
                  <button type="button" disabled={bekliyor} onClick={() => kaydet(s.enlem, s.boylam, s.ad)} className="min-h-12 w-full rounded-xl bg-zemin px-3 text-left font-semibold active:bg-cizgi">
                    {s.ad}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button type="button" disabled={bekliyor} onClick={buradayim} className="flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-cizgi bg-zemin font-semibold">
            <LocateFixed className="size-5" /> Şantiyedeyim, telefonun konumunu kullan
          </button>
          <button type="button" onClick={() => setAcik(false)} className="min-h-10 font-semibold text-soluk">Vazgeç</button>
        </div>
      )}
      <Mesaj durum={durum} />
    </div>
  );
}
