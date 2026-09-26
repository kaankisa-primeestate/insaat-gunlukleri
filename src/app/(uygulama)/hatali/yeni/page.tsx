import { redirect } from "next/navigation";
import { yetkiIste } from "@/lib/oturum";
import { katListesi, type Rol } from "@/lib/sabitler";
import { Sayfa } from "@/components/kabuk";
import type { TaseronSecenek } from "@/components/secimler";
import { HataFormu } from "./form";

export default async function YeniHata() {
  const o = await yetkiIste("hatali", true);
  if (o.taseron) redirect("/?yetki=yok");
  if (!o.santiye) redirect("/");
  const [{ data: taseronlar }, { data: personel }] = await Promise.all([
    o.supabase.rpc("santiye_taseronlari", { p_santiye: o.santiye.id }),
    o.supabase.rpc("santiye_personeli", { p_santiye: o.santiye.id }),
  ]);
  return (
    <Sayfa baslik="Hatalı İş Bildir" geriAd="Vazgeç" sag={<span className="font-bold text-soluk">{o.santiye.ad}</span>}>
      <HataFormu
        firmaId={o.firma.id}
        taseronlar={(taseronlar ?? []) as TaseronSecenek[]}
        personel={(personel ?? []) as { id: string; ad_soyad: string; rol: Rol }[]}
        katlar={katListesi(o.santiye.bodrum_kat, o.santiye.kat_sayisi)}
      />
    </Sayfa>
  );
}
