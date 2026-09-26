import Link from "next/link";
import { Truck, Trash2 } from "lucide-react";
import { yetkiIste } from "@/lib/oturum";
import { bugun, kisaTarih } from "@/lib/sabitler";
import { tarihMi, uuidMi } from "@/lib/denetim";
import { Bos, Sayfa } from "@/components/kabuk";
import type { TaseronSecenek } from "@/components/secimler";
import { TeslimatFormu } from "./form";
import { GunSecici } from "./gun-secici";
import { teslimatSil } from "./eylemler";

const SAATLER = Array.from({ length: 15 }, (_, i) => i + 6); // 06:00 – 20:00

/**
 * Saha teslimat yoğunluk takvimi: seçilen günün saat saat doluluğu.
 * Herkes hangi saatin dolu olduğunu görür; ayrıntıyı yalnızca kendi
 * kapsamındaki teslimatlar için görür.
 */
export default async function Teslimat({ searchParams }: PageProps<"/teslimat">) {
  const o = await yetkiIste("teslimat");
  const sp = await searchParams;
  const b = bugun();
  const tarih = tarihMi(sp.tarih) ? sp.tarih : b;
  const yeni = sp.yeni === "1";
  const talepId = uuidMi(sp.talep) ? sp.talep : undefined;
  if (!o.santiye) return <Sayfa baslik="Teslimat Takvimi"><Bos>Şantiye seçili değil.</Bos></Sayfa>;

  const [{ data: yogunluk }, { data: kendi }, { data: taseronlar }, talep] = await Promise.all([
    o.supabase.rpc("teslimat_yogunluk", { p_santiye: o.santiye.id, p_tarih: tarih }),
    o.supabase
      .from("teslimatlar")
      .select("id, saat, arac, urun, taseronlar(firma_adi)")
      .eq("santiye_id", o.santiye.id)
      .eq("tarih", tarih)
      .order("saat"),
    o.supabase.rpc("santiye_taseronlari", { p_santiye: o.santiye.id }),
    talepId ? o.supabase.from("talepler").select("id, urun, miktar, birim, taseron_id").eq("id", talepId).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const doluluk = new Map(((yogunluk ?? []) as { saat: number; adet: number }[]).map((y) => [y.saat, Number(y.adet)]));
  const ayrinti = (kendi ?? []) as unknown as { id: string; saat: number; arac: string; urun: string; taseronlar: { firma_adi: string } | null }[];

  return (
    <Sayfa baslik={`Teslimat Takvimi · ${o.santiye.ad}`} genis>
      {sp.kayit && <p className="rounded-xl bg-yesil px-4 py-3 font-bold text-white">✓ Teslimat kaydedildi</p>}

      <GunSecici tarih={tarih} bugun={b} ek={`${yeni ? "&yeni=1" : ""}${talepId ? `&talep=${talepId}` : ""}`} />

      {/* Bilgisayarda giriş formu solda, günün saatleri sağda. */}
      <div className="flex flex-col gap-5 lg:grid lg:grid-cols-2 lg:items-start lg:gap-8">
      <div className="flex flex-col gap-5">
      {o.yetki("teslimat", true) && tarih < b && (
        <p className="rounded-xl bg-yuzey px-4 py-3 text-soluk">Geçmiş güne teslimat girilmez; yalnızca görüntülenir.</p>
      )}
      {o.yetki("teslimat", true) && tarih >= b &&
        (yeni ? (
          <section className="flex flex-col gap-3 rounded-2xl border-2 border-yazi p-4">
            <h2 className="text-xl font-bold">Teslimat gir · {kisaTarih(tarih)}</h2>
            <TeslimatFormu
              tarih={tarih}
              taseronlar={(taseronlar ?? []) as TaseronSecenek[]}
              doluluk={Object.fromEntries(doluluk)}
              saatler={SAATLER}
              talep={talep.data ?? undefined}
            />
          </section>
        ) : (
          <Link
            href={`/teslimat?tarih=${tarih}&yeni=1`}
            className="flex min-h-16 items-center justify-center gap-2 rounded-2xl bg-vurgu text-xl font-bold text-black"
          >
            <Truck className="size-7" /> Teslimat Gir
          </Link>
        ))}

      </div>
      <section className="flex flex-col gap-1">
        <div className="flex gap-3 text-sm font-semibold">
          <span className="flex items-center gap-1"><i className="size-4 rounded bg-yesil" /> Boş</span>
          <span className="flex items-center gap-1"><i className="size-4 rounded bg-sari" /> 1 araç</span>
          <span className="flex items-center gap-1"><i className="size-4 rounded bg-kirmizi" /> 2+ çakışma</span>
        </div>
        {SAATLER.map((s) => {
          const n = doluluk.get(s) ?? 0;
          const burada = ayrinti.filter((x) => x.saat === s);
          return (
            <div key={s} className="flex min-h-14 items-stretch gap-2">
              <span className="flex w-16 shrink-0 items-center text-lg font-bold">{String(s).padStart(2, "0")}:00</span>
              <div
                className={`flex min-w-0 flex-1 flex-col justify-center gap-1 rounded-xl px-3 py-2 ${
                  n === 0 ? "bg-yuzey" : n === 1 ? "bg-sari text-black" : "bg-kirmizi text-white"
                }`}
              >
                {n === 0 && <span className="text-soluk">—</span>}
                {burada.map((x) => (
                  <div key={x.id} className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 font-semibold break-words">
                      {x.arac} · {x.urun}
                      {!o.taseron && x.taseronlar ? ` · ${x.taseronlar.firma_adi}` : ""}
                    </span>
                    {o.yetki("teslimat", true) && (
                      <form action={teslimatSil}>
                        <input type="hidden" name="id" value={x.id} />
                        <input type="hidden" name="tarih" value={tarih} />
                        <button aria-label="Teslimatı sil" className="grid size-10 place-items-center rounded-lg bg-black/15">
                          <Trash2 className="size-5" />
                        </button>
                      </form>
                    )}
                  </div>
                ))}
                {n > burada.length && <span className="font-semibold">{n - burada.length} başka teslimat</span>}
              </div>
            </div>
          );
        })}
      </section>
      </div>
    </Sayfa>
  );
}
