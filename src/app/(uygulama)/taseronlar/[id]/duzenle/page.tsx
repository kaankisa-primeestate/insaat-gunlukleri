import { notFound, redirect } from "next/navigation";
import { oturum } from "@/lib/oturum";
import { Sayfa } from "@/components/kabuk";
import { TaseronFormu } from "../../taseron-formu";

export default async function TaseronDuzenle({ params }: PageProps<"/taseronlar/[id]/duzenle">) {
  const o = await oturum();
  if (o.taseron || !o.yetki("taseronlar", true)) redirect("/?yetki=yok");
  const { id } = await params;
  const [{ data: t }, { data: anaTaseronlar }] = await Promise.all([
    o.supabase
      .from("taseronlar")
      .select("id, firma_adi, yetkili, telefon, vergi_no, iban, is_turleri, ust_taseron_id, alt_taseron_yetkisi")
      .eq("id", id)
      .maybeSingle(),
    o.supabase.from("taseronlar").select("id, firma_adi").is("ust_taseron_id", null).eq("aktif", true).order("firma_adi"),
  ]);
  if (!t) notFound();
  return (
    <Sayfa baslik="Taşeron Bilgileri" geri={`/taseronlar/${id}`} geriAd={t.firma_adi}>
      <TaseronFormu deger={t} anaTaseronlar={anaTaseronlar ?? []} />
    </Sayfa>
  );
}
