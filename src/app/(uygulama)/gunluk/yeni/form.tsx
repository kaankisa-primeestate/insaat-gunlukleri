"use client";

import { useActionState, useState } from "react";
import { Alan, Girdi, KaydetButonu, Mesaj, Metin, Secim, TarihSecici } from "@/components/form";
import { FotoSecici } from "@/components/foto-secici";
import { SayiSecici, TaseronSecici, type TaseronSecenek } from "@/components/secimler";
import { isKalemleri } from "@/lib/sabitler";
import { gunlukKaydet } from "../eylemler";

export function GunlukFormu({ firmaId, taseronlar, katlar }: { firmaId: string; taseronlar: TaseronSecenek[]; katlar: string[] }) {
  const [durum, eylem] = useActionState(gunlukKaydet, undefined);
  // Kimlik formda üretilir: çift dokunmada aynı kayıt iki kez oluşmaz.
  const [id] = useState(() => crypto.randomUUID());
  const [taseron, setTaseron] = useState<TaseronSecenek | undefined>(taseronlar.length === 1 ? taseronlar[0] : undefined);
  const [kalem, setKalem] = useState("");
  const kalemler = taseron ? isKalemleri(taseron.is_turleri) : [];

  return (
    <form action={eylem} className="flex flex-col gap-6">
      <input type="hidden" name="id" value={id} />
      <Alan etiket="Taşeron" zorunlu>
        <TaseronSecici taseronlar={taseronlar} onChange={(t) => { setTaseron(t); setKalem(""); }} />
      </Alan>

      <Alan etiket="Tarih">
        <TarihSecici />
      </Alan>

      <Alan etiket="Kişi sayısı">
        <SayiSecici ad="kisi_sayisi" varsayilan={1} />
      </Alan>

      <Alan etiket="Kat">
        <Secim ad="kat" sutun={4} secenekler={katlar.map((k) => ({ deger: k, ad: k }))} />
      </Alan>

      {taseron && (
        <Alan etiket="Yapılan iş">
          <Secim
            key={taseron.id}
            ad="is_kalemi"
            sutun={3}
            onChange={setKalem}
            secenekler={[...kalemler, "Diğer"].map((k) => ({ deger: k, ad: k }))}
          />
          {kalem === "Diğer" && <Girdi name="is_kalemi_diger" placeholder="Yapılan iş" maxLength={80} />}
        </Alan>
      )}

      <Alan etiket="Kısa not">
        <Metin name="notu" maxLength={300} placeholder="İsteğe bağlı" />
      </Alan>

      <Alan etiket="Fotoğraf">
        <FotoSecici firmaId={firmaId} klasor="gunluk" />
      </Alan>

      <Mesaj durum={durum} />
      <div className="sticky bottom-3">
        <KaydetButonu />
      </div>
    </form>
  );
}
