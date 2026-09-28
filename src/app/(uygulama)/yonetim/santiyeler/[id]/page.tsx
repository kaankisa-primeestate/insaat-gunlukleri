import { notFound } from "next/navigation";
import { merkezIste } from "@/lib/oturum";
import { santiyeAlanlari } from "@/lib/yerler-sunucu";
import type { SantiyeAlani } from "@/lib/yerler";
import { Sayfa } from "@/components/kabuk";
import { SantiyeTarifi } from "../tarif";

/** Şantiyenin tarifini düzenleme. Tarifi olmayan eski şantiye tek bina olarak açılır. */
export default async function SantiyeDuzenle({ params }: PageProps<"/yonetim/santiyeler/[id]">) {
  const o = await merkezIste();
  const { id } = await params;
  const { data: s } = await o.supabase.from("santiyeler").select("id, ad, adres, bodrum_kat, kat_sayisi").eq("id", id).maybeSingle();
  if (!s) notFound();
  let alanlar = await santiyeAlanlari(o, s.id);
  if (!alanlar.length) {
    // Eski kat listesiyle birebir: tek bina + "Çevre"; mevcut kayıtlar aynı adları taşır.
    alanlar = [
      { tur: "blok", ad: "Bina", bodrum: s.bodrum_kat, zemin: true, kat: s.kat_sayisi, cati: true },
      { tur: "cevre", ad: "Çevre", bodrum: 0, zemin: false, kat: 0, cati: false },
    ] satisfies SantiyeAlani[];
  }
  return (
    <Sayfa baslik="Şantiyeyi Tarif Et" geri="/yonetim/santiyeler" geriAd="Şantiyeler">
      <SantiyeTarifi santiye={{ id: s.id, ad: s.ad, adres: s.adres, alanlar }} />
    </Sayfa>
  );
}
