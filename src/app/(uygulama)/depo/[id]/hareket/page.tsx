import { notFound, redirect } from "next/navigation";
import { depoIste, kisiSecenekleri, yerSecenekleri } from "@/lib/depo-sunucu";
import { HAREKETLER, HAREKET_ALANLARI, KALEM_ALANLARI, kimdeNeVar, type DepoHareketi, type DepoKalemi, type HareketKodu } from "@/lib/depo";
import { Sayfa } from "@/components/kabuk";
import { HareketFormu } from "./form";

export default async function DepoHareketi({ params, searchParams }: PageProps<"/depo/[id]/hareket">) {
  const o = await depoIste(true);
  const { id } = await params;
  const t = String((await searchParams).tur ?? "");
  if (!(t in HAREKETLER)) redirect(`/depo/${id}`);
  const tur = t as HareketKodu;
  const { data } = await o.supabase.from("depo_kalemleri").select(KALEM_ALANLARI).eq("id", id).maybeSingle();
  const k = data as unknown as DepoKalemi | null;
  if (!k) notFound();
  if (k.kapandi !== (tur === "ac")) redirect(`/depo/${id}`);

  const [{ data: h }, kisiler, yer] = await Promise.all([
    o.supabase.from("depo_hareketleri").select(HAREKET_ALANLARI).eq("kalem_id", id).in("tur", ["ver", "geri"]),
    kisiSecenekleri(o),
    yerSecenekleri(o),
  ]);

  return (
    <Sayfa baslik={`${HAREKETLER[tur].baslik} · ${k.ad}`} geri={`/depo/${id}`} geriAd="Vazgeç">
      <HareketFormu
        kalem={{ id: k.id, ad: k.ad, birim: k.birim, depoda: Number(k.depoda), disarida: Number(k.disarida) }}
        tur={tur}
        baslik={HAREKETLER[tur].baslik}
        santiyeler={o.santiyeler.map((s) => ({ id: s.id, ad: s.ad }))}
        seciliSantiye={o.santiye?.id}
        kisiler={kisiler}
        kimde={kimdeNeVar((h ?? []) as unknown as DepoHareketi[])}
        {...yer}
      />
    </Sayfa>
  );
}
