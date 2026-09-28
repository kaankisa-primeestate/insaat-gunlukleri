import { redirect } from "next/navigation";
import { yetkiIste } from "@/lib/oturum";
import { Sayfa } from "@/components/kabuk";
import { yerler } from "@/lib/yerler-sunucu";
import type { TaseronSecenek } from "@/components/secimler";
import { GunlukFormu } from "./form";

export default async function YeniGunluk() {
  const o = await yetkiIste("gunluk", true);
  if (!o.santiye) redirect("/");
  const [{ data }, yerListesi] = await Promise.all([
    o.supabase.rpc("santiye_taseronlari", { p_santiye: o.santiye.id }),
    yerler(o),
  ]);

  return (
    <Sayfa baslik="Yeni Günlük" geri="/gunluk" geriAd="Vazgeç" sag={<span className="font-bold text-soluk">{o.santiye.ad}</span>}>
      <GunlukFormu
        firmaId={o.firma.id}
        taseronlar={(data ?? []) as TaseronSecenek[]}
        katlar={yerListesi}
      />
    </Sayfa>
  );
}
