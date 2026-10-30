import Link from "next/link";
import { CheckCircle2, MoreHorizontal, Pencil } from "lucide-react";
import { bugun } from "@/lib/sabitler";
import { gunlukDevamEt, gunlukGelmedi, gunlukOneriKapat } from "./eylemler";

export type GunlukOnerisi = {
  taseron_id: string;
  firma_adi: string;
  kaynak_id: string;
  kaynak_tarih: string;
  kisi_sayisi: number;
  katlar: string[];
  is_kalemleri: string[];
  notu: string | null;
};

/** Dünden bugüne kaç gün geçmiş; "Dün", "2 gün önce" gibi. */
function gecenGun(tarih: string): string {
  const fark = Math.round((new Date(bugun()).getTime() - new Date(tarih).getTime()) / 86400000);
  return fark <= 1 ? "Dün" : `${fark} gün önce`;
}

/**
 * D5 "Dünden devam": otomatik kayıt yapılmaz, öneri + tek dokunuş onay.
 * Taşeron aynı işe üst üste devam ettiğinde günlüğü baştan doldurmamak için.
 */
export function DundenDevam({ oneriler }: { oneriler: GunlukOnerisi[] }) {
  if (!oneriler.length) return null;
  return (
    <section className="flex flex-col gap-3 rounded-2xl border-2 border-cizgi bg-yuzey p-4">
      <h2 className="text-lg font-bold">
        Dün çalışan {oneriler.length} taşeron — bugün de devam ediyorlar mı?
      </h2>
      <div className="flex flex-col gap-3">
        {oneriler.map((o) => (
          <OneriKarti key={o.taseron_id} o={o} />
        ))}
      </div>
    </section>
  );
}

function OneriKarti({ o }: { o: GunlukOnerisi }) {
  const ozet = [`${o.kisi_sayisi} kişi`, o.katlar.join(", "), o.is_kalemleri.join(", ")].filter(Boolean).join(" · ");
  return (
    <article className="rounded-xl bg-zemin p-3">
      <p className="font-extrabold">{o.firma_adi}</p>
      <p className="text-sm text-soluk">
        {gecenGun(o.kaynak_tarih)} · {ozet}
        {o.notu && ` · ${o.notu}`}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <form action={gunlukDevamEt} className="flex-1">
          <input type="hidden" name="kaynak_id" value={o.kaynak_id} />
          <button className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-yesil font-bold text-white active:scale-[0.98]">
            <CheckCircle2 className="size-5" /> Aynen devam
          </button>
        </form>
        <Link
          href={`/gunluk/yeni?kaynak=${o.kaynak_id}`}
          className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-cizgi font-bold active:scale-[0.98]"
        >
          <Pencil className="size-5" /> Değiştir
        </Link>
      </div>
      <div className="mt-2 flex items-center gap-3 text-sm">
        <form action={gunlukGelmedi}>
          <input type="hidden" name="taseron_id" value={o.taseron_id} />
          <button className="font-bold text-soluk underline underline-offset-2">Gelmedi</button>
        </form>
        <details className="relative ml-auto">
          <summary className="flex min-h-8 cursor-pointer list-none items-center gap-1 font-bold text-soluk">
            <MoreHorizontal className="size-5" />
          </summary>
          <form action={gunlukOneriKapat} className="absolute right-0 z-10 mt-1 rounded-xl border-2 border-cizgi bg-yuzey p-1 shadow-lg">
            <input type="hidden" name="taseron_id" value={o.taseron_id} />
            <button className="min-h-11 w-max rounded-lg px-3 text-left font-bold whitespace-nowrap active:bg-yuzey">
              Bu işi bitirdi — önerme
            </button>
          </form>
        </details>
      </div>
    </article>
  );
}
