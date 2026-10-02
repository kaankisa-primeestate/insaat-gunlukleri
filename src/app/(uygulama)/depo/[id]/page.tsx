import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowDownToLine, ArrowUpFromLine, Ban, Flame, MapPin, Pencil, Plus, RotateCcw, Scale } from "lucide-react";
import { depoIste } from "@/lib/depo-sunucu";
import { imzala } from "@/lib/dosya";
import { HAREKET_ALANLARI, KALEM_ALANLARI, hareketYazisi, kacGundur, kimdeNeVar, miktarYaz, yerYazisi, type DepoHareketi, type DepoKalemi, type HareketKodu } from "@/lib/depo";
import { Sayfa } from "@/components/kabuk";
import { Fotolar } from "@/components/fotolar";

const zaman = (t: string) =>
  new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" }).format(new Date(t));

const DUGMELER: { tur: HareketKodu; ad: string; ikon: React.ReactNode; ana?: boolean }[] = [
  { tur: "ver", ad: "Ver", ikon: <ArrowUpFromLine className="size-6" />, ana: true },
  { tur: "geri", ad: "Geri al", ikon: <ArrowDownToLine className="size-6" />, ana: true },
  { tur: "kullanildi", ad: "Kullanıldı", ikon: <Flame className="size-5" /> },
  { tur: "giris", ad: "Depoya ekle", ikon: <Plus className="size-5" /> },
  { tur: "yer", ad: "Yer değiştir", ikon: <MapPin className="size-5" /> },
  { tur: "sayim", ad: "Miktarı düzelt", ikon: <Scale className="size-5" /> },
  { tur: "kapat", ad: "Elden çıktı", ikon: <Ban className="size-5" /> },
];

/**
 * Depo dosyası: fotoğraf, ne olduğu, kalan miktar, nerede; dışarıda kimde ne
 * var; altında bütün revizyonlar (eskiden yeniye, her birinde o anki kalan).
 */
