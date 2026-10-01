import Link from "next/link";
import { Filter } from "lucide-react";
import { yetkiIste } from "@/lib/oturum";
import { imzala } from "@/lib/dosya";
import { kisaTarih } from "@/lib/sabitler";
import { KARAR_ALANLARI, onayBekliyor, zincirler, type Karar, type Zincir } from "@/lib/karar";
import { Bos, Sayfa, YeniEkle } from "@/components/kabuk";
import { KararKarti } from "./kart";

/**
 * Karar Defteri: güne göre alt alta kartlar (Günlükler ile aynı düzen). Her
 * kart bir karar ve bütün revizyonları; gün, son revizyonun günüdür.
 */
export default async function Kararlar({ searchParams }: PageProps<"/karar">) {
  const o = await yetkiIste("karar");
  const sp = await searchParams;
  if (!o.santiye) return <Sayfa baslik="Karar Defteri"><Bos>Şantiye seçili değil.</Bos></Sayfa>;

  const bekleyenMi = sp.bekleyen === "1";
  // Aramada virgül ve parantez süzgeç sözdizimini bozar; yalnız harf, rakam ve boşluk kalır.
  const ara = String(sp.ara ?? "").trim().slice(0, 60);
  const bildirim =
    sp.kayit === "yeni" ? "✓ Karar kaydedildi"
    : sp.kayit === "degisti" ? "✓ Revizyon kaydedildi; önceki hâli zaman çizelgesinde duruyor"
    : sp.kayit ? "✓ Karar düzeltildi"
    : sp.silindi ? "✓ Karar silindi"
    : null;

  // Revizyonlar zincir olarak gösterildiği için eski hâller de gelir; arama
  // zincirin herhangi bir hâlinde geçen kelimeyle bütün zinciri bulur.
  const { data } = await o.supabase
    .from("kararlar")
    .select(KARAR_ALANLARI)
    .eq("santiye_id", o.santiye.id)
    .order("olusturma", { ascending: false })
    .limit(500);
  let liste = zincirler((data ?? []) as unknown as Karar[]);
  if (ara) {
    const aranan = ara.toLocaleLowerCase("tr");
    const icinde = (k: Karar) =>
      [k.karar, k.yer, k.daire, k.mahal, k.konu].some((x) => x?.toLocaleLowerCase("tr").includes(aranan));
    liste = liste.filter((z) => z.surumler.some(icinde));
  }
  const bekleyenSayi = liste.filter((z) => onayBekliyor(o, z.son)).length;
  if (bekleyenMi) liste = liste.filter((z) => onayBekliyor(o, z.son));
  const adresler = await imzala(liste.flatMap((z) => z.surumler.flatMap((k) => k.fotograflar)));

  const gunler = new Map<string, Zincir[]>();
  for (const z of liste) gunler.set(z.son.is_tarihi, [...(gunler.get(z.son.is_tarihi) ?? []), z]);
  const suzgecAcik = Boolean(ara);

  return (
    <Sayfa baslik={`Karar Defteri · ${o.santiye.ad}`} genis>
      {bildirim && <p className="rounded-xl bg-yesil px-4 py-3 font-bold text-white">{bildirim}</p>}
      {sp.yetki && (
        <p className="rounded-xl bg-kirmizi px-4 py-3 font-bold text-white">
          Bu kararı değiştirme yetkiniz yok. Kimse okumadan önce kaydı giren düzeltir; okunmuş karar &quot;Rev. Yap&quot; ile değiştirilir.
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
            {kayitlar.map((z) => (
              <KararKarti key={z.son.id} z={z} o={o} adresler={adresler} />
            ))}
          </section>
        ))}
      </div>
    </Sayfa>
  );
}
