import Link from "next/link";
import { notFound } from "next/navigation";
import { yetkiIste } from "@/lib/oturum";
import { imzala } from "@/lib/dosya";
import { HATA_DURUM, ONEM, tarihYaz, type HataDurum, type Onem } from "@/lib/sabitler";
import { Etiket, Sayfa } from "@/components/kabuk";
import { Fotolar } from "@/components/kartlar";
import { DurumDugmeleri } from "./durum";

export default async function HataDetay({ params }: PageProps<"/hatali/[id]">) {
  const o = await yetkiIste("hatali");
  const { id } = await params;
  const { data: h } = await o.supabase
    .from("hatali_isler")
    .select("id, is_tarihi, aciklama, kat, onem, durum, fotograflar, olusturma, taseron_id, taseronlar(firma_adi), santiyeler(ad), profiller(ad_soyad)")
    .eq("id", id)
    .maybeSingle();
  if (!h) notFound();
  const { data: hareketler } = await o.supabase
    .from("hareketler")
    .select("durum, zaman, kullanici")
    .eq("kayit_turu", "hatali")
    .eq("kayit_id", id)
    .order("zaman");
  const kisiler = new Map<string, string>();
  const ids = [...new Set((hareketler ?? []).map((x) => x.kullanici).filter(Boolean))] as string[];
  if (ids.length) {
    const { data } = await o.supabase.from("profiller").select("id, ad_soyad").in("id", ids);
    for (const p of data ?? []) kisiler.set(p.id, p.ad_soyad);
  }
  const adresler = await imzala(h.fotograflar);
  const taseron = h.taseronlar as unknown as { firma_adi: string } | null;
  const santiye = h.santiyeler as unknown as { ad: string } | null;
  const bildiren = h.profiller as unknown as { ad_soyad: string } | null;

  return (
    <Sayfa baslik="Hatalı İş" geri="/hatali" geriAd="Hatalı İşler">
      <div className="flex flex-wrap gap-2">
        <Etiket sinif={ONEM[h.onem as Onem].renk}>{ONEM[h.onem as Onem].ad}</Etiket>
        <Etiket sinif={HATA_DURUM[h.durum as HataDurum].renk}>{HATA_DURUM[h.durum as HataDurum].ad}</Etiket>
      </div>
      <p className="text-xl font-bold break-words">{h.aciklama}</p>
      <Fotolar yollar={h.fotograflar} adresler={adresler} />
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-2xl bg-yuzey p-4">
        <dt className="font-bold">Taşeron</dt>
        <dd>
          {o.taseron ? taseron?.firma_adi : <Link href={`/taseronlar/${h.taseron_id}`} className="underline">{taseron?.firma_adi}</Link>}
        </dd>
        <dt className="font-bold">Şantiye</dt>
        <dd>{santiye?.ad}</dd>
        <dt className="font-bold">Tarih</dt>
        <dd>{tarihYaz(h.is_tarihi)}</dd>
        {h.kat && (<><dt className="font-bold">Kat</dt><dd>{h.kat}</dd></>)}
        <dt className="font-bold">Bildiren</dt>
        <dd>{bildiren?.ad_soyad}</dd>
      </dl>

      {o.yetki("hatali", true) && <DurumDugmeleri id={h.id} durum={h.durum as HataDurum} taseron={o.taseron} />}

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold">Geçmiş</h2>
        <ol className="flex flex-col gap-1 border-l-4 border-cizgi pl-4">
          {(hareketler ?? []).map((x, i) => (
            <li key={i}>
              <b>{HATA_DURUM[x.durum as HataDurum]?.ad ?? x.durum}</b>
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
