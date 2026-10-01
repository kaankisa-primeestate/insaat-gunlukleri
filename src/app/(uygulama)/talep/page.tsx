import Link from "next/link";
import { yetkiIste } from "@/lib/oturum";
import { Bos, Sayfa, YeniEkle } from "@/components/kabuk";
import { TalepKarti, type Talep } from "@/components/kartlar";

const SEKMELER = {
  bekleyen: { ad: "Bekleyen", durumlar: ["acildi", "satin_alindi", "yolda"] },
  teslim: { ad: "Teslim alındı", durumlar: ["teslim_alindi"] },
  kapandi: { ad: "Kapandı", durumlar: ["kapandi"] },
} as const;

export default async function Talepler({ searchParams }: PageProps<"/talep">) {
  const o = await yetkiIste("talep");
  const { sekme: s, kayit, silindi } = await searchParams;
  const sekme = (typeof s === "string" && s in SEKMELER ? s : "bekleyen") as keyof typeof SEKMELER;
  if (!o.santiye) return <Sayfa baslik="Talepler"><Bos>Şantiye seçili değil.</Bos></Sayfa>;

  const { data } = await o.supabase
    .from("talepler")
    .select("id, urun, miktar, birim, durum, is_tarihi, termin, taseron_adi, taseronlar(firma_adi)")
    .eq("santiye_id", o.santiye.id)
    .in("durum", [...SEKMELER[sekme].durumlar])
    .order("olusturma", { ascending: sekme === "bekleyen" })
    .limit(300);
  // Bekleyenlerde termini olanlar öne, en yakın termin en üstte.
  const liste = ((data ?? []) as unknown as Talep[]).sort((a, b) =>
    sekme === "bekleyen" ? (a.termin ?? "9999").localeCompare(b.termin ?? "9999") : 0,
  );

  return (
    <Sayfa baslik={`Talepler · ${o.santiye.ad}`} genis>
      {kayit && <p className="rounded-xl bg-yesil px-4 py-3 text-lg font-bold text-white">✓ Kaydedildi</p>}
      {silindi && <p className="rounded-xl bg-yesil px-4 py-3 text-lg font-bold text-white">✓ Kayıt silindi</p>}
      {o.yetki("talep", true) && <YeniEkle href="/talep/yeni" />}
      <nav className="grid grid-cols-3 gap-1 rounded-2xl bg-yuzey p-1 lg:max-w-xl">
        {Object.entries(SEKMELER).map(([k, v]) => (
          <Link
            key={k}
            href={k === "bekleyen" ? "/talep" : `/talep?sekme=${k}`}
            replace
            className={`flex min-h-12 items-center justify-center rounded-xl text-sm font-bold ${sekme === k ? "bg-koyu text-white" : "text-soluk"}`}
          >
            {v.ad}
          </Link>
        ))}
      </nav>
      {liste.length === 0 && <Bos>Kayıt yok.</Bos>}
      <div className="flex flex-col gap-2 lg:grid lg:grid-cols-2">
        {liste.map((t) => (
          <TalepKarti key={t.id} t={t} />
        ))}
      </div>
    </Sayfa>
  );
}