export default async function DepoDosyasi({ params, searchParams }: PageProps<"/depo/[id]">) {
  const o = await depoIste();
  const { id } = await params;
  const sp = await searchParams;
  const { data } = await o.supabase.from("depo_kalemleri").select(KALEM_ALANLARI).eq("id", id).maybeSingle();
  const k = data as unknown as DepoKalemi | null;
  if (!k) notFound();
  const { data: hData } = await o.supabase.from("depo_hareketleri").select(HAREKET_ALANLARI).eq("kalem_id", id).order("sira");
  const hareketler = (hData ?? []) as unknown as DepoHareketi[];
  const adresler = await imzala(k.fotograflar);
  const kimde = kimdeNeVar(hareketler);
  const yazabilir = o.yetki("depo", true);
  const bildirim = sp.kayit ? "✓ Kaydedildi" : sp.duzeltildi ? "✓ Düzeltildi; eski hâli revizyonlarda" : sp.rev ? `✓ Rev. ${Number(sp.rev) - 1} kaydedildi` : null;

  return (
    <Sayfa baslik={k.ad} geri="/depo" geriAd="Depo">
      {bildirim && <p className="rounded-xl bg-yesil px-4 py-3 font-bold text-white">{bildirim}</p>}
      {k.kapandi && <p className="rounded-xl bg-gri px-4 py-3 font-bold text-white">Elden çıktı; kayıt kapalı. Geçmişi aşağıda.</p>}
      <Fotolar yollar={k.fotograflar} adresler={adresler} boyut="size-32" />
      {k.ozellik && <p className="text-lg break-words whitespace-pre-line">{k.ozellik}</p>}

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-yesil-acik p-3">
          <p className="text-sm font-bold text-yesil">Depoda</p>
          <p className="text-2xl font-extrabold">{miktarYaz(k.depoda, k.birim)}</p>
          <p className="text-sm font-semibold break-words">{yerYazisi(k)}</p>
        </div>
        <div className={`rounded-2xl p-3 ${k.disarida > 0 ? "bg-sari-acik" : "bg-yuzey"}`}>
          <p className="text-sm font-bold text-soluk">Dışarıda</p>
          <p className="text-2xl font-extrabold">{miktarYaz(k.disarida, k.birim)}</p>
        </div>
      </div>

      {kimde.length > 0 && (
        <section className="flex flex-col gap-1 rounded-2xl border-2 border-sari p-3">
          <p className="font-bold">Kimde?</p>
          {kimde.map((x) => (
            <p key={x.kime} className="flex flex-wrap justify-between gap-x-3">
              <span className="font-semibold">{x.kime}</span>
              <span>
                {miktarYaz(x.miktar, k.birim)} · <span className="text-soluk">{kacGundur(x.son)}</span>
              </span>
            </p>
          ))}
        </section>
      )}
      {k.notu && <p className="rounded-2xl bg-yuzey p-3 break-words whitespace-pre-line">{k.notu}</p>}

      {yazabilir && (
        <section className="flex flex-col gap-2">
          {k.kapandi ? (
            <Link href={`/depo/${k.id}/hareket?tur=ac`} className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-koyu text-lg font-bold text-white">
              <RotateCcw className="size-6" /> Yeniden aç
            </Link>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                {DUGMELER.filter((d) => d.ana).map((d) => (
                  <Link key={d.tur} href={`/depo/${k.id}/hareket?tur=${d.tur}`} className="flex min-h-16 items-center justify-center gap-2 rounded-2xl bg-koyu text-lg font-bold text-white">
                    {d.ikon} {d.ad}
                  </Link>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {DUGMELER.filter((d) => !d.ana).map((d) => (
                  <Link key={d.tur} href={`/depo/${k.id}/hareket?tur=${d.tur}`} className="flex min-h-12 items-center gap-1.5 rounded-xl border-2 border-cizgi bg-yuzey px-3 font-bold">
                    {d.ikon} {d.ad}
                  </Link>
                ))}
                <Link href={`/depo/${k.id}/duzelt`} className="flex min-h-12 items-center gap-1.5 rounded-xl border-2 border-cizgi bg-yuzey px-3 font-bold">
                  <Pencil className="size-5" /> Düzelt
                </Link>
              </div>
            </>
          )}
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">Revizyonlar</h2>
        <ol className="flex flex-col">
          {hareketler.map((h, i) => {
            const son = i === hareketler.length - 1;
            return (
              <li key={h.id} id={`rev-${h.sira}`} className="relative flex scroll-mt-20 gap-3 pb-4 last:pb-0">
                <div className="relative flex w-4 shrink-0 justify-center">
                  {!son && <span className="absolute top-3 -bottom-6 w-1 rounded bg-cizgi" />}
                  <span className={`relative mt-1.5 size-4 rounded-full ring-4 ring-zemin ${son ? "bg-yesil" : "bg-gri"}`} />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="flex flex-wrap items-center gap-x-2">
                    <span className={`rounded-lg px-2 py-0.5 font-extrabold ${son ? "bg-yesil text-white" : "bg-gri-acik"}`}>
                      {h.sira === 1 ? "Kayıt" : `Rev. ${h.sira - 1}`}
                    </span>
                    <span className="text-sm text-soluk">
                      {zaman(h.olusturma)}
                      {h.profiller ? ` · ${h.profiller.ad_soyad}` : ""}
                    </span>
                  </p>
                  <p className="text-lg font-semibold break-words">{hareketYazisi(h, k.birim)}</p>
                  {h.tur === "duzeltme" && h.eski && h.yeni && (
                    <ul className="flex flex-col gap-0.5 rounded-xl bg-yuzey p-2 text-sm">
                      {Object.keys(h.yeni).map((alan) => (
                        <li key={alan} className="break-words">
                          <b>{alan}:</b> <span className="text-soluk line-through">{String(h.eski?.[alan] ?? "—")}</span> → {String(h.yeni?.[alan])}
                        </li>
                      ))}
                    </ul>
                  )}
                  {h.notu && <p className="text-soluk break-words">{h.notu}</p>}
                  <p className="text-sm text-soluk">
                    Kalan: depoda {miktarYaz(h.depoda, k.birim)}
                    {h.disarida > 0 ? ` · dışarıda ${miktarYaz(h.disarida, k.birim)}` : ""}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
        <p className="text-sm text-soluk">Depo kayıtları ve revizyonlar silinmez.</p>
      </section>
    </Sayfa>
  );
}
