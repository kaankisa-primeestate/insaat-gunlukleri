import { redirect } from "next/navigation";
import { yetkiIste } from "@/lib/oturum";
import { katListesi } from "@/lib/sabitler";
import { Sayfa } from "@/components/kabuk";
import type { TaseronSecenek } from "@/components/secimler";
import { GunlukFormu } from "./form";

export default async function YeniGunluk() {
  const o = await yetkiIste("gunluk", true);
  if (!o.santiye) redirect("/");
  const { data } = await o.supabase.rpc("santiye_taseronlari", { p_santiye: o.santiye.id });

  return (
    <Sayfa baslik="Yeni Günlük" geriAd="Vazgeç" sag={<span className="font-bold text-soluk">{o.santiye.ad}</span>}>
      <GunlukFormu
        firmaId={o.firma.id}
        taseronlar={(data ?? []) as TaseronSecenek[]}
        katlar={katListesi(o.santiye.bodrum_kat, o.santiye.kat_sayisi)}
      />
    </Sayfa>
  );
}
