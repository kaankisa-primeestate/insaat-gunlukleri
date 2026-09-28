"use client";

import { useActionState } from "react";
import { Alan, Form, Girdi, KaydetButonu, Mesaj } from "@/components/form";
import { SecimPenceresi } from "@/components/secim-penceresi";
import { ROL_ADI, type Rol } from "@/lib/sabitler";
import { kullaniciGuncelle } from "../../eylemler";

const IC_ROLLER: Rol[] = ["merkez", "personel", "sef", "satinalma"];

/** Kullanıcının bilgilerini ve rolünü düzenleme (D4). */
export function BilgiFormu({
  k,
}: {
  k: { id: string; ad_soyad: string; kullanici_adi: string; telefon: string | null; rol: Rol };
}) {
  const [durum, eylem, bekliyor] = useActionState(kullaniciGuncelle, undefined);
  return (
    <Form eylem={eylem} bekliyor={bekliyor} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={k.id} />
      <Alan etiket="Ad soyad" zorunlu>
        <Girdi name="ad_soyad" required maxLength={80} defaultValue={k.ad_soyad} />
      </Alan>
      <Alan etiket="Kullanıcı adı" zorunlu ipucu="Girişte kullanılır. Değişirse şifre aynı kalır; yeni adı kullanıcıya iletin.">
        <Girdi name="kullanici_adi" required maxLength={32} defaultValue={k.kullanici_adi} autoCapitalize="none" autoCorrect="off" spellCheck={false} />
      </Alan>
      <Alan etiket="Telefon">
        <Girdi name="telefon" type="tel" inputMode="tel" maxLength={20} defaultValue={k.telefon ?? ""} />
      </Alan>
      {k.rol !== "taseron" && (
        <Alan etiket="Rol" ipucu="Rol değişince kişiye özel yetkiler silinir, yeni rolün varsayılanı geçerli olur.">
          <SecimPenceresi
            ad="rol"
            baslik="Rol"
            zorunlu
            sutun={1}
            varsayilan={[k.rol]}
            secenekler={IC_ROLLER.map((r) => ({ deger: r, ad: ROL_ADI[r] }))}
          />
        </Alan>
      )}
      <Mesaj durum={durum} />
      <KaydetButonu renk="koyu">Bilgileri Kaydet</KaydetButonu>
    </Form>
  );
}
