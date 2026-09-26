"use client";

import { useActionState, useState } from "react";
import { Alan, Form, Girdi, KaydetButonu, Mesaj } from "@/components/form";
import { SecimPenceresi } from "@/components/secim-penceresi";
import { Plus, Trash2 } from "lucide-react";
import { IS_TURU_LISTESI } from "@/lib/sabitler";
import { taseronKaydet } from "./eylemler";

export type Yetkili = { ad: string; telefon: string };

export type TaseronBilgi = {
  id?: string;
  firma_adi?: string;
  yetkililer?: Yetkili[];
  vergi_no?: string | null;
  iban?: string | null;
  is_turleri?: string[];
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
  const [durum, eylem, bekliyor] = useActionState(taseronKaydet, undefined);
  return (
    <Form eylem={eylem} bekliyor={bekliyor} className="flex flex-col gap-5">
      {deger.id && <input type="hidden" name="id" value={deger.id} />}
      <Alan etiket="Firma adı" zorunlu>
        <Girdi name="firma_adi" required maxLength={120} defaultValue={deger.firma_adi} />
      </Alan>
      <Alan etiket="Yapacağı işler" zorunlu ipucu="Birden fazla seçebilirsiniz.">
        <SecimPenceresi
          ad="is_turleri"
          baslik="Yapacağı işler"
          coklu
          zorunlu
          sutun={2}
          bosYazi="İş seçmek için dokunun"
          varsayilan={deger.is_turleri}
          secenekler={IS_TURU_LISTESI.map((t) => ({ deger: t, ad: t }))}
        />
      </Alan>
      <Alan etiket="Yetkililer" ipucu="Aynı firmada birden fazla yetkili ve telefon girebilirsiniz.">
        <Yetkililer baslangic={deger.yetkililer ?? []} />
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
            <SecimPenceresi
              ad="ust_taseron_id"
              baslik="Ana taşeron"
              bosYazi="Yok — doğrudan firmaya bağlı"
              varsayilan={deger.ust_taseron_id ? [deger.ust_taseron_id] : []}
              secenekler={[
                { deger: "", ad: "Yok — doğrudan firmaya bağlı" },
                ...anaTaseronlar.filter((t) => t.id !== deger.id).map((t) => ({ deger: t.id, ad: t.firma_adi })),
              ]}
            />
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
    </Form>
  );
}

/** Yetkili satırları: ad + telefon, satır eklenip çıkarılabilir. */
function Yetkililer({ baslangic }: { baslangic: Yetkili[] }) {
  const [satirlar, setSatirlar] = useState(() =>
    (baslangic.length ? baslangic : [{ ad: "", telefon: "" }]).map((y) => ({ ...y, anahtar: crypto.randomUUID() })),
  );
  return (
    <div className="flex flex-col gap-3">
      {satirlar.map((y, i) => (
        <div key={y.anahtar} className="flex flex-col gap-2 rounded-xl border-2 border-cizgi p-3">
          <div className="flex items-center justify-between">
            <span className="font-bold">{i + 1}. yetkili</span>
            {satirlar.length > 1 && (
              <button
                type="button"
                aria-label={`${i + 1}. yetkiliyi kaldır`}
                onClick={() => setSatirlar((l) => l.filter((x) => x.anahtar !== y.anahtar))}
                className="grid size-11 place-items-center rounded-xl text-kirmizi active:bg-yuzey"
              >
                <Trash2 className="size-6" />
              </button>
            )}
          </div>
          <Girdi name="yetkili_ad" placeholder="Ad soyad" maxLength={80} defaultValue={y.ad} autoComplete="off" />
          <Girdi name="yetkili_tel" placeholder="Telefon" type="tel" inputMode="tel" maxLength={20} defaultValue={y.telefon} autoComplete="off" />
        </div>
      ))}
      {satirlar.length < 10 && (
        <button
          type="button"
          onClick={() => setSatirlar((l) => [...l, { ad: "", telefon: "", anahtar: crypto.randomUUID() }])}
          className="flex min-h-14 items-center justify-center gap-2 rounded-xl border-2 border-dashed border-cizgi font-bold"
        >
          <Plus className="size-6" /> Yetkili ekle
        </button>
      )}
    </div>
  );
}
