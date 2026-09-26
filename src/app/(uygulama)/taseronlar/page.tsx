import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, Plus, CornerDownRight } from "lucide-react";
import { oturum } from "@/lib/oturum";
import { BuyukBag, Bos, GecikmeEtiketi, Sayfa } from "@/components/kabuk";

type T = { id: string; firma_adi: string; is_turleri: string[]; ust_taseron_id: string | null; aktif: boolean };

export default async function Taseronlar({ searchParams }: PageProps<"/taseronlar">) {
  const o = await oturum();
  if (o.taseron) redirect(`/taseronlar/${o.profil.taseron_id}`);
  const { hepsi } = await searchParams;

  // Varsayılan: seçili şantiyede çalışanlar. "Tümü" ile firmadaki bütün taşeronlar.
  const [{ data: tumu }, santiyede] = await Promise.all([
    o.supabase.from("taseronlar").select("id, firma_adi, is_turleri, ust_taseron_id, aktif").order("firma_adi"),
    o.santiye ? o.supabase.rpc("santiye_taseronlari", { p_santiye: o.santiye.id }) : Promise.resolve({ data: [] }),
  ]);
  const gecikme = new Map(((santiyede.data ?? []) as { id: string; gecikme: number | null }[]).map((t) => [t.id, t.gecikme]));
  const liste = ((tumu ?? []) as T[]).filter((t) => hepsi || gecikme.has(t.id));

  // Alt taşeronlar ana taşeronun altında girintili gösterilir.
  const anaListe = liste.filter((t) => !t.ust_taseron_id || !liste.some((u) => u.id === t.ust_taseron_id));
  const altlar = (id: string) => liste.filter((t) => t.ust_taseron_id === id);

  return (
    <Sayfa baslik="Taşeronlar">
      {o.yetki("taseronlar", true) && (
        <BuyukBag href="/taseronlar/yeni" sinif="bg-vurgu text-black">
          <Plus className="size-7" strokeWidth={3} /> Yeni Taşeron
        </BuyukBag>
      )}
      <div className="grid grid-cols-2 gap-2">
        <Link
          href="/taseronlar"
          className={`flex min-h-12 items-center justify-center rounded-xl border-2 font-semibold ${!hepsi ? "border-yazi bg-koyu text-white" : "border-cizgi"}`}
        >
          {o.santiye?.ad ?? "Şantiye"}
        </Link>
        <Link
          href="/taseronlar?hepsi=1"
          className={`flex min-h-12 items-center justify-center rounded-xl border-2 font-semibold ${hepsi ? "border-yazi bg-koyu text-white" : "border-cizgi"}`}
        >
          Tüm taşeronlar
        </Link>
      </div>

      {liste.length === 0 ? (
        <Bos>
          {hepsi ? "Henüz taşeron yok." : "Bu şantiyede sözleşmesi olan taşeron yok. Taşeron ekleyip sözleşmesini bu şantiyeye bağlayın."}
        </Bos>
      ) : (
        <ul className="flex flex-col gap-2">
          {anaListe.map((t) => (
            <li key={t.id} className="flex flex-col gap-2">
              <Satir t={t} gecikme={gecikme.get(t.id)} />
              {altlar(t.id).map((a) => (
                <div key={a.id} className="flex items-center gap-1 pl-3">
                  <CornerDownRight className="size-5 shrink-0 text-soluk" />
                  <div className="min-w-0 flex-1">
                    <Satir t={a} gecikme={gecikme.get(a.id)} />
                  </div>
                </div>
              ))}
            </li>
          ))}
        </ul>
      )}
    </Sayfa>
  );
}

function Satir({ t, gecikme }: { t: T; gecikme?: number | null }) {
  return (
    <Link
      href={`/taseronlar/${t.id}`}
      className={`flex min-h-16 items-center gap-3 rounded-2xl border-2 p-3 active:bg-yuzey ${
        gecikme != null && gecikme <= 7 ? "border-kirmizi" : "border-cizgi"
      } ${t.aktif ? "" : "opacity-60"}`}
    >
      <div className="min-w-0 flex-1">
        <p className="text-lg font-bold break-words">{t.firma_adi}</p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-soluk">{t.is_turleri.join(", ")}</span>
          <GecikmeEtiketi gun={gecikme} />
        </div>
      </div>
      <ChevronRight className="size-6 shrink-0 text-soluk" />
    </Link>
  );
}
