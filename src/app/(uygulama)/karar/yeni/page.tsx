import { redirect } from "next/navigation";
import { yetkiIste } from "@/lib/oturum";
import { uuidMi } from "@/lib/denetim";
import { KARAR_ALANLARI, degistirebilir, type Karar } from "@/lib/karar";
import { kararSecenekleri } from "@/lib/karar-sunucu";
import { Sayfa } from "@/components/kabuk";
import { KararFormu } from "./form";

/** Yeni karar; ?onceki=<id> ile kararın revizyonu (önceki hâli zincirde kalır). */
export default async function YeniKarar({ searchParams }: PageProps<"/karar/yeni">) {
  const o = await yetkiIste("karar", true);
  if (!o.santiye) redirect("/");
  const { onceki } = await searchParams;

  let eski: Karar | null = null;
  if (uuidMi(onceki)) {
    const { data } = await o.supabase.from("kararlar").select(KARAR_ALANLARI).eq("id", onceki).maybeSingle();
    eski = data as unknown as Karar | null;
    if (!eski || !degistirebilir(o, eski)) redirect("/karar?yetki=yok");
  }
  // Kaçıncı revizyon: önceki hâllere geri yürünür.
  let rev = 0;
  for (let id = eski?.id ?? null; id && rev < 100; rev++) {
    const { data } = await o.supabase.from("kararlar").select("onceki_id").eq("id", id).maybeSingle();
    id = data?.onceki_id ?? null;
  }
  const secenek = await kararSecenekleri(o);

  return (
    <Sayfa
      baslik={eski ? `Rev. ${rev} Yap` : "Yeni Karar"}
      geri="/karar"
      geriAd="Vazgeç"
      sag={<span className="font-bold text-soluk">{o.santiye.ad}</span>}
    >
      {eski && (
        <p className="rounded-xl bg-sari px-4 py-3 font-semibold text-black">
          Önceki hâli silinmez, zaman çizelgesinde kalır. Muhataplar yeni hâli yeniden onaylar.
        </p>
      )}
      <KararFormu
        firmaId={o.firma.id}
        {...secenek}
        onceki={eski?.id}
        deger={
          eski
            ? {
                yer: eski.yer,
                daire: eski.daire,
                mahal: eski.mahal,
                konu: eski.konu,
                karar: eski.karar,
                dis_katilimcilar: eski.dis_katilimcilar,
                muhataplar: eski.karar_muhataplari.map((m) => (m.taseron_id ? "t:" + m.taseron_id : "k:" + m.kullanici_id)),
              }
            : undefined
        }
      />
    </Sayfa>
  );
}
