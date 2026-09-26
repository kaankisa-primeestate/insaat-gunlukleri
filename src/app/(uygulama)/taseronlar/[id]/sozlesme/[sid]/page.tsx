import { notFound, redirect } from "next/navigation";
import { oturum } from "@/lib/oturum";
import { Sayfa } from "@/components/kabuk";
import { SozlesmeFormu, type SozlesmeDeger } from "../form";
import { SozlesmeSilDugmesi } from "./sil";

/** Yanlış girilmiş sözleşmenin (tarih, şantiye, belge) düzeltilmesi. */
export default async function SozlesmeDuzenle({ params }: PageProps<"/taseronlar/[id]/sozlesme/[sid]">) {
  const o = await oturum();
  if (o.taseron || !o.yetki("taseronlar", true)) redirect("/?yetki=yok");
  const { id, sid } = await params;
  const [{ data: t }, { data: s }] = await Promise.all([
    o.supabase.from("taseronlar").select("id, firma_adi, is_turleri").eq("id", id).maybeSingle(),
    o.supabase
      .from("sozlesmeler")
      .select("id, santiye_id, is_tarifi, baslangic, bitis, yer_teslim, sure_gun, belge_yolu")
      .eq("id", sid)
      .eq("taseron_id", id)
      .maybeSingle(),
  ]);
  if (!t || !s) notFound();

  // Kapalı bir şantiyenin sözleşmesi düzenlenirken şantiye listede kalsın.
  const santiyeler = o.santiyeler.map((x) => ({ id: x.id, ad: x.ad }));
  if (!santiyeler.some((x) => x.id === s.santiye_id)) {
    const { data: kapali } = await o.supabase.from("santiyeler").select("id, ad").eq("id", s.santiye_id).maybeSingle();
    if (kapali) santiyeler.push(kapali);
  }

  return (
    <Sayfa baslik="Sözleşmeyi Düzelt" geri={`/taseronlar/${id}`} geriAd={t.firma_adi}>
      <SozlesmeFormu
        taseronId={t.id}
        isTurleri={t.is_turleri}
        firmaId={o.firma.id}
        santiyeler={santiyeler}
        deger={s as SozlesmeDeger}
      />
      <SozlesmeSilDugmesi id={s.id} taseronId={t.id} />
    </Sayfa>
  );
}
