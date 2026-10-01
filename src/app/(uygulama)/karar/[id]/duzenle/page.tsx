import { notFound, redirect } from "next/navigation";
import { oturum } from "@/lib/oturum";
import { imzala } from "@/lib/dosya";
import { KARAR_ALANLARI, duzeltebilir, silebilir, type Karar } from "@/lib/karar";
import { kararSecenekleri } from "@/lib/karar-sunucu";
import { Sayfa } from "@/components/kabuk";
import { SilDugmesi } from "@/components/sil-dugmesi";
import { KararFormu } from "../../yeni/form";
import { kararSil } from "../../eylemler";

/** Kimse okumadan önce kaydı giren düzeltir; okunmuş karar "Kararı değiştir" ile yenilenir. */
export default async function KararDuzenle({ params }: PageProps<"/karar/[id]/duzenle">) {
  const o = await oturum();
  const { id } = await params;
  const { data } = await o.supabase.from("kararlar").select(KARAR_ALANLARI + ", santiye_id").eq("id", id).maybeSingle();
  const k = data as unknown as (Karar & { santiye_id: string }) | null;
  if (!k) notFound();
  if (!duzeltebilir(o, k)) redirect("/karar?yetki=yok");
  if (!o.santiye || k.santiye_id !== o.santiye.id) redirect("/karar");

  const [secenek, adresler] = await Promise.all([kararSecenekleri(o), imzala(k.fotograflar)]);
  return (
    <Sayfa baslik="Kararı Düzelt" geri="/karar" geriAd="Vazgeç" sag={<span className="font-bold text-soluk">{o.santiye.ad}</span>}>
      <KararFormu
        firmaId={o.firma.id}
        {...secenek}
        deger={{
          id: k.id,
          yer: k.yer,
          daire: k.daire,
          mahal: k.mahal,
          konu: k.konu,
          karar: k.karar,
          dis_katilimcilar: k.dis_katilimcilar,
          muhataplar: k.karar_muhataplari.map((m) => (m.taseron_id ? "t:" + m.taseron_id : "k:" + m.kullanici_id)),
        }}
        mevcutFotolar={k.fotograflar.filter((y) => adresler[y]).map((y) => ({ yol: y, adres: adresler[y] }))}
      />
      {silebilir(o, k) && (
        <div className="mt-4 border-t-2 border-cizgi pt-6">
          <SilDugmesi id={k.id} eylem={kararSil} soru="Bu karar ve fotoğrafları silinsin mi? Geri alınamaz." />
        </div>
      )}
    </Sayfa>
  );
}
