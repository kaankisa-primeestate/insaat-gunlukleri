"use client";

import { useActionState, useState } from "react";
import { Eye, Pencil } from "lucide-react";
import { Form, KaydetButonu, Mesaj } from "@/components/form";
import { SAYFALAR, varsayilanYetki, type Rol, type Sayfa } from "@/lib/sabitler";
import { yetkiKaydet } from "@/app/(uygulama)/yonetim/eylemler";

type Satir = { sayfa: string; gorur: boolean; duzenler: boolean };

const NOTLAR: Partial<Record<Rol, Partial<Record<Sayfa, string>>>> = {
  taseron: {
    gunluk: "Yalnızca kendi kayıtları",
    hatali: "Yalnızca kendi; onaylayamaz",
    talep: "Yalnızca kendi",
    teslimat: "Yalnızca kendi",
    sozlesme: "Yalnızca kendi",
    taseronlar: "Diğer taşeronları hiçbir durumda göremez",
  },
};

/**
 * Sayfa bazlı yetki matrisi: her satırda "Görür" ve "Düzenler".
 * Düzenleyen görmek zorundadır; "Düzenler" işaretlenince "Görür" de işaretlenir.
 */
export function YetkiMatrisi({
  rol,
  mevcut,
  kullaniciId,
  taseronId,
}: {
  rol: Rol;
  mevcut: Satir[];
  kullaniciId?: string;
  taseronId?: string;
}) {
  const [durum, eylem, bekliyor] = useActionState(yetkiKaydet, undefined);
  const ozel = new Map(mevcut.map((m) => [m.sayfa, m]));
  const [deger, setDeger] = useState(() =>
    Object.fromEntries(
      SAYFALAR.map(({ kod }) => {
        const m = ozel.get(kod);
        return [kod, m ? { g: m.gorur, d: m.duzenler } : { g: varsayilanYetki(rol, kod, false), d: varsayilanYetki(rol, kod, true) }];
      }),
    ) as Record<Sayfa, { g: boolean; d: boolean }>,
  );

  if (rol === "merkez") {
    return <p className="rounded-xl bg-yuzey p-4">Merkez yöneticisi her şeyi görür ve düzenler; kısıtlanamaz.</p>;
  }

  return (
    <Form eylem={eylem} bekliyor={bekliyor} className="flex flex-col gap-4">
      {kullaniciId && <input type="hidden" name="kullanici_id" value={kullaniciId} />}
      {taseronId && <input type="hidden" name="taseron_id" value={taseronId} />}
      <div className="overflow-hidden rounded-2xl border-2 border-cizgi">
        <div className="grid grid-cols-[1fr_4.5rem_4.5rem] items-center bg-koyu px-3 py-2 text-sm font-bold text-white">
          <span>Sayfa</span>
          <span className="flex flex-col items-center"><Eye className="size-5" />Görür</span>
          <span className="flex flex-col items-center"><Pencil className="size-5" />Düzenler</span>
        </div>
        {SAYFALAR.map(({ kod, ad }) => {
          const kilitli = rol === "taseron" && kod === "taseronlar";
          const d = deger[kod];
          return (
            <div key={kod} className="grid grid-cols-[1fr_4.5rem_4.5rem] items-center border-t-2 border-cizgi px-3 py-2">
              <div className="min-w-0">
                <p className="font-bold">{ad}</p>
                {NOTLAR[rol]?.[kod] && <p className="text-sm text-soluk">{NOTLAR[rol]![kod]}</p>}
              </div>
              <Kutucuk
                ad={`${kod}_g`}
                secili={!kilitli && d.g}
                kilitli={kilitli}
                degis={(v) => setDeger((x) => ({ ...x, [kod]: { g: v, d: v ? x[kod].d : false } }))}
              />
              <Kutucuk
                ad={`${kod}_d`}
                secili={!kilitli && d.d}
                kilitli={kilitli}
                degis={(v) => setDeger((x) => ({ ...x, [kod]: { g: v ? true : x[kod].g, d: v } }))}
              />
            </div>
          );
        })}
      </div>
      <Mesaj durum={durum} />
      <KaydetButonu>Yetkileri Kaydet</KaydetButonu>
    </Form>
  );
}

function Kutucuk({ ad, secili, kilitli, degis }: { ad: string; secili: boolean; kilitli: boolean; degis: (v: boolean) => void }) {
  return (
    <label className="grid place-items-center">
      <input
        type="checkbox"
        name={ad}
        checked={secili}
        disabled={kilitli}
        onChange={(e) => degis(e.target.checked)}
        className="size-9 accent-yesil disabled:opacity-40"
      />
    </label>
  );
}
