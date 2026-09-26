"use client";

import { useActionState, useState } from "react";
import { Alan, Form, Girdi, KaydetButonu, Mesaj } from "@/components/form";
import { SecimPenceresi } from "@/components/secim-penceresi";
import { ROL_ADI, type Rol } from "@/lib/sabitler";
import { kullaniciEkle } from "../../eylemler";

const ROLLER: Rol[] = ["sef", "satinalma", "personel", "taseron", "merkez"];

export function KullaniciFormu({
  taseronlar,
  santiyeler,
  taseronId,
}: {
  taseronlar: { id: string; firma_adi: string; ust_taseron_id: string | null }[];
  santiyeler: { id: string; ad: string }[];
  taseronId?: string;
}) {
  const [durum, eylem, bekliyor] = useActionState(kullaniciEkle, undefined);
  const [rol, setRol] = useState<Rol | undefined>(taseronId ? "taseron" : undefined);

  return (
    <Form eylem={eylem} bekliyor={bekliyor} className="flex flex-col gap-5">
      <Alan etiket="Rol" zorunlu>
        <SecimPenceresi
          ad="rol"
          baslik="Rol"
          zorunlu
          sutun={1}
          bosYazi="Rol seçmek için dokunun"
          varsayilan={rol ? [rol] : []}
          onChange={(d) => setRol(d[0] as Rol | undefined)}
          secenekler={ROLLER.map((r) => ({ deger: r, ad: ROL_ADI[r] }))}
        />
      </Alan>

      {rol === "taseron" && (
        <Alan etiket="Taşeron firması" zorunlu>
          <SecimPenceresi
            ad="taseron_id"
            baslik="Taşeron firması"
            zorunlu
            bosYazi="Taşeron seçmek için dokunun"
            varsayilan={taseronId ? [taseronId] : []}
            secenekler={taseronlar.map((t) => ({ deger: t.id, ad: t.firma_adi, alt: t.ust_taseron_id ? "Alt taşeron" : undefined }))}
          />
        </Alan>
      )}

      <Alan etiket="Ad soyad" zorunlu>
        <Girdi name="ad_soyad" required maxLength={80} />
      </Alan>
      <Alan etiket="Telefon">
        <Girdi name="telefon" type="tel" inputMode="tel" maxLength={20} />
      </Alan>
      <Alan etiket="Kullanıcı adı" zorunlu ipucu="Küçük harf, Türkçe karakter olmadan. Örnek: ahmet.kalip">
        <Girdi name="kullanici_adi" required autoCapitalize="none" autoCorrect="off" spellCheck={false} autoComplete="off" />
      </Alan>
      <Alan etiket="Şifre" zorunlu ipucu="En az 6 karakter. Kullanıcıya siz ileteceksiniz.">
        <Girdi name="sifre" required minLength={6} autoComplete="new-password" />
      </Alan>

      {rol === "sef" && (
        <Alan etiket="Şantiyeler" zorunlu ipucu="Şef yalnızca seçilen şantiyeleri görür.">
          <SecimPenceresi
            ad="santiye"
            baslik="Sorumlu olduğu şantiyeler"
            coklu
            zorunlu
            bosYazi="Şantiye seçmek için dokunun"
            secenekler={santiyeler.map((s) => ({ deger: s.id, ad: s.ad }))}
          />
        </Alan>
      )}
      {(rol === "personel" || rol === "satinalma") && (
        <p className="rounded-xl bg-yuzey px-4 py-3 text-soluk">Bu rol tüm şantiyeleri görür; şantiye seçimi gerekmez.</p>
      )}

      <Mesaj durum={durum} />
      <KaydetButonu>Kullanıcıyı Oluştur</KaydetButonu>
    </Form>
  );
}
