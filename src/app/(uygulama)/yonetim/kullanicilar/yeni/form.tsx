"use client";

import { useActionState, useState } from "react";
import { Alan, Form, Girdi, KaydetButonu, Liste, Mesaj, Secim } from "@/components/form";
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
        <Secim
          ad="rol"
          sutun={2}
          zorunlu
          varsayilan={rol}
          onChange={(r) => setRol(r as Rol)}
          secenekler={ROLLER.map((r) => ({ deger: r, ad: ROL_ADI[r] }))}
        />
      </Alan>

      {rol === "taseron" && (
        <Alan etiket="Taşeron firması" zorunlu>
          <Liste name="taseron_id" required defaultValue={taseronId ?? ""}>
            <option value="" disabled>
              Seçin…
            </option>
            {taseronlar.map((t) => (
              <option key={t.id} value={t.id}>
                {t.firma_adi}
                {t.ust_taseron_id ? " (alt taşeron)" : ""}
              </option>
            ))}
          </Liste>
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

      {rol && rol !== "taseron" && rol !== "merkez" && (
        <Alan
          etiket="Şantiyeler"
          ipucu={rol === "sef" ? "Şef yalnızca işaretlenen şantiyeleri görür." : "Merkez personeli ve satın alma tüm şantiyeleri görür."}
        >
          <div className="flex flex-col gap-2">
            {santiyeler.map((s) => (
              <label key={s.id} className="flex min-h-14 items-center gap-3 rounded-xl border-2 border-cizgi bg-yuzey px-4 text-lg font-semibold">
                <input type="checkbox" name="santiye" value={s.id} className="size-7 accent-yesil" />
                {s.ad}
              </label>
            ))}
          </div>
        </Alan>
      )}

      <Mesaj durum={durum} />
      <KaydetButonu>Kullanıcıyı Oluştur</KaydetButonu>
    </Form>
  );
}
