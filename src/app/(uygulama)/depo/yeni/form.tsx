"use client";

import { useActionState } from "react";
import { NotebookPen } from "lucide-react";
import { Alan, Form, Girdi, KaydetButonu, Mesaj, Metin, Secim } from "@/components/form";
import { FotoSecici } from "@/components/foto-secici";
import { Ek, YazSec, ilerle } from "@/components/hizli";
import { BIRIMLER } from "@/lib/sabitler";
import { kalemKaydet } from "../eylemler";

export type KalemDeger = { id: string; ad: string; ozellik: string | null; birim: string; notu: string | null };

/** "Nerede duruyor?" seçimi: tanımlı depolar ve daha önce yazılmış yerler; listede yoksa yazılır. */
export function YerSecimi({ depolar, oncekiYerler }: { depolar: { id: string; ad: string }[]; oncekiYerler: string[] }) {
  return (
    <YazSec
      yaziAd="yer_adi"
      secimAd="yer"
      placeholder="Örn. Celayir şantiyesi konteyner"
      zorunlu
      secenekler={[
        ...depolar.map((d) => ({ deger: d.id, ad: d.ad, grup: "Depolar" })),
        ...oncekiYerler.map((y) => ({ deger: "ad:" + y, ad: y, grup: "Daha önce yazılanlar" })),
      ]}
    />
  );
}

/**
 * Yeni depo kaydı (tek sayfa: fotoğraf, ne, özellikleri, miktar, nerede);
 * `deger` verilirse düzeltme. Düzeltmede miktar ve yer yoktur: onlar
 * dosyadaki hareketlerle değişir, böylece her değişiklik iz bırakır.
 */
export function KalemFormu({
  firmaId,
  depolar = [],
  oncekiYerler = [],
  deger,
  mevcutFotolar,
}: {
  firmaId: string;
  depolar?: { id: string; ad: string }[];
  oncekiYerler?: string[];
  deger?: KalemDeger;
  mevcutFotolar?: { yol: string; adres: string }[];
}) {
  const [durum, eylem, bekliyor] = useActionState(kalemKaydet, undefined);
  return (
    <Form eylem={eylem} bekliyor={bekliyor} className="flex flex-col gap-6">
      {deger && <input type="hidden" name="id" value={deger.id} />}
      <Alan etiket="Fotoğraf" ipucu="Adını tam bilmediğiniz şey fotoğrafla tanınır.">
        <FotoSecici firmaId={firmaId} klasor="depo" mevcut={mevcutFotolar} />
      </Alan>

      <Alan etiket="Ne?" zorunlu>
        <Girdi name="ad" required minLength={2} maxLength={80} placeholder="Örn. Darbeli matkap, 60x60 seramik" defaultValue={deger?.ad} />
      </Alan>

      <Alan etiket="Özellikleri">
        <Metin
          name="ozellik"
          maxLength={300}
          placeholder="Marka, renk, ölçü, model… Örn. Sarı, Bosch, 2 bataryalı"
          defaultValue={deger?.ozellik ?? ""}
        />
      </Alan>

      <div id="d-miktar">
        <Alan etiket={deger ? "Birim" : "Ne kadar?"} zorunlu>
          {!deger && (
            <Girdi name="miktar" type="number" inputMode="decimal" step="any" min="0" required placeholder="Miktar" className="text-2xl font-bold" />
          )}
          <Secim
            ad="birim"
            zorunlu
            sutun={4}
            varsayilan={deger?.birim ?? "Adet"}
            secenekler={BIRIMLER.map((b) => ({ deger: b, ad: b }))}
            onChange={() => !deger && ilerle("d-yer", false)}
          />
        </Alan>
      </div>

      {!deger && (
        <div id="d-yer">
          <Alan etiket="Nerede duruyor?" zorunlu ipucu="Depoyu seçin ya da yeri yazın.">
            <YerSecimi depolar={depolar} oncekiYerler={oncekiYerler} />
          </Alan>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Ek simge={<NotebookPen className="size-5" />} etiket="Not" acik={Boolean(deger?.notu)}>
          <Alan etiket="Not">
            <Metin name="notu" maxLength={300} placeholder="Nereden geldi, nasıl muhafaza ediliyor…" defaultValue={deger?.notu ?? ""} />
          </Alan>
        </Ek>
      </div>

      <Mesaj durum={durum} />
      <div className="sticky bottom-3">
        <KaydetButonu>{deger ? "Düzeltmeyi Kaydet" : "Kaydet"}</KaydetButonu>
      </div>
    </Form>
  );
}
