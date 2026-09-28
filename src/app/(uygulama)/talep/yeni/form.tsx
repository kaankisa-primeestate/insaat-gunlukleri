"use client";

import { useActionState, useState } from "react";
import { Alan, Form, Girdi, KaydetButonu, Mesaj, Metin } from "@/components/form";
import { SecimPenceresi } from "@/components/secim-penceresi";
import { FotoSecici } from "@/components/foto-secici";
import { TaseronSecici, type TaseronSecenek } from "@/components/secimler";
import { BIRIMLER } from "@/lib/sabitler";
import { talepKaydet } from "../eylemler";

const SIK_URUNLER = ["Kum", "Çakıl", "Çimento", "Hazır beton", "İnşaat demiri", "Tuğla", "Bims", "Alçı", "Kablo", "Boru", "Boya", "Seramik"];

export type TalepDeger = { id: string; taseron_id: string; urun: string; miktar: number; birim: string; notu: string | null };

/** Yeni talep; `deger` verilirse mevcut talebin düzeltilmesi. */
export function TalepFormu({
  taseronlar,
  firmaId,
  deger,
  mevcutFotolar,
}: {
  taseronlar: TaseronSecenek[];
  firmaId: string;
  deger?: TalepDeger;
  mevcutFotolar?: { yol: string; adres: string }[];
}) {
  const [durum, eylem, bekliyor] = useActionState(talepKaydet, undefined);
  const [id] = useState(() => deger?.id ?? crypto.randomUUID());
  // Listede olmayan ürün "Diğer" olarak açılır, adı yazı kutusuna gelir.
  const listede = !deger || SIK_URUNLER.includes(deger.urun);
  const [diger, setDiger] = useState(!listede);
  return (
    <Form eylem={eylem} bekliyor={bekliyor} className="flex flex-col gap-6">
      <input type="hidden" name="id" value={id} />
      {deger && <input type="hidden" name="duzenle" value="1" />}
      <Alan etiket="Fotoğraf" ipucu="İsteğe bağlı: ürünün, etiketinin ya da örneğinin fotoğrafı.">
        <FotoSecici firmaId={firmaId} klasor="talep" mevcut={mevcutFotolar} />
      </Alan>
      <Alan etiket="Hangi taşeron için?" zorunlu>
        <TaseronSecici taseronlar={taseronlar} varsayilan={deger?.taseron_id} />
      </Alan>
      <Alan etiket="Ürün" zorunlu>
        <SecimPenceresi
          ad="urun_secim"
          baslik="Ürün"
          zorunlu
          bosYazi="Ürün seçmek için dokunun"
          varsayilan={deger ? [listede ? deger.urun : "Diğer"] : []}
          secenekler={[...SIK_URUNLER, "Diğer"].map((u) => ({ deger: u, ad: u === "Diğer" ? "Diğer (yazarak)" : u }))}
          onChange={(d) => setDiger(d[0] === "Diğer")}
        />
        {diger && (
          <Girdi name="urun_diger" required maxLength={80} placeholder="Ürünü yazın" autoFocus={!deger} defaultValue={!listede ? deger?.urun : ""} />
        )}
      </Alan>
      <Alan etiket="Miktar" zorunlu>
        <Girdi
          name="miktar"
          type="number"
          inputMode="decimal"
          step="any"
          min="0"
          required
          className="text-2xl font-bold"
          defaultValue={deger ? String(deger.miktar) : undefined}
        />
      </Alan>
      <Alan etiket="Birim" zorunlu>
        <SecimPenceresi ad="birim" baslik="Birim" zorunlu sutun={3} varsayilan={[deger?.birim ?? "Adet"]} secenekler={BIRIMLER.map((b) => ({ deger: b, ad: b }))} />
      </Alan>
      <Alan etiket="Not">
        <Metin name="notu" maxLength={300} placeholder="İsteğe bağlı: marka, ölçü, aciliyet" defaultValue={deger?.notu ?? ""} />
      </Alan>
      <Mesaj durum={durum} />
      <div className="sticky bottom-3">
        <KaydetButonu>{deger ? "Değişiklikleri Kaydet" : "Talebi Aç"}</KaydetButonu>
      </div>
    </Form>
  );
}
