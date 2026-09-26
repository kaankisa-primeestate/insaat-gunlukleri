import { redirect } from "next/navigation";
import { yetkiIste } from "@/lib/oturum";
import { Sayfa } from "@/components/kabuk";
import type { TaseronSecenek } from "@/components/secimler";
import { TalepFormu } from "./form";

export default async function YeniTalep() {
  const o = await yetkiIste("talep", true);
  if (!o.santiye) redirect("/");
  const { data } = await o.supabase.rpc("santiye_taseronlari", { p_santiye: o.santiye.id });
  return (
    <Sayfa baslik="Talep Aç" geriAd="Vazgeç" sag={<span className="font-bold text-soluk">{o.santiye.ad}</span>}>
      <TalepFormu taseronlar={(data ?? []) as TaseronSecenek[]} />
    </Sayfa>
  );
}
