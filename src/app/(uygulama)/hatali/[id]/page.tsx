import Link from "next/link";
import { notFound } from "next/navigation";
import { yetkiIste } from "@/lib/oturum";
import { imzala } from "@/lib/dosya";
import { HATA_DURUM, ONEM, tarihYaz, type HataDurum, type Onem } from "@/lib/sabitler";
import { Etiket, Sayfa } from "@/components/kabuk";
import { Fotolar } from "@/components/kartlar";
import { DurumDugmeleri } from "./durum";
import { MessageSquarePlus, Pencil } from "lucide-react";
import { kayitDegisebilir, revizyonDegisebilir } from "@/lib/gunluk";

const zaman = (t: string) =>
  new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Istanbul" }).format(new Date(t));

type Not = {
  id: string;
  sira: number;
  metin: string;
  fotograflar: string[];
  olusturan: string;
  olusturma: string;
  duzenleme: string | null;
  duzenleyen: string | null;
};
type Olay =
  | { tur: "durum"; zaman: string; durum: HataDurum; kisi: string | null }
  | { tur: "not"; zaman: string; not: Not };

/** Çizelgenin dikey çizgisi ve noktası; son olayda çizgi biter. */
function Cizgi({ son, nokta }: { son: boolean; nokta: string }) {
  return (
    <div className="relative flex w-4 shrink-0 justify-center">
      {!son && <span className="absolute top-2 -bottom-4 w-1 rounded bg-cizgi" />}
      <span className={`relative rounded-full ring-4 ring-zemin ${nokta}`} />
    </div>
  );
}

