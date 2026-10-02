import Link from "next/link";
import { Warehouse } from "lucide-react";
import { depoIste } from "@/lib/depo-sunucu";
import { imzala } from "@/lib/dosya";
import { KALEM_ALANLARI, type DepoKalemi } from "@/lib/depo";
import { Sayfa, YeniEkle } from "@/components/kabuk";
import { DepoListesi } from "./liste";

/**
 * Depo: firmaya ait malzeme ve demirbaşlar. Şantiyeden bağımsızdır, yalnız
 * şirket tarafı görür. Her kayıt bir dosya; arama yazdıkça süzer.
 */
export default async function Depo() {
  const o = await depoIste();
  const { data } = await o.supabase.from("depo_kalemleri").select(KALEM_ALANLARI).order("ad").limit(2000);
  const kalemler = (data ?? []) as unknown as DepoKalemi[];
  const adresler = await imzala(kalemler.map((k) => k.fotograflar[0]).filter(Boolean));

  return (
    <Sayfa baslik="Depo" genis sag={
      <Link href="/depo/depolar" className="flex min-h-11 items-center gap-1.5 rounded-xl border-2 border-cizgi px-3 font-bold">
        <Warehouse className="size-5" /> Depolar
      </Link>
    }>
      {o.yetki("depo", true) && <YeniEkle href="/depo/yeni" />}
      <DepoListesi kalemler={kalemler} adresler={adresler} />
    </Sayfa>
  );
}
