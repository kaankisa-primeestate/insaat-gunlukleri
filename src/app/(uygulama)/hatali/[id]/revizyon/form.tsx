"use client";

import { useActionState } from "react";
import { Alan, Form, KaydetButonu, Mesaj, Metin } from "@/components/form";
import { FotoSecici } from "@/components/foto-secici";
import { revizyonKaydet } from "../../eylemler";

/** Hatalı işe yeni gelişme notu; `notId` verilirse var olan notun düzeltilmesi. */
export function RevizyonFormu({
  hataliId,
  firmaId,
  notId,
  metin,
  mevcutFotolar = [],
}: {
  hataliId: string;
  firmaId: string;
  notId?: string;
  metin?: string;
  mevcutFotolar?: { yol: string; adres: string }[];
}) {
  const [durum, eylem, bekliyor] = useActionState(revizyonKaydet, undefined);
  return (
    <Form eylem={eylem} bekliyor={bekliyor} className="flex flex-col gap-6">
      <input type="hidden" name="hatali_id" value={hataliId} />
      {notId && <input type="hidden" name="id" value={notId} />}

      <Alan etiket="Ne gelişti?" zorunlu>
        <Metin
          name="metin"
          required
          minLength={2}
          maxLength={1000}
          placeholder="Örn. Taşeronla konuşuldu; perde yüzeyi tamir harcıyla kapatılacak, cumaya kadar söz verdi."
          defaultValue={metin ?? ""}
          autoFocus={!notId}
        />
      </Alan>

      <Alan etiket="Fotoğraf" ipucu="İsteğe bağlı: düzeltmenin, ölçünün ya da yeni durumun fotoğrafı.">
        <FotoSecici firmaId={firmaId} klasor="hatali" mevcut={mevcutFotolar} />
      </Alan>

      <Mesaj durum={durum} />
      <div className="sticky bottom-3">
        <KaydetButonu>{notId ? "Değişiklikleri Kaydet" : "Revizyonu Kaydet"}</KaydetButonu>
      </div>
    </Form>
  );
}
