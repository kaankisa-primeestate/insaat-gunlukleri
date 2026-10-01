import { redirect } from "next/navigation";
import { yetkiIste } from "@/lib/oturum";
import { Sayfa } from "@/components/kabuk";
import type { TaseronSecenek } from "@/components/secimler";
import { oncekiTalepler } from "@/lib/talep-sunucu";
import { TalepFormu } from "./form";

export default async function YeniTalep() {
  const o = await yetkiIste("talep", true);
  if (!o.santiye) redirect("/");
  const [{ data }, onceki] = await Promise.all([
    o.supabase.rpc("santiye_taseronlari", { p_santiye: o.santiye.id }),
    oncekiTalepler(o),
  ]);
  return (
    <Sayfa baslik="Talep Aç" geri="/talep" geriAd="Vazgeç" sag={<span className="font-bold text-soluk">{o.santiye.ad}</span>}>
      <TalepFormu taseronlar={(data ?? []) as TaseronSecenek[]} firmaId={o.firma.id} taseronHesabi={o.taseron} {...onceki} />
    </Sayfa>
  );
}
