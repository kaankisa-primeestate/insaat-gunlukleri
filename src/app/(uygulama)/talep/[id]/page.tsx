import Link from "next/link";
import { notFound } from "next/navigation";
import { Truck } from "lucide-react";
import { yetkiIste } from "@/lib/oturum";
import { TALEP_DURUM, TALEP_SIRASI, tarihYaz, type TalepDurum } from "@/lib/sabitler";
import { Etiket, Sayfa } from "@/components/kabuk";
import { TalepIlerlet } from "./ilerlet";

export default async function TalepDetay({ params }: PageProps<"/talep/[id]">) {
  const o = await yetkiIste("talep");
  const { id } = await params;
  const { data: t } = await o.supabase
    .from("talepler")
    .select("id, urun, miktar, birim, notu, durum, is_tarihi, taseron_id, taseronlar(firma_adi), santiyeler(ad), profiller(ad_soyad)")
    .eq("id", id)
    .maybeSingle();
  if (!t) notFound();
  const [{ data: hareketler }, { data: teslimatlar }] = await Promise.all([
    o.supabase.from("hareketler").select("durum, zaman, kullanici").eq("kayit_turu", "talep").eq("kayit_id", id).order("zaman"),
    o.supabase.from("teslimatlar").select("id, tarih, saat, arac").eq("talep_id", id).order("tarih"),
  ]);
  const ids = [...new Set((hareketler ?? []).map((x) => x.kullanici).filter(Boolean))] as string[];
  const kisiler = new Map<string, string>();
  if (ids.length) {
    const { data } = await o.supabase.from("profiller").select("id, ad_soyad").in("id", ids);
    for (const p of data ?? []) kisiler.set(p.id, p.ad_soyad);
  }
  const durum = t.durum as TalepDurum;
  const taseron = t.taseronlar as unknown as { firma_adi: string } | null;
  const acan = t.profiller as unknown as { ad_soyad: string } | null;
  const adim = TALEP_SIRASI.indexOf(durum);

  return (
    <Sayfa baslik="Talep" geri="/talep" geriAd="Talepler">
      <p className="text-2xl font-extrabold break-words">
        {Number(t.miktar).toLocaleString("tr-TR")} {t.birim} {t.urun}
      </p>
      <Etiket sinif={TALEP_DURUM[durum].renk}>{TALEP_DURUM[durum].ad}</Etiket>

      {/* Süreç çubuğu */}
      <ol className="grid grid-cols-5 gap-1">
        {TALEP_SIRASI.map((d, i) => (
          <li key={d} className="flex flex-col gap-1">
            <span className={`h-3 rounded-full ${i <= adim ? "bg-yesil" : "bg-cizgi"}`} />
            <span className={`text-center text-xs leading-tight ${i === adim ? "font-bold" : "text-soluk"}`}>{TALEP_DURUM[d].ad}</span>
          </li>
        ))}
      </ol>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-2xl bg-yuzey p-4">
        <dt className="font-bold">Taşeron</dt>
        <dd>{o.taseron ? taseron?.firma_adi : <Link href={`/taseronlar/${t.taseron_id}`} className="underline">{taseron?.firma_adi}</Link>}</dd>
        <dt className="font-bold">Açılış</dt>
        <dd>{tarihYaz(t.is_tarihi)} · {acan?.ad_soyad}</dd>
        {t.notu && (<><dt className="font-bold">Not</dt><dd>{t.notu}</dd></>)}
      </dl>

      {!o.taseron && o.yetki("talep", true) && durum !== "kapandi" && <TalepIlerlet id={t.id} durum={durum} />}

      {o.yetki("teslimat", true) && durum !== "kapandi" && durum !== "teslim_alindi" && (
        <Link
          href={`/teslimat?yeni=1&talep=${t.id}`}
          className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 border-cizgi text-lg font-bold"
        >
          <Truck className="size-6" /> Teslimat saati planla
        </Link>
      )}
      {(teslimatlar ?? []).length > 0 && (
        <p className="rounded-xl bg-yuzey p-3">
          Planlı teslimat:{" "}
          {(teslimatlar ?? []).map((x) => `${tarihYaz(x.tarih)} ${String(x.saat).padStart(2, "0")}:00 (${x.arac})`).join(", ")}
        </p>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold">Geçmiş</h2>
        <ol className="flex flex-col gap-1 border-l-4 border-cizgi pl-4">
          {(hareketler ?? []).map((x, i) => (
            <li key={i}>
              <b>{TALEP_DURUM[x.durum as TalepDurum]?.ad ?? x.durum}</b>
              <span className="text-soluk">
                {" "}· {new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Istanbul" }).format(new Date(x.zaman))}
                {x.kullanici && kisiler.get(x.kullanici) ? ` · ${kisiler.get(x.kullanici)}` : ""}
              </span>
            </li>
          ))}
        </ol>
      </section>
    </Sayfa>
  );
}
