import { notFound, redirect } from "next/navigation";
import { oturum } from "@/lib/oturum";
import { kayitDegisebilir } from "@/lib/gunluk";
import { imzala } from "@/lib/dosya";
import { Sayfa } from "@/components/kabuk";
import { SilDugmesi } from "@/components/sil-dugmesi";
import type { TaseronSecenek } from "@/components/secimler";
import { oncekiTalepler } from "@/lib/talep-sunucu";
import { TalepFormu, type TalepDeger } from "../../yeni/form";
import { talepSil } from "../../eylemler";

/** Yanlış açılmış talebin düzeltilmesi ya da silinmesi. */
export default async function TalepDuzenle({ params }: PageProps<"/talep/[id]/duzenle">) {
  const o = await oturum();
  const { id } = await params;
  const { data: t } = await o.supabase
    .from("talepler")
    .select("id, santiye_id, taseron_id, taseron_adi, urun, miktar, birim, notu, termin, durum, fotograflar, olusturan, olusturma")
    .eq("id", id)
    .maybeSingle();
  if (!t) notFound();
  if (!kayitDegisebilir(o, t, t.durum === "acildi", "talep")) redirect(`/talep/${id}?yetki=yok`);
  if (!o.santiye || t.santiye_id !== o.santiye.id) redirect("/talep");

  const [{ data: taseronlar }, adresler, onceki] = await Promise.all([
    o.supabase.rpc("santiye_taseronlari", { p_santiye: o.santiye.id }),
    imzala(t.fotograflar as string[]),
    oncekiTalepler(o),
  ]);
  const liste = (taseronlar ?? []) as TaseronSecenek[];
  if (t.taseron_id && !liste.some((x) => x.id === t.taseron_id)) {
    const { data: x } = await o.supabase.from("taseronlar").select("id, firma_adi, is_turleri").eq("id", t.taseron_id).maybeSingle();
    if (x) liste.push({ ...x, gecikme: null });
  }

  return (
    <Sayfa baslik="Talebi Düzelt" geri={`/talep/${id}`} geriAd="Vazgeç" sag={<span className="font-bold text-soluk">{o.santiye.ad}</span>}>
      <TalepFormu
        taseronlar={liste}
        firmaId={o.firma.id}
        taseronHesabi={o.taseron}
        {...onceki}
        deger={{ ...t, miktar: Number(t.miktar) } as TalepDeger}
        mevcutFotolar={(t.fotograflar as string[]).filter((y) => adresler[y]).map((y) => ({ yol: y, adres: adresler[y] }))}
      />
      <div className="mt-4 border-t-2 border-cizgi pt-6">
        <SilDugmesi id={t.id} eylem={talepSil} soru="Bu talep, fotoğrafları ve geçmişiyle birlikte silinsin mi? Planlı teslimatı varsa teslimat kalır, talep bağlantısı kalkar. Geri alınamaz." />
      </div>
    </Sayfa>
  );
}
