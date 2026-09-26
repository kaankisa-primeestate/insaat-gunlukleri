import { redirect } from "next/navigation";
import { oturum } from "@/lib/oturum";
import { Sayfa } from "@/components/kabuk";
import { TaseronFormu } from "../taseron-formu";

export default async function YeniTaseron() {
  const o = await oturum();
  let altTaseronModu = false;
  if (o.taseron) {
    const { data } = await o.supabase.from("taseronlar").select("alt_taseron_yetkisi").eq("id", o.profil.taseron_id!).single();
    if (!data?.alt_taseron_yetkisi) redirect("/?yetki=yok");
    altTaseronModu = true;
  } else if (!o.yetki("taseronlar", true)) {
    redirect("/?yetki=yok");
  }
  const { data: anaTaseronlar } = await o.supabase
    .from("taseronlar")
    .select("id, firma_adi")
    .is("ust_taseron_id", null)
    .eq("aktif", true)
    .order("firma_adi");

  return (
    <Sayfa baslik={altTaseronModu ? "Yeni Alt Taşeron" : "Yeni Taşeron"} geri="/taseronlar" geriAd="Taşeronlar">
      <TaseronFormu anaTaseronlar={anaTaseronlar ?? []} altTaseronModu={altTaseronModu} />
    </Sayfa>
  );
}
