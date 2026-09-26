import { redirect } from "next/navigation";
import { yetkiIste } from "@/lib/oturum";
import { katListesi } from "@/lib/sabitler";
import { Sayfa } from "@/components/kabuk";
import type { TaseronSecenek } from "@/components/secimler";
import { HataFormu } from "./form";

export default async function YeniHata() {
  const o = await yetkiIste("hatali", true);
  if (o.taseron) redirect("/?yetki=yok");
  if (!o.santiye) redirect("/");
  const { data } = await o.supabase.rpc("santiye_taseronlari", { p_santiye: o.santiye.id });
  return (
    <Sayfa baslik="Hatalı İş Bildir" geriAd="Vazgeç" sag={<span className="font-bold text-soluk">{o.santiye.ad}</span>}>
      <HataFormu
        firmaId={o.firma.id}
        taseronlar={(data ?? []) as TaseronSecenek[]}
        katlar={katListesi(o.santiye.bodrum_kat, o.santiye.kat_sayisi)}
      />
    </Sayfa>
  );
}
