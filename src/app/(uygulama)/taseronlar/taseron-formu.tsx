"use client";

import { useActionState } from "react";
import { Alan, Girdi, KaydetButonu, Liste, Mesaj, Secim } from "@/components/form";
import { IS_TURU_LISTESI } from "@/lib/sabitler";
import { taseronKaydet } from "./eylemler";

export type TaseronBilgi = {
  id?: string;
  firma_adi?: string;
  yetkili?: string | null;
  telefon?: string | null;
  vergi_no?: string | null;
  iban?: string | null;
  is_turu?: string;
  ust_taseron_id?: string | null;
  alt_taseron_yetkisi?: boolean;
};

export function TaseronFormu({
  deger = {},
  anaTaseronlar,
  altTaseronModu,
}: {
  deger?: TaseronBilgi;
  anaTaseronlar: { id: string; firma_adi: string }[];
  /** Ana taşeron kendi alt taşeronunu açıyor. */
  altTaseronModu?: boolean;
}) {
  const [durum, eylem] = useActionState(taseronKaydet, undefined);
  return (
    <form action={eylem} className="flex flex-col gap-5">
      {deger.id && <input type="hidden" name="id" value={deger.id} />}
      <Alan etiket="Firma adı" zorunlu>
        <Girdi name="firma_adi" required maxLength={120} defaultValue={deger.firma_adi} />
      </Alan>
      <Alan etiket="Yapacağı iş" zorunlu>
        <Secim ad="is_turu" zorunlu sutun={3} varsayilan={deger.is_turu} secenekler={IS_TURU_LISTESI.map((t) => ({ deger: t, ad: t }))} />
      </Alan>
      <Alan etiket="Yetkili kişi">
        <Girdi name="yetkili" maxLength={80} defaultValue={deger.yetkili ?? ""} autoComplete="off" />
      </Alan>
      <Alan etiket="Telefon">
        <Girdi name="telefon" type="tel" inputMode="tel" maxLength={20} defaultValue={deger.telefon ?? ""} />
      </Alan>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Alan etiket="Vergi no">
          <Girdi name="vergi_no" inputMode="numeric" maxLength={20} defaultValue={deger.vergi_no ?? ""} />
        </Alan>
        <Alan etiket="IBAN">
          <Girdi name="iban" maxLength={40} placeholder="TR.." defaultValue={deger.iban ?? ""} autoCapitalize="characters" />
        </Alan>
      </div>

      {!altTaseronModu && (
        <>
          <Alan etiket="Ana taşeron" ipucu="Bu firma başka bir taşeronun alt taşeronuysa seçin. Ana taşeron alt taşeronunu görür, tersi olmaz.">
            <Liste name="ust_taseron_id" defaultValue={deger.ust_taseron_id ?? ""}>
              <option value="">Yok — doğrudan firmaya bağlı</option>
              {anaTaseronlar
                .filter((t) => t.id !== deger.id)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.firma_adi}
                  </option>
                ))}
            </Liste>
          </Alan>
          <label className="flex min-h-14 items-center gap-3 rounded-xl border-2 border-cizgi bg-yuzey px-4 font-semibold">
            <input
              type="checkbox"
              name="alt_taseron_yetkisi"
              defaultChecked={deger.alt_taseron_yetkisi}
              className="size-7 shrink-0 accent-yesil"
            />
            Kendi alt taşeronunu tanımlayabilsin
          </label>
        </>
      )}

      <Mesaj durum={durum} />
      <KaydetButonu>{deger.id ? "Kaydet" : "Taşeronu Kaydet"}</KaydetButonu>
    </form>
  );
}