export default async function HataDetay({ params, searchParams }: PageProps<"/hatali/[id]">) {
  const o = await yetkiIste("hatali");
  const { id } = await params;
  const { kayit, yetki, rev } = await searchParams;
  const { data: h } = await o.supabase
    .from("hatali_isler")
    .select("id, is_tarihi, aciklama, kat, onem, durum, fotograflar, olusturan, olusturma, duzenleme, taseron_id, taseronlar(firma_adi), santiyeler(ad), bildiren:profiller!hatali_isler_olusturan_fkey(ad_soyad), sorumlu:profiller!hatali_isler_sorumlu_kullanici_id_fkey(ad_soyad), duzenleyen_kisi:profiller!hatali_isler_duzenleyen_fkey(ad_soyad)")
    .eq("id", id)
    .maybeSingle();
  if (!h) notFound();
  const [{ data: hareketler }, { data: notData }] = await Promise.all([
    o.supabase.from("hareketler").select("durum, zaman, kullanici").eq("kayit_turu", "hatali").eq("kayit_id", id).order("zaman"),
    o.supabase.from("hatali_notlar").select("id, sira, metin, fotograflar, olusturan, olusturma, duzenleme, duzenleyen").eq("hatali_id", id).order("sira"),
  ]);
  const notlar = (notData ?? []) as Not[];
  // Kim yazdı: ad, taşeronsa firması da ("Mehmet · Yılmaz Kalıp").
  const kisiler = new Map<string, string>();
  const ids = [
    ...new Set([...(hareketler ?? []).map((x) => x.kullanici), ...notlar.flatMap((n) => [n.olusturan, n.duzenleyen])].filter(Boolean)),
  ] as string[];
  if (ids.length) {
    const { data } = await o.supabase.from("profiller").select("id, ad_soyad, taseronlar(firma_adi)").in("id", ids);
    for (const p of data ?? []) {
      const firma = (p.taseronlar as unknown as { firma_adi: string } | null)?.firma_adi;
      kisiler.set(p.id, firma ? `${p.ad_soyad} · ${firma}` : p.ad_soyad);
    }
  }
  const cizelge: Olay[] = [
    ...(hareketler ?? []).map((x) => ({ tur: "durum" as const, zaman: x.zaman as string, durum: x.durum as HataDurum, kisi: x.kullanici as string | null })),
    ...notlar.map((n) => ({ tur: "not" as const, zaman: n.olusturma, not: n })),
  ].sort((a, b) => Date.parse(a.zaman) - Date.parse(b.zaman));
  const notAdresleri = await imzala(notlar.flatMap((n) => n.fotograflar));
  const adresler = await imzala(h.fotograflar);
  const taseron = h.taseronlar as unknown as { firma_adi: string } | null;
  const santiye = h.santiyeler as unknown as { ad: string } | null;
  const bildiren = h.bildiren as unknown as { ad_soyad: string } | null;
  const sorumlu = h.sorumlu as unknown as { ad_soyad: string } | null;
  const duzenleyen = h.duzenleyen_kisi as unknown as { ad_soyad: string } | null;
  const degisebilir = kayitDegisebilir(o, h, h.durum === "tespit", "hatali");

  return (
    <Sayfa baslik="Hatalı İş" geri="/hatali" geriAd="Hatalı İşler">
      {kayit && <p className="rounded-xl bg-yesil px-4 py-3 font-bold text-white">✓ Hatalı iş düzeltildi</p>}
      {yetki && (
        <p className="rounded-xl bg-kirmizi px-4 py-3 font-bold text-white">
          {yetki === "rev"
            ? "Bu notu düzeltme yetkiniz yok. Notu yazan 24 saat içinde, merkez her zaman düzeltebilir."
            : "Bu kaydı değiştirme yetkiniz yok. Kaydı giren kişi 24 saat içinde ve iş \"Tespit\" durumundayken, merkez her zaman değiştirebilir."}
        </p>
      )}
      {rev && <p className="rounded-xl bg-yesil px-4 py-3 font-bold text-white">✓ Rev. {rev} kaydedildi</p>}
      <div className="flex flex-wrap gap-2">
        <Etiket sinif={ONEM[h.onem as Onem].renk}>{ONEM[h.onem as Onem].ad}</Etiket>
        <Etiket sinif={HATA_DURUM[h.durum as HataDurum].renk}>{HATA_DURUM[h.durum as HataDurum].ad}</Etiket>
      </div>
      <p className="text-xl font-bold break-words">{h.aciklama}</p>
      <Fotolar yollar={h.fotograflar} adresler={adresler} />
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-2xl bg-yuzey p-4">
        {h.taseron_id ? (
          <>
            <dt className="font-bold">Taşeron</dt>
            <dd>
              {o.taseron ? taseron?.firma_adi : <Link href={`/taseronlar/${h.taseron_id}`} className="underline">{taseron?.firma_adi}</Link>}
            </dd>
          </>
        ) : (
          <>
            <dt className="font-bold">Sorumlu</dt>
            <dd>{sorumlu?.ad_soyad}</dd>
          </>
        )}
        <dt className="font-bold">Şantiye</dt>
        <dd>{santiye?.ad}</dd>
        <dt className="font-bold">Tarih</dt>
        <dd>{tarihYaz(h.is_tarihi)}</dd>
        {h.kat && (<><dt className="font-bold">Kat</dt><dd>{h.kat}</dd></>)}
        <dt className="font-bold">Bildiren</dt>
        <dd>{bildiren?.ad_soyad}</dd>
        {h.duzenleme && (
          <>
            <dt className="font-bold">Düzenlendi</dt>
            <dd>
              {zaman(h.duzenleme)}
              {duzenleyen ? ` · ${duzenleyen.ad_soyad}` : ""}
            </dd>
          </>
        )}
      </dl>

      {degisebilir && (
        <Link href={`/hatali/${h.id}/duzenle`} className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 border-cizgi text-lg font-bold">
          <Pencil className="size-6" /> Düzenle / Sil
        </Link>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">Zaman Çizelgesi</h2>
        <ol className="flex flex-col">
          {cizelge.map((x, i) => {
            const son = i === cizelge.length - 1;
            if (x.tur === "durum") {
              return (
                <li key={"d" + i} className="relative flex gap-3 pb-4">
                  <Cizgi son={son} nokta={`${HATA_DURUM[x.durum]?.renk ?? "bg-gri"} size-4 mt-1`} />
                  <p className="min-w-0">
                    <b>{HATA_DURUM[x.durum]?.ad ?? x.durum}</b>
                    <span className="text-soluk">
                      {" "}· {zaman(x.zaman)}
                      {x.kisi && kisiler.get(x.kisi) ? ` · ${kisiler.get(x.kisi)}` : ""}
                    </span>
                  </p>
                </li>
              );
            }
            const n = x.not;
            return (
              <li key={n.id} id={`rev-${n.sira}`} className="relative flex scroll-mt-20 gap-3 pb-4">
                <Cizgi son={son} nokta="bg-koyu size-4 mt-3" />
                <article className="flex min-w-0 flex-1 flex-col gap-2 rounded-2xl border-2 border-cizgi p-3">
                  <p className="flex flex-wrap items-baseline gap-x-2">
                    <span className="rounded-lg bg-koyu px-2 py-0.5 font-extrabold text-white">Rev. {n.sira}</span>
                    <span className="text-soluk">
                      {zaman(n.olusturma)}
                      {kisiler.get(n.olusturan) ? ` · ${kisiler.get(n.olusturan)}` : ""}
                    </span>
                  </p>
                  <p className="text-lg break-words whitespace-pre-line">{n.metin}</p>
                  <Fotolar yollar={n.fotograflar} adresler={notAdresleri} boyut="size-20" />
                  {(n.duzenleme || revizyonDegisebilir(o, n)) && (
                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-soluk">
                      <span>
                        {n.duzenleme &&
                          `Düzenlendi · ${zaman(n.duzenleme)}${n.duzenleyen && kisiler.get(n.duzenleyen) ? ` · ${kisiler.get(n.duzenleyen)}` : ""}`}
                      </span>
                      {revizyonDegisebilir(o, n) && (
                        <Link href={`/hatali/${h.id}/revizyon/${n.id}`} className="flex min-h-10 items-center gap-1 font-bold text-yazi underline">
                          <Pencil className="size-4" /> Düzelt
                        </Link>
                      )}
                    </div>
                  )}
                </article>
              </li>
            );
          })}
        </ol>
        {o.yetki("hatali", true) && (
          <Link
            href={`/hatali/${h.id}/revizyon`}
            className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-koyu text-lg font-bold text-white"
          >
            <MessageSquarePlus className="size-6" /> Rev. {notlar.length + 1} Ekle
          </Link>
        )}
      </section>

      {o.yetki("hatali", true) && <DurumDugmeleri id={h.id} durum={h.durum as HataDurum} taseron={o.taseron} />}
    </Sayfa>
  );
}
