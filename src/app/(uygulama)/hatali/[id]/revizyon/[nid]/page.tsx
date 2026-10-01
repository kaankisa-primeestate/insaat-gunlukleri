import { notFound, redirect } from "next/navigation";
import { yetkiIste } from "@/lib/oturum";
import { imzala } from "@/lib/dosya";
import { revizyonDegisebilir } from "@/lib/gunluk";
import { Sayfa } from "@/components/kabuk";
import { RevizyonFormu } from "../form";

/** Yanlış yazılan revizyon notunun düzeltilmesi. Not silinmez. */
export default async function RevizyonDuzelt({ params }: PageProps<"/hatali/[id]/revizyon/[nid]">) {
  const o = await yetkiIste("hatali");
  const { id, nid } = await params;
  const { data: n } = await o.supabase
    .from("hatali_notlar")
    .select("id, sira, metin, fotograflar, olusturan, olusturma")
    .eq("id", nid)
    .eq("hatali_id", id)
    .maybeSingle();
  if (!n) notFound();
  if (!revizyonDegisebilir(o, n)) redirect(`/hatali/${id}?yetki=rev`);
  const adresler = await imzala(n.fotograflar);

  return (
    <Sayfa baslik={`Rev. ${n.sira} Düzelt`} geri={`/hatali/${id}`} geriAd="Vazgeç">
      <RevizyonFormu
        hataliId={id}
        firmaId={o.firma.id}
        notId={n.id}
        metin={n.metin}
        mevcutFotolar={(n.fotograflar as string[]).filter((y) => adresler[y]).map((y) => ({ yol: y, adres: adresler[y] }))}
      />
    </Sayfa>
  );
}
