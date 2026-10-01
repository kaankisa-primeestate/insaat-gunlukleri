import { notFound, redirect } from "next/navigation";
import { yetkiIste } from "@/lib/oturum";
import { Sayfa } from "@/components/kabuk";
import { RevizyonFormu } from "./form";

/** Hatalı işe yeni gelişme: işin sorumluları (durumu değiştirebilenler) ekler. */
export default async function YeniRevizyon({ params }: PageProps<"/hatali/[id]/revizyon">) {
  const o = await yetkiIste("hatali");
  const { id } = await params;
  const { data: h } = await o.supabase.from("hatali_isler").select("id, aciklama").eq("id", id).maybeSingle();
  if (!h) notFound();
  if (!o.yetki("hatali", true)) redirect(`/hatali/${id}`);
  const { count } = await o.supabase.from("hatali_notlar").select("id", { count: "exact", head: true }).eq("hatali_id", id);

  return (
    <Sayfa baslik={`Rev. ${(count ?? 0) + 1} Ekle`} geri={`/hatali/${id}`} geriAd="Vazgeç">
      <p className="rounded-2xl bg-yuzey px-4 py-3 font-bold break-words">{h.aciklama}</p>
      <RevizyonFormu hataliId={id} firmaId={o.firma.id} />
    </Sayfa>
  );
}
