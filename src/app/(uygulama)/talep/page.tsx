import Link from "next/link";
import { Package } from "lucide-react";
import { yetkiIste } from "@/lib/oturum";
import { Bos, Sayfa } from "@/components/kabuk";
import { TalepKarti, type Talep } from "@/components/kartlar";

const SEKMELER = {
  bekleyen: { ad: "Bekleyen", durumlar: ["acildi", "satin_alindi", "yolda"] },
  teslim: { ad: "Teslim alındı", durumlar: ["teslim_alindi"] },
  kapandi: { ad: "Kapandı", durumlar: ["kapandi"] },
} as const;

export default async function Talepler({ searchParams }: PageProps<"/talep">) {
  const o = await yetkiIste("talep");
  const { sekme: s } = await searchParams;
  const sekme = (typeof s === "string" && s in SEKMELER ? s : "bekleyen") as keyof typeof SEKMELER;
  if (!o.santiye) return <Sayfa baslik="Talepler"><Bos>Şantiye seçili değil.</Bos></Sayfa>;

  const { data } = await o.supabase
    .from("talepler")
    .select("id, urun, miktar, birim, durum, is_tarihi, taseronlar(firma_adi)")
    .eq("santiye_id", o.santiye.id)
    .in("durum", [...SEKMELER[sekme].durumlar])
    .order("olusturma", { ascending: sekme === "bekleyen" })
    .limit(300);
  const liste = (data ?? []) as unknown as Talep[];

  return (
    <Sayfa baslik={`Talepler · ${o.santiye.ad}`}>
      {o.yetki("talep", true) && (
        <Link href="/talep/yeni" className="flex min-h-16 items-center justify-center gap-2 rounded-2xl bg-vurgu text-xl font-bold text-black">
          <Package className="size-7" /> Talep Aç
        </Link>
      )}
      <nav className="grid grid-cols-3 gap-1 rounded-2xl bg-yuzey p-1">
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
      <div className="flex flex-col gap-2">
        {liste.map((t) => (
          <TalepKarti key={t.id} t={t} />
        ))}
      </div>
    </Sayfa>
  );
}
