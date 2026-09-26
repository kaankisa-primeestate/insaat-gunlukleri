import { notFound, redirect } from "next/navigation";
import { oturum } from "@/lib/oturum";
import { gunlukDegisebilir } from "@/lib/gunluk";
import { imzala } from "@/lib/dosya";
import { katListesi } from "@/lib/sabitler";
import { Sayfa } from "@/components/kabuk";
import type { TaseronSecenek } from "@/components/secimler";
import { GunlukFormu, type GunlukDeger } from "../../yeni/form";
import { GunlukSilDugmesi } from "../../sil";

/** Girilmiş günlüğün düzeltilmesi: eksik iş, yanlış kişi sayısı, kat… */
export default async function GunlukDuzenle({ params }: PageProps<"/gunluk/[id]/duzenle">) {
  const o = await oturum();
  const { id } = await params;
  const { data: g } = await o.supabase
    .from("gunlukler")
    .select("id, santiye_id, taseron_id, is_tarihi, kisi_sayisi, katlar, is_kalemleri, notu, fotograflar, olusturan, olusturma")
    .eq("id", id)
    .maybeSingle();
  if (!g) notFound();
  if (!gunlukDegisebilir(o, g)) redirect("/gunluk?yetki=yok");
  if (!o.santiye || g.santiye_id !== o.santiye.id) redirect("/gunluk");

  const [{ data: taseronlar }, adresler] = await Promise.all([
    o.supabase.rpc("santiye_taseronlari", { p_santiye: o.santiye.id }),
    imzala(g.fotograflar),
  ]);
  const liste = (taseronlar ?? []) as TaseronSecenek[];
  // Kaydın taşeronu artık listede değilse (sözleşmesi kalkmış) yine de görünsün.
  if (!liste.some((t) => t.id === g.taseron_id)) {
    const { data: t } = await o.supabase.from("taseronlar").select("id, firma_adi, is_turleri").eq("id", g.taseron_id).maybeSingle();
    if (t) liste.push({ ...t, gecikme: null });
  }

  return (
    <Sayfa baslik="Günlüğü Düzelt" geri="/gunluk" geriAd="Günlükler" sag={<span className="font-bold text-soluk">{o.santiye.ad}</span>}>
      <GunlukFormu
        firmaId={o.firma.id}
        taseronlar={liste}
        katlar={katListesi(o.santiye.bodrum_kat, o.santiye.kat_sayisi)}
        deger={g as GunlukDeger}
        mevcutFotolar={g.fotograflar.filter((y: string) => adresler[y]).map((y: string) => ({ yol: y, adres: adresler[y] }))}
      />
      <div className="mt-4 border-t-2 border-cizgi pt-6">
        <GunlukSilDugmesi id={g.id} buyuk />
      </div>
    </Sayfa>
  );
}
