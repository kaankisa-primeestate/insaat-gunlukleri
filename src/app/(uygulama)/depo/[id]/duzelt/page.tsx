import { notFound } from "next/navigation";
import { depoIste } from "@/lib/depo-sunucu";
import { imzala } from "@/lib/dosya";
import { KALEM_ALANLARI, type DepoKalemi } from "@/lib/depo";
import { Sayfa } from "@/components/kabuk";
import { KalemFormu } from "../../yeni/form";

/** Ad, özellik, birim, fotoğraf, not düzeltmesi; eski hâli revizyonlarda kalır. */
export default async function DepoDuzelt({ params }: PageProps<"/depo/[id]/duzelt">) {
  const o = await depoIste(true);
  const { id } = await params;
  const { data } = await o.supabase.from("depo_kalemleri").select(KALEM_ALANLARI).eq("id", id).maybeSingle();
  const k = data as unknown as DepoKalemi | null;
  if (!k) notFound();
  const adresler = await imzala(k.fotograflar);
  return (
    <Sayfa baslik="Kaydı Düzelt" geri={`/depo/${id}`} geriAd="Vazgeç">
      <p className="rounded-2xl bg-yuzey px-4 py-3 text-soluk">
        Düzeltme iz bırakır: eski ve yeni hâli dosyanın revizyonlarında görünür. Miktar ve yer burada değil, dosyadaki
        &quot;Miktarı düzelt&quot; ve &quot;Yer değiştir&quot; ile değişir.
      </p>
      <KalemFormu
        firmaId={o.firma.id}
        deger={{ id: k.id, ad: k.ad, ozellik: k.ozellik, birim: k.birim, notu: k.notu }}
        mevcutFotolar={k.fotograflar.filter((y) => adresler[y]).map((y) => ({ yol: y, adres: adresler[y] }))}
      />
    </Sayfa>
  );
}
