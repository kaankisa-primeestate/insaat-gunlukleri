import Link from "next/link";
import { Filter } from "lucide-react";
import { yetkiIste } from "@/lib/oturum";
import { imzala } from "@/lib/dosya";
import { kisaTarih } from "@/lib/sabitler";
import { KARAR_ALANLARI, onayBekliyor, type Karar } from "@/lib/karar";
import { Bos, Sayfa, YeniEkle } from "@/components/kabuk";
import { KararKarti } from "./kart";

/**
 * Karar Defteri: güne göre alt alta kartlar (Günlükler ile aynı düzen).
 * Varsayılan: yalnız geçerli kararlar; "geçmiş" ile değişmiş sürümler de.
 */
export default async function Kararlar({ searchParams }: PageProps<"/karar">) {
  const o = await yetkiIste("karar");
  const sp = await searchParams;
  if (!o.santiye) return <Sayfa baslik="Karar Defteri"><Bos>Şantiye seçili değil.</Bos></Sayfa>;

  const gecmis = sp.gecmis === "1";
  const bekleyenMi = sp.bekleyen === "1";
  // Aramada virgül ve parantez süzgeç sözdizimini bozar; yalnız harf, rakam ve boşluk kalır.
  const ara = String(sp.ara ?? "").replace(/[^\p{L}\p{N}\s.\-]/gu, " ").trim().slice(0, 60);
  const bildirim =
    sp.kayit === "yeni" ? "✓ Karar kaydedildi"
    : sp.kayit === "degisti" ? "✓ Yeni karar kaydedildi; eskisi \"Değişti\" olarak kaldı"
    : sp.kayit ? "✓ Karar düzeltildi"
    : sp.silindi ? "✓ Karar silindi"
    : null;

  let sorgu = o.supabase
    .from("kararlar")
    .select(KARAR_ALANLARI)
    .eq("santiye_id", o.santiye.id)
    .order("is_tarihi", { ascending: false })
    .order("olusturma", { ascending: false })
    .limit(300);
  if (!gecmis) sorgu = sorgu.eq("degisti", false);
  if (ara) {
    const d = `%${ara}%`;
    sorgu = sorgu.or(`karar.ilike.${d},yer.ilike.${d},daire.ilike.${d},mahal.ilike.${d},konu.ilike.${d}`);
  }
  const { data } = await sorgu;
  let liste = (data ?? []) as unknown as Karar[];
  const bekleyenSayi = liste.filter((k) => onayBekliyor(o, k)).length;
  if (bekleyenMi) liste = liste.filter((k) => onayBekliyor(o, k));
  const adresler = await imzala(liste.flatMap((k) => k.fotograflar));
  // Değişmiş kararın yerine gelen sürüm (listede varsa).
  const yenisi = new Map(liste.filter((k) => k.onceki_id).map((k) => [k.onceki_id!, k]));

  const gunler = new Map<string, Karar[]>();
  for (const k of liste) gunler.set(k.is_tarihi, [...(gunler.get(k.is_tarihi) ?? []), k]);
  const suzgecAcik = Boolean(ara || gecmis);

  return (
    <Sayfa baslik={`Karar Defteri · ${o.santiye.ad}`} genis>
      {bildirim && <p className="rounded-xl bg-yesil px-4 py-3 font-bold text-white">{bildirim}</p>}
      {sp.yetki && (
        <p className="rounded-xl bg-kirmizi px-4 py-3 font-bold text-white">
          Bu kararı değiştirme yetkiniz yok. Kimse okumadan önce kaydı giren düzeltir; okunmuş kararın yerine &quot;Kararı değiştir&quot; ile yenisi yazılır.
        </p>
      )}
      {o.yetki("karar", true) && <YeniEkle href="/karar/yeni" />}

      {bekleyenSayi > 0 && !bekleyenMi && (
        <Link href="/karar?bekleyen=1" className="rounded-2xl bg-yesil px-4 py-3 text-lg font-bold text-white">
          {bekleyenSayi} karar onayınızı bekliyor, göster
        </Link>
      )}
      {bekleyenMi && (
        <Link href="/karar" className="rounded-2xl border-2 border-cizgi px-4 py-3 font-bold">
          ← Bütün kararlar
        </Link>
      )}

      <details className="rounded-2xl border-2 border-cizgi" open={suzgecAcik}>
        <summary className="flex min-h-14 cursor-pointer items-center gap-2 px-4 text-lg font-bold">
          <Filter className="size-6" /> Ara / Süz {suzgecAcik ? "(etkin)" : ""}
        </summary>
        <form className="flex flex-col gap-3 p-4 pt-0 lg:flex-row lg:items-end">
          <label className="flex flex-1 flex-col gap-1 font-semibold">
            Ara
            <input
              name="ara"
              defaultValue={ara}
              placeholder="Örn. mutfak alçıpan, daire 12"
              className="min-h-14 rounded-xl border-2 border-cizgi px-3 text-lg"
            />
          </label>
          <label className="flex min-h-14 items-center gap-3 rounded-xl border-2 border-cizgi px-4 font-semibold">
            <input type="checkbox" name="gecmis" value="1" defaultChecked={gecmis} className="size-6 accent-yesil" />
            Değişmiş eski kararları da göster
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Link href="/karar" className="flex min-h-14 items-center justify-center rounded-xl border-2 border-cizgi px-4 font-bold">Temizle</Link>
            <button className="min-h-14 rounded-xl bg-koyu px-4 font-bold text-white">Uygula</button>
          </div>
        </form>
      </details>

      {liste.length === 0 && <Bos>{ara || bekleyenMi ? "Sonuç yok." : "Henüz karar yok."}</Bos>}
      <div className="flex flex-col gap-5">
        {[...gunler.entries()].map(([gun, kayitlar]) => (
          <section key={gun} className="flex flex-col gap-2">
            <p className="text-sm font-bold text-soluk">
              {kisaTarih(gun)} · {kayitlar.length} karar
            </p>
            {kayitlar.map((k) => (
              <KararKarti key={k.id} k={k} o={o} adresler={adresler} yeniSurum={yenisi.get(k.id)} />
            ))}
          </section>
        ))}
      </div>
    </Sayfa>
  );
}
