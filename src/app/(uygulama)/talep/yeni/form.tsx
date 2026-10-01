"use client";

import { useActionState, useState } from "react";
import { Clock, NotebookPen } from "lucide-react";
import { Alan, Form, Girdi, KaydetButonu, Mesaj, Metin, Secim } from "@/components/form";
import { FotoSecici } from "@/components/foto-secici";
import { Ek, TerminSecici, YazSec, ilerle, type YazSecSecenek } from "@/components/hizli";
import type { TaseronSecenek } from "@/components/secimler";
import { BIRIMLER, tarihYaz } from "@/lib/sabitler";
import { talepKaydet } from "../eylemler";

const SIK_URUNLER = ["Kum", "Çakıl", "Çimento", "Hazır beton", "İnşaat demiri", "Tuğla", "Bims", "Alçı", "Kablo", "Boru", "Boya", "Seramik"];

export type TalepDeger = {
  id: string;
  taseron_id: string | null;
  taseron_adi: string | null;
  urun: string;
  miktar: number;
  birim: string;
  notu: string | null;
  termin: string | null;
};

/**
 * Yeni talep; `deger` verilirse mevcut talebin düzeltilmesi. Tek sayfa,
 * sırayla: fotoğraf (isteğe bağlı), ürün, miktar, kimin için. Ne zaman lazım
 * ve not ek. Ürün ve "kimin için" yazılır ya da listeden seçilir.
 */
export function TalepFormu({
  taseronlar,
  firmaId,
  oncekiAdlar = [],
  oncekiUrunler = [],
  taseronHesabi = false,
  deger,
  mevcutFotolar,
}: {
  taseronlar: TaseronSecenek[];
  firmaId: string;
  /** Bu şantiyede daha önce elle yazılmış "kimin için" adları. */
  oncekiAdlar?: string[];
  oncekiUrunler?: string[];
  /** Taşeron hesabı yazılı ad giremez, yalnız listeden seçer. */
  taseronHesabi?: boolean;
  deger?: TalepDeger;
  mevcutFotolar?: { yol: string; adres: string }[];
}) {
  const [durum, eylem, bekliyor] = useActionState(talepKaydet, undefined);
  const [id] = useState(() => deger?.id ?? crypto.randomUUID());

  const urunler: YazSecSecenek[] = [...new Set([...oncekiUrunler, ...SIK_URUNLER])].map((u) => ({ deger: u, ad: u }));
  const kiminIcin: YazSecSecenek[] = [
    ...taseronlar.map((t) => ({ deger: t.id, ad: t.firma_adi, alt: t.is_turleri.join(", "), grup: "Taşeronlar" })),
    ...(taseronHesabi ? [] : oncekiAdlar.map((a) => ({ deger: "ad:" + a, ad: a, grup: "Daha önce yazılanlar" }))),
  ];
  // Yazılı adlı talep düzeltilirken ad listede seçili gelir.
  const varsayilanKim = deger?.taseron_id ?? (deger?.taseron_adi ? "ad:" + deger.taseron_adi : undefined);

  return (
    <Form eylem={eylem} bekliyor={bekliyor} className="flex flex-col gap-6">
      <input type="hidden" name="id" value={id} />
      {deger && <input type="hidden" name="duzenle" value="1" />}
      <Alan etiket="Fotoğraf" ipucu="İsteğe bağlı: ürünün, etiketinin ya da örneğinin fotoğrafı.">
        <FotoSecici firmaId={firmaId} klasor="talep" mevcut={mevcutFotolar} />
      </Alan>

      <div id="t-urun">
        <Alan etiket="Ne lazım?" zorunlu>
          <YazSec
            yaziAd="urun"
            secenekler={urunler}
            varsayilanYazi={deger?.urun}
            placeholder="Ürünü yazın ya da listeden seçin"
            zorunlu
            sonra={() => ilerle("t-miktar")}
          />
        </Alan>
      </div>

      <div id="t-miktar">
        <Alan etiket="Kaç tane?" zorunlu>
          <Girdi
            name="miktar"
            type="number"
            inputMode="decimal"
            step="any"
            min="0"
            required
            placeholder="Miktar"
            className="text-2xl font-bold"
            defaultValue={deger ? String(deger.miktar) : undefined}
          />
          <Secim
            ad="birim"
            zorunlu
            sutun={4}
            varsayilan={deger?.birim ?? "Adet"}
            secenekler={BIRIMLER.map((b) => ({ deger: b, ad: b }))}
            onChange={() => ilerle("t-kim", false)}
          />
        </Alan>
      </div>

      <div id="t-kim">
        <Alan etiket="Kimin için?" zorunlu ipucu={taseronHesabi ? undefined : "Firma ya da yer adını yazın, ya da listeden seçin."}>
          <YazSec
            yaziAd="taseron_adi"
            secimAd="kim"
            secenekler={kiminIcin}
            varsayilanSecim={varsayilanKim}
            placeholder="Örn. Merkez şantiye"
            zorunlu
            yazilamaz={taseronHesabi}
          />
        </Alan>
      </div>

      <div className="flex flex-wrap gap-2">
        <Ek
          simge={<Clock className="size-5" />}
          etiket="Ne zaman lazım?"
          ozet={deger?.termin ? tarihYaz(deger.termin) : "Belli değil"}
          acik={Boolean(deger?.termin)}
        >
          <Alan etiket="Ne zaman lazım?">
            <TerminSecici varsayilan={deger?.termin} />
          </Alan>
        </Ek>
        <Ek simge={<NotebookPen className="size-5" />} etiket="Not" acik={Boolean(deger?.notu)}>
          <Alan etiket="Not">
            <Metin name="notu" maxLength={300} placeholder="İsteğe bağlı: nerede kullanılacak, marka, ölçü" defaultValue={deger?.notu ?? ""} />
          </Alan>
        </Ek>
      </div>

      <Mesaj durum={durum} />
      <div className="sticky bottom-3">
        <KaydetButonu>{deger ? "Değişiklikleri Kaydet" : "Talebi Aç"}</KaydetButonu>
      </div>
    </Form>
  );
}
