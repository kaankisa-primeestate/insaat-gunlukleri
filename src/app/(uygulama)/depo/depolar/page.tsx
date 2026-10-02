import { depoIste } from "@/lib/depo-sunucu";
import { Bos, Etiket, Sayfa } from "@/components/kabuk";
import { DepoDurumDugmesi, DepoEkleFormu } from "./form";

/** Depo tanımları: şirket tarafındaki herkes ekler; silinmez, pasife alınır. */
export default async function Depolar() {
  const o = await depoIste();
  const [{ data: depolar }, { data: kalemler }] = await Promise.all([
    o.supabase.from("depolar").select("id, ad, aktif").order("aktif", { ascending: false }).order("ad"),
    o.supabase.from("depo_kalemleri").select("depo_id").eq("kapandi", false).not("depo_id", "is", null),
  ]);
  const sayi = new Map<string, number>();
  for (const k of kalemler ?? []) sayi.set(k.depo_id as string, (sayi.get(k.depo_id as string) ?? 0) + 1);
  const yazabilir = o.yetki("depo", true);

  return (
    <Sayfa baslik="Depolar" geri="/depo" geriAd="Depo">
      <p className="text-soluk">
        Kayıt girerken depo listeden seçilir. Listede olmayan yer (&quot;Celayir şantiyesi konteyner&quot;) kayıtta elle de yazılabilir.
      </p>
      {yazabilir && <DepoEkleFormu />}
      {!depolar?.length && <Bos>Henüz depo tanımlanmadı.</Bos>}
      <div className="flex flex-col gap-2">
        {(depolar ?? []).map((d) => (
          <div key={d.id} className={`flex items-center gap-3 rounded-2xl border-2 border-cizgi p-3 ${d.aktif ? "" : "bg-yuzey"}`}>
            <div className="min-w-0 flex-1">
              <p className="text-lg font-bold break-words">{d.ad}</p>
              <p className="text-sm text-soluk">{sayi.get(d.id) ?? 0} kayıt</p>
            </div>
            {!d.aktif && <Etiket sinif="bg-gri text-white">Pasif</Etiket>}
            {yazabilir && <DepoDurumDugmesi id={d.id} aktif={d.aktif} />}
          </div>
        ))}
      </div>
    </Sayfa>
  );
}
