import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { yetkiIste } from "@/lib/oturum";
import { imzala } from "@/lib/dosya";
import { HATA_DURUM, type HataDurum } from "@/lib/sabitler";
import { Bos, Sayfa } from "@/components/kabuk";
import { HataKarti, type Hata } from "@/components/kartlar";

const ONEM_SIRA = { acil: 0, normal: 1, dusuk: 2 };
const ALANLAR =
  "id, is_tarihi, aciklama, kat, onem, durum, fotograflar, taseronlar(firma_adi), sorumlu:profiller!hatali_isler_sorumlu_kullanici_id_fkey(ad_soyad)";

/** Açık işler önem sırasına göre; onaylananlar ayrı sekmede. */
export default async function HataliIsler({ searchParams }: PageProps<"/hatali">) {
  const o = await yetkiIste("hatali");
  const { durum } = await searchParams;
  const filtre: HataDurum | "acik" = durum && typeof durum === "string" && durum in HATA_DURUM ? (durum as HataDurum) : "acik";
  if (!o.santiye) return <Sayfa baslik="Hatalı İşler"><Bos>Şantiye seçili değil.</Bos></Sayfa>;

  // Açık işlerin hepsi ve son onaylananlar tek sorguda: telefonda sekmeye göre
  // süzülür, bilgisayarda üç sütunlu panoda birlikte görünür.
  const [{ data: acik }, { data: onayli }] = await Promise.all([
    o.supabase.from("hatali_isler").select(ALANLAR).eq("santiye_id", o.santiye.id).neq("durum", "onaylandi")
      .order("is_tarihi", { ascending: false }).limit(300),
    o.supabase.from("hatali_isler").select(ALANLAR).eq("santiye_id", o.santiye.id).eq("durum", "onaylandi")
      .order("guncelleme", { ascending: false }).limit(60),
  ]);
  const hepsi = ([...(acik ?? []), ...(onayli ?? [])] as unknown as Hata[]).sort((a, b) => ONEM_SIRA[a.onem] - ONEM_SIRA[b.onem]);
  const liste = hepsi.filter((h) => (filtre === "acik" ? h.durum !== "onaylandi" : h.durum === filtre));
  const adresler = await imzala(hepsi.map((h) => h.fotograflar[0]));
  const sutunlar: HataDurum[] = ["tespit", "duzeltiliyor", "onaylandi"];

  const sekmeler = [
    { kod: "acik", ad: "Açık" },
    { kod: "tespit", ad: "Tespit" },
    { kod: "duzeltiliyor", ad: "Düzeltiliyor" },
    { kod: "onaylandi", ad: "Onaylı" },
  ];

  return (
    <Sayfa baslik={`Hatalı İşler · ${o.santiye.ad}`} genis>
      {o.yetki("hatali", true) && !o.taseron && (
        <Link href="/hatali/yeni" className="flex min-h-16 items-center justify-center gap-2 rounded-2xl bg-kirmizi text-xl font-bold text-white">
          <AlertTriangle className="size-7" /> Hatalı İş Bildir
        </Link>
      )}
      <nav className="grid grid-cols-4 gap-1 rounded-2xl bg-yuzey p-1 lg:hidden">
        {sekmeler.map((s) => (
          <Link
            key={s.kod}
            href={s.kod === "acik" ? "/hatali" : `/hatali?durum=${s.kod}`}
            replace
            className={`flex min-h-12 items-center justify-center rounded-xl text-sm font-bold ${filtre === s.kod ? "bg-koyu text-white" : "text-soluk"}`}
          >
            {s.ad}
          </Link>
        ))}
      </nav>
      <div className="flex flex-col gap-2 lg:hidden">
        {liste.length === 0 && <Bos>Kayıt yok.</Bos>}
        {liste.map((h) => (
          <HataKarti key={h.id} h={h} adresler={adresler} taseronGoster={!o.taseron || undefined} />
        ))}
      </div>
      {/* Bilgisayarda pano: her durum bir sütun, acil olanlar üstte. */}
      <div className="hidden grid-cols-3 gap-4 lg:grid">
        {sutunlar.map((d) => {
          const kayitlar = hepsi.filter((h) => h.durum === d);
          return (
            <section key={d} className="flex min-w-0 flex-col gap-2 rounded-2xl bg-yuzey p-3">
              <h2 className="flex items-center justify-between px-1 text-lg font-extrabold">
                {HATA_DURUM[d].ad}
                <span className={`rounded-lg px-2 text-sm ${HATA_DURUM[d].renk}`}>{kayitlar.length}</span>
              </h2>
              {d === "onaylandi" && <p className="px-1 text-xs text-soluk">Son onaylananlar</p>}
              {kayitlar.length === 0 && <p className="px-1 py-4 text-center text-soluk">—</p>}
              {kayitlar.map((h) => (
                <div key={h.id} className="rounded-2xl bg-zemin">
                  <HataKarti h={h} adresler={adresler} taseronGoster={!o.taseron || undefined} />
                </div>
              ))}
            </section>
          );
        })}
      </div>
    </Sayfa>
  );
}
