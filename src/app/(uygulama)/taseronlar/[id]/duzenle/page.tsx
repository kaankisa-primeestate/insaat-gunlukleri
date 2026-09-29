import { notFound, redirect } from "next/navigation";
import { oturum } from "@/lib/oturum";
import { Sayfa } from "@/components/kabuk";
import { TaseronFormu, type Sozlesme } from "../../taseron-formu";

export default async function TaseronDuzenle({ params }: PageProps<"/taseronlar/[id]/duzenle">) {
  const o = await oturum();
  if (o.taseron || !o.yetki("taseronlar", true)) redirect("/?yetki=yok");
  const { id } = await params;
  const [{ data: t }, { data: anaTaseronlar }, { data: sozlesmeler }] = await Promise.all([
    o.supabase
      .from("taseronlar")
      .select("id, firma_adi, yetkililer, vergi_no, iban, is_turleri, ust_taseron_id, alt_taseron_yetkisi")
      .eq("id", id)
      .maybeSingle(),
    o.supabase.from("taseronlar").select("id, firma_adi").is("ust_taseron_id", null).eq("aktif", true).order("firma_adi"),
    o.supabase
      .from("sozlesmeler")
      .select("id, santiye_id, is_tarifi, baslangic, bitis, yer_teslim, sure_gun, sure_belirsiz, belge_yolu, tamamlandi")
      .eq("taseron_id", id),
  ]);
  if (!t) notFound();
  return (
    <Sayfa baslik="Taşeronu Düzenle" geri={`/taseronlar/${id}`} geriAd="Vazgeç">
      <TaseronFormu
        deger={t}
        anaTaseronlar={anaTaseronlar ?? []}
        santiyeler={o.santiyeler.map((s) => ({ id: s.id, ad: s.ad }))}
        sozlesmeler={(sozlesmeler ?? []) as Sozlesme[]}
        firmaId={o.firma.id}
      />
    </Sayfa>
  );
}
