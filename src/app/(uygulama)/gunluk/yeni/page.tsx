import { redirect } from "next/navigation";
import { yetkiIste } from "@/lib/oturum";
import { Sayfa } from "@/components/kabuk";
import { yerler } from "@/lib/yerler-sunucu";
import { uuidMi } from "@/lib/denetim";
import { bugun } from "@/lib/sabitler";
import type { TaseronSecenek } from "@/components/secimler";
import { GunlukFormu, type GunlukDeger } from "./form";

/** `?kaynak=` ile gelinirse ("Dünden devam" önerisinde Değiştir): o günlüğün bilgileriyle, bugünün tarihiyle yeni bir kayıt doldurulur. */
export default async function YeniGunluk({ searchParams }: PageProps<"/gunluk/yeni">) {
  const o = await yetkiIste("gunluk", true);
  if (!o.santiye) redirect("/");
  const { kaynak } = await searchParams;

  const [{ data }, yerListesi, kaynakVeri] = await Promise.all([
    o.supabase.rpc("santiye_taseronlari", { p_santiye: o.santiye.id }),
    yerler(o),
    typeof kaynak === "string" && uuidMi(kaynak)
      ? o.supabase
          .from("gunlukler")
          .select("id, taseron_id, kisi_sayisi, katlar, is_kalemleri, notu")
          .eq("id", kaynak)
          .eq("santiye_id", o.santiye.id)
          .eq("gelmedi", false)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const doldur: GunlukDeger | undefined = kaynakVeri.data
    ? { ...(kaynakVeri.data as Omit<GunlukDeger, "is_tarihi">), is_tarihi: bugun() }
    : undefined;

  return (
    <Sayfa baslik="Yeni Günlük" geri="/gunluk" geriAd="Vazgeç" sag={<span className="font-bold text-soluk">{o.santiye.ad}</span>}>
      {doldur && <p className="rounded-xl bg-yuzey px-4 py-3 font-semibold text-soluk">Dünkü bilgilerle dolduruldu; değiştirip kaydedebilirsiniz.</p>}
      <GunlukFormu
        firmaId={o.firma.id}
        taseronlar={(data ?? []) as TaseronSecenek[]}
        katlar={yerListesi}
        deger={doldur}
        kaynakDoldur={Boolean(doldur)}
      />
    </Sayfa>
  );
}
