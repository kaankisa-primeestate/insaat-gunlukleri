"use client";

import { useActionState, useState } from "react";
import { Alan, Form, Girdi, KaydetButonu, Mesaj, Metin, Secim } from "@/components/form";
import { FotoSecici } from "@/components/foto-secici";
import { ElleDugmesi, ilerle } from "@/components/hizli";
import { SecimPenceresi } from "@/components/secim-penceresi";
import { taseronSecenekleri, type TaseronSecenek } from "@/components/secimler";
import { ONEM, ROL_ADI, type Onem, type Rol } from "@/lib/sabitler";
import type { Yer } from "@/lib/yerler";
import { hataKaydet } from "../eylemler";

export type HataDeger = {
  id: string;
  taseron_id: string | null;
  sorumlu_kullanici_id: string | null;
  aciklama: string;
  kat: string | null;
  onem: Onem;
};

/**
 * Yeni hatalı iş; `deger` verilirse mevcut kaydın düzeltilmesi. Tek sayfa,
 * sırayla: fotoğraf (isteğe bağlı), kimin işi, nerede, ne hatalı, önem.
 * Tarih sorulmaz: kaydedildiği gün.
 */
export function HataFormu({
  firmaId,
  taseronlar,
  personel,
  katlar,
  deger,
  mevcutFotolar,
}: {
  firmaId: string;
  taseronlar: TaseronSecenek[];
  personel: { id: string; ad_soyad: string; rol: Rol }[];
  katlar: Yer[];
  deger?: HataDeger;
  mevcutFotolar?: { yol: string; adres: string }[];
}) {
  const [durum, eylem, bekliyor] = useActionState(hataKaydet, undefined);
  const [id] = useState(() => deger?.id ?? crypto.randomUUID());
  const sorumlu = deger ? (deger.taseron_id ? "t:" + deger.taseron_id : "k:" + deger.sorumlu_kullanici_id) : undefined;
  // Listede olmayan yer elle yazılır; düzeltmede elle yazılmış yer kutuda gelir.
  const listedeYer = !deger?.kat || katlar.some((k) => k.deger === deger.kat);
  const [elleYer, setElleYer] = useState(!listedeYer);
  return (
    <Form
      eylem={eylem}
      bekliyor={bekliyor}
      cevrimdisi={{ tur: "hatali", ozet: (v) => String(v.get("aciklama") ?? "").slice(0, 80) }}
      className="flex flex-col gap-6"
    >
      <input type="hidden" name="id" value={id} />
      {deger && <input type="hidden" name="duzenle" value="1" />}
      <Alan etiket="Fotoğraf" ipucu="İsteğe bağlı; çekmeden de devam edebilirsiniz.">
        <FotoSecici firmaId={firmaId} klasor="hatali" mevcut={mevcutFotolar} cevrimdisi />
      </Alan>
      <div id="h-kimin">
        <Alan etiket="Kimin işi?" zorunlu ipucu="Bir taşeron ya da bir kişi (kalfa, şef…) seçin.">
          {/* Değer "t:" ile taşeron, "k:" ile kullanıcı kimliği taşır. */}
          <SecimPenceresi
            ad="sorumlu"
            baslik="Kimin işi?"
            zorunlu
            bosYazi="Taşeron ya da kişi seçmek için dokunun"
            varsayilan={sorumlu ? [sorumlu] : []}
            secenekler={[
              ...taseronSecenekleri(taseronlar, "Taşeronlar", "t:"),
              ...personel.map((p) => ({ deger: "k:" + p.id, ad: p.ad_soyad, alt: ROL_ADI[p.rol], grup: "Personel" })),
            ]}
            sonra={() => ilerle("h-yer", false)}
          />
        </Alan>
      </div>
      <div id="h-yer">
        <Alan etiket="Nerede?">
          {elleYer ? (
            <Girdi
              name="kat_elle"
              maxLength={80}
              placeholder="Örn. Bahçede otopark rampasının duvarı"
              defaultValue={!listedeYer ? (deger?.kat ?? "") : ""}
              autoFocus={listedeYer}
            />
          ) : (
            <SecimPenceresi
              ad="kat"
              baslik="Nerede?"
              sutun={3}
              bosYazi="Yer seçmek için dokunun"
              varsayilan={deger?.kat && listedeYer ? [deger.kat] : []}
              secenekler={katlar}
              sonra={() => ilerle("h-aciklama")}
            />
          )}
          <ElleDugmesi elle={elleYer} onClick={() => setElleYer((x) => !x)} />
        </Alan>
      </div>
      <div id="h-aciklama">
        <Alan etiket="Ne eksik / hatalı?" zorunlu>
          <Metin name="aciklama" required maxLength={300} placeholder="Örn. 7. kat tabliye kalıbında sehim var" defaultValue={deger?.aciklama ?? ""} />
        </Alan>
      </div>
      <Alan etiket="Önem">
        <Secim
          ad="onem"
          zorunlu
          sutun={3}
          varsayilan={deger?.onem ?? "normal"}
          secenekler={(Object.keys(ONEM) as (keyof typeof ONEM)[]).map((k) => ({
            deger: k,
            ad: ONEM[k].ad,
            renk: ONEM[k].secili,
          }))}
        />
      </Alan>
      <Mesaj durum={durum} />
      <div className="sticky bottom-3">
        <KaydetButonu renk="kirmizi">{deger ? "Değişiklikleri Kaydet" : undefined}</KaydetButonu>
      </div>
    </Form>
  );
}
