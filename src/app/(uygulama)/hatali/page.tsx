import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { yetkiIste } from "@/lib/oturum";
import { imzala } from "@/lib/dosya";
import { HATA_DURUM, type HataDurum } from "@/lib/sabitler";
import { Bos, Sayfa } from "@/components/kabuk";
import { HataKarti, type Hata } from "@/components/kartlar";

const ONEM_SIRA = { acil: 0, normal: 1, dusuk: 2 };

/** Açık işler önem sırasına göre; onaylananlar ayrı sekmede. */
export default async function HataliIsler({ searchParams }: PageProps<"/hatali">) {
  const o = await yetkiIste("hatali");
  const { durum } = await searchParams;
  const filtre: HataDurum | "acik" = durum && typeof durum === "string" && durum in HATA_DURUM ? (durum as HataDurum) : "acik";
  if (!o.santiye) return <Sayfa baslik="Hatalı İşler"><Bos>Şantiye seçili değil.</Bos></Sayfa>;

  let sorgu = o.supabase
    .from("hatali_isler")
    .select("id, is_tarihi, aciklama, kat, onem, durum, fotograflar, taseronlar(firma_adi), sorumlu:profiller!hatali_isler_sorumlu_kullanici_id_fkey(ad_soyad)")
    .eq("santiye_id", o.santiye.id)
    .order("is_tarihi", { ascending: false })
    .limit(300);
  sorgu = filtre === "acik" ? sorgu.neq("durum", "onaylandi") : sorgu.eq("durum", filtre);
  const { data } = await sorgu;
  const liste = ((data ?? []) as unknown as Hata[]).sort((a, b) => ONEM_SIRA[a.onem] - ONEM_SIRA[b.onem]);
  const adresler = await imzala(liste.map((h) => h.fotograflar[0]));

  const sekmeler = [
    { kod: "acik", ad: "Açık" },
    { kod: "tespit", ad: "Tespit" },
    { kod: "duzeltiliyor", ad: "Düzeltiliyor" },
    { kod: "onaylandi", ad: "Onaylı" },
  ];

  return (
    <Sayfa baslik={`Hatalı İşler · ${o.santiye.ad}`}>
      {o.yetki("hatali", true) && !o.taseron && (
        <Link href="/hatali/yeni" className="flex min-h-16 items-center justify-center gap-2 rounded-2xl bg-kirmizi text-xl font-bold text-white">
          <AlertTriangle className="size-7" /> Hatalı İş Bildir
        </Link>
      )}
      <nav className="grid grid-cols-4 gap-1 rounded-2xl bg-yuzey p-1">
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
      {liste.length === 0 && <Bos>Kayıt yok.</Bos>}
      <div className="flex flex-col gap-2">
        {liste.map((h) => (
          <HataKarti key={h.id} h={h} adresler={adresler} taseronGoster={!o.taseron || undefined} />
        ))}
      </div>
    </Sayfa>
  );
}
