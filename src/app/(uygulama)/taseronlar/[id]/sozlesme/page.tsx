import { notFound, redirect } from "next/navigation";
import { oturum } from "@/lib/oturum";
import { Sayfa } from "@/components/kabuk";
import { SozlesmeFormu } from "./form";

export default async function YeniSozlesme({ params, searchParams }: PageProps<"/taseronlar/[id]/sozlesme">) {
  const o = await oturum();
  if (o.taseron || !o.yetki("taseronlar", true)) redirect("/?yetki=yok");
  const { id } = await params;
  const { yeni } = await searchParams;
  const { data: t } = await o.supabase.from("taseronlar").select("id, firma_adi, is_turu").eq("id", id).maybeSingle();
  if (!t) notFound();
  return (
    <Sayfa baslik="Sözleşme Ekle" geri={`/taseronlar/${id}`} geriAd={t.firma_adi}>
      {yeni && (
        <p className="rounded-xl bg-yesil px-4 py-3 font-bold text-white">
          ✓ {t.firma_adi} kaydedildi. Şimdi sözleşmesini girin; taşeron, sözleşmesi olan şantiyede listelenir.
        </p>
      )}
      <SozlesmeFormu
        taseronId={t.id}
        isTuru={t.is_turu}
        firmaId={o.firma.id}
        santiyeler={o.santiyeler.map((s) => ({ id: s.id, ad: s.ad }))}
        seciliSantiye={o.santiye?.id}
      />
    </Sayfa>
  );
}
