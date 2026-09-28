import { notFound, redirect } from "next/navigation";
import { oturum } from "@/lib/oturum";
import { kayitDegisebilir } from "@/lib/gunluk";
import { imzala } from "@/lib/dosya";
import { type Rol } from "@/lib/sabitler";
import { Sayfa } from "@/components/kabuk";
import { yerler } from "@/lib/yerler-sunucu";
import { SilDugmesi } from "@/components/sil-dugmesi";
import type { TaseronSecenek } from "@/components/secimler";
import { HataFormu, type HataDeger } from "../../yeni/form";
import { hataSil } from "../../eylemler";

/** Yanlış girilmiş hatalı işin düzeltilmesi ya da silinmesi. */
export default async function HataDuzenle({ params }: PageProps<"/hatali/[id]/duzenle">) {
  const o = await oturum();
  const { id } = await params;
  const { data: h } = await o.supabase
    .from("hatali_isler")
    .select("id, santiye_id, taseron_id, sorumlu_kullanici_id, is_tarihi, aciklama, kat, onem, durum, fotograflar, olusturan, olusturma")
    .eq("id", id)
    .maybeSingle();
  if (!h) notFound();
  if (!kayitDegisebilir(o, h, h.durum === "tespit", "hatali")) redirect(`/hatali/${id}?yetki=yok`);
  if (!o.santiye || h.santiye_id !== o.santiye.id) redirect("/hatali");

  const [{ data: taseronlar }, { data: personel }, adresler, yerListesi] = await Promise.all([
    o.supabase.rpc("santiye_taseronlari", { p_santiye: o.santiye.id }),
    o.supabase.rpc("santiye_personeli", { p_santiye: o.santiye.id }),
    imzala(h.fotograflar),
    yerler(o),
  ]);
  const liste = (taseronlar ?? []) as TaseronSecenek[];
  // Kaydın taşeronu artık listede değilse (sözleşmesi kalkmış) yine de görünsün.
  if (h.taseron_id && !liste.some((t) => t.id === h.taseron_id)) {
    const { data: t } = await o.supabase.from("taseronlar").select("id, firma_adi, is_turleri").eq("id", h.taseron_id).maybeSingle();
    if (t) liste.push({ ...t, gecikme: null });
  }

  return (
    <Sayfa baslik="Hatalı İşi Düzelt" geri={`/hatali/${id}`} geriAd="Vazgeç" sag={<span className="font-bold text-soluk">{o.santiye.ad}</span>}>
      <HataFormu
        firmaId={o.firma.id}
        taseronlar={liste}
        personel={(personel ?? []) as { id: string; ad_soyad: string; rol: Rol }[]}
        katlar={yerListesi}
        deger={h as HataDeger}
        mevcutFotolar={(h.fotograflar as string[]).filter((y) => adresler[y]).map((y) => ({ yol: y, adres: adresler[y] }))}
      />
      <div className="mt-4 border-t-2 border-cizgi pt-6">
        <SilDugmesi id={h.id} eylem={hataSil} soru="Bu hatalı iş kaydı, fotoğrafları ve geçmişiyle birlikte silinsin mi? Geri alınamaz." />
      </div>
    </Sayfa>
  );
}
