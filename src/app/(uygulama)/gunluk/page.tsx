import Link from "next/link";
import { Filter } from "lucide-react";
import { yetkiIste } from "@/lib/oturum";
import { imzala } from "@/lib/dosya";
import { Bos, Sayfa, YeniEkle } from "@/components/kabuk";
import { GunlukKarti, type Gunluk } from "@/components/kartlar";
import { tarihMi, uuidMi } from "@/lib/denetim";
import { gunlukDegisebilir } from "@/lib/gunluk";
import { GunlukIslemleri } from "./islemler";
import { after } from "next/server";
import { havaTamamla } from "@/lib/hava";
import { HavaEtiketi, type Hava } from "@/components/hava";
import { kisaTarih } from "@/lib/sabitler";

/** Geriye dönük görüntüleme: tarih aralığı + taşeron (+ üstteki şantiye) süzgeci. */
export default async function Gunlukler({ searchParams }: PageProps<"/gunluk">) {
  const o = await yetkiIste("gunluk");
  const sp = await searchParams;
  const bildirim =
    sp.kayit === "yeni" ? { sinif: "bg-yesil text-white", yazi: "✓ Günlük kaydedildi" }
    : sp.kayit ? { sinif: "bg-yesil text-white", yazi: "✓ Günlük düzeltildi" }
    : sp.silindi ? { sinif: "bg-yesil text-white", yazi: "✓ Günlük silindi" }
    : sp.yetki ? { sinif: "bg-kirmizi text-white", yazi: "Bu günlüğü değiştirme yetkiniz yok. Kaydı giren 24 saat içinde, merkez her zaman değiştirebilir." }
    : null;
  const bas = tarihMi(sp.bas) ? sp.bas : undefined;
  const bit = tarihMi(sp.bit) ? sp.bit : undefined;
  const taseron = uuidMi(sp.taseron) ? sp.taseron : undefined;

  if (!o.santiye) return <Sayfa baslik="Günlükler"><Bos>Şantiye seçili değil.</Bos></Sayfa>;

  let sorgu = o.supabase
    .from("gunlukler")
    .select("id, is_tarihi, kisi_sayisi, katlar, is_kalemleri, notu, fotograflar, olusturma, olusturan, guncelleme, taseronlar(firma_adi), profiller!gunlukler_olusturan_fkey(ad_soyad)")
    .eq("santiye_id", o.santiye.id)
    .order("is_tarihi", { ascending: false })
    .order("olusturma", { ascending: false })
    .limit(200);
  if (bas) sorgu = sorgu.gte("is_tarihi", bas);
  if (bit) sorgu = sorgu.lte("is_tarihi", bit);
  if (taseron) sorgu = sorgu.eq("taseron_id", taseron);

  const [{ data }, { data: taseronlar }] = await Promise.all([
    sorgu,
    o.supabase.rpc("santiye_taseronlari", { p_santiye: o.santiye.id }),
  ]);
  const liste = (data ?? []) as unknown as Gunluk[];
  const tarihler = [...new Set(liste.map((g) => g.is_tarihi))];
  const [adresler, { data: havaSatirlari }] = await Promise.all([
    imzala(liste.flatMap((g) => g.fotograflar)),
    o.supabase.from("hava_durumu").select("tarih, kod, en_yuksek, en_dusuk, yagis, ruzgar, kesin").eq("santiye_id", o.santiye.id).in("tarih", tarihler.length ? tarihler : ["1970-01-01"]),
  ]);
  const hava = new Map((havaSatirlari ?? []).map((h) => [h.tarih as string, h as Hava & { kesin: boolean }]));
  // Eksik ya da kesinleşmemiş günlerin havası yanıttan sonra tamamlanır; bir sonraki açılışta görünür.
  const tamamlanacak = tarihler.filter((t) => !hava.get(t)?.kesin);
  if (tamamlanacak.length) {
    const santiye = o.santiye;
    after(() => havaTamamla(santiye, o.firma.id, tamamlanacak));
  }

  // Güne göre grupla; her günün toplam kişi sayısı başlıkta.
  const gunler = new Map<string, Gunluk[]>();
  for (const g of liste) gunler.set(g.is_tarihi, [...(gunler.get(g.is_tarihi) ?? []), g]);

  return (
    <Sayfa baslik={`Günlükler · ${o.santiye.ad}`} genis>
      {bildirim && <p className={`rounded-xl px-4 py-3 font-bold ${bildirim.sinif}`}>{bildirim.yazi}</p>}
      {o.yetki("gunluk", true) && <YeniEkle href="/gunluk/yeni" />}

      <details className="rounded-2xl border-2 border-cizgi" open={Boolean(bas || bit || taseron)}>
        <summary className="flex min-h-14 cursor-pointer items-center gap-2 px-4 text-lg font-bold">
          <Filter className="size-6" /> Süz {bas || bit || taseron ? "(etkin)" : ""}
        </summary>
        <form className="flex flex-col gap-3 p-4 pt-0 lg:grid lg:grid-cols-[1fr_1fr_2fr_auto] lg:items-end">
          <div className="grid grid-cols-2 gap-3 lg:col-span-2">
            <label className="flex flex-col gap-1 font-semibold">
              Başlangıç
              <input type="date" name="bas" defaultValue={bas} className="min-h-14 rounded-xl border-2 border-cizgi px-3" />
            </label>
            <label className="flex flex-col gap-1 font-semibold">
              Bitiş
              <input type="date" name="bit" defaultValue={bit} className="min-h-14 rounded-xl border-2 border-cizgi px-3" />
            </label>
          </div>
          <label className="flex flex-col gap-1 font-semibold">
            Taşeron
            <select name="taseron" defaultValue={taseron ?? ""} className="min-h-14 rounded-xl border-2 border-cizgi px-3">
              <option value="">Tümü</option>
              {((taseronlar ?? []) as { id: string; firma_adi: string }[]).map((t) => (
                <option key={t.id} value={t.id}>{t.firma_adi}</option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Link href="/gunluk" className="flex min-h-14 items-center justify-center rounded-xl border-2 border-cizgi font-bold">Temizle</Link>
            <button className="min-h-14 rounded-xl bg-koyu font-bold text-white">Uygula</button>
          </div>
        </form>
      </details>

      {liste.length === 0 && <Bos>Kayıt yok.</Bos>}
      {/* Telefonda da bilgisayarda da aynı düzen: güne göre alt alta kartlar. */}
      <div className="flex flex-col gap-5">
        {[...gunler.entries()].map(([gun, kayitlar]) => (
          <section key={gun} className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm font-bold text-soluk">
              <span>
                {kisaTarih(gun)} · {kayitlar.reduce((a, b) => a + b.kisi_sayisi, 0)} kişi · {kayitlar.length} kayıt
              </span>
              {hava.get(gun) && <HavaEtiketi h={hava.get(gun)!} sinif="text-yazi" />}
            </div>
            {kayitlar.map((g) => (
              <GunlukKarti
                key={g.id}
                g={g}
                adresler={adresler}
                islemler={gunlukDegisebilir(o, { olusturan: g.olusturan!, olusturma: g.olusturma }) ? <GunlukIslemleri id={g.id} /> : undefined}
              />
            ))}
          </section>
        ))}
      </div>
    </Sayfa>
  );
}
