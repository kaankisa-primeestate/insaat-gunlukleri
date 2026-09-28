import { redirect } from "next/navigation";
import { yetkiIste } from "@/lib/oturum";
import { type Rol } from "@/lib/sabitler";
import { Sayfa } from "@/components/kabuk";
import { yerler } from "@/lib/yerler-sunucu";
import type { TaseronSecenek } from "@/components/secimler";
import { HataFormu } from "./form";

export default async function YeniHata() {
  const o = await yetkiIste("hatali", true);
  if (!o.santiye) redirect("/");
  const [{ data: taseronlar }, { data: personel }, yerListesi] = await Promise.all([
    o.supabase.rpc("santiye_taseronlari", { p_santiye: o.santiye.id }),
    o.supabase.rpc("santiye_personeli", { p_santiye: o.santiye.id }),
    yerler(o),
  ]);
  return (
    <Sayfa baslik="Hatalı İş Bildir" geri="/hatali" geriAd="Vazgeç" sag={<span className="font-bold text-soluk">{o.santiye.ad}</span>}>
      <HataFormu
        firmaId={o.firma.id}
        taseronlar={(taseronlar ?? []) as TaseronSecenek[]}
        personel={(personel ?? []) as { id: string; ad_soyad: string; rol: Rol }[]}
        katlar={yerListesi}
      />
    </Sayfa>
  );
}
