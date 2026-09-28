import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { merkezIste } from "@/lib/oturum";
import { alanOzeti, type SantiyeAlani } from "@/lib/yerler";
import { Sayfa, Etiket } from "@/components/kabuk";
import { santiyeGuncelle } from "../eylemler";
import { KonumAyarla } from "./konum";

export default async function Santiyeler({ searchParams }: PageProps<"/yonetim/santiyeler">) {
  const o = await merkezIste();
  const { kayit } = await searchParams;
  const [{ data }, { data: alanlar }] = await Promise.all([
    o.supabase.from("santiyeler").select("id, ad, adres, bodrum_kat, kat_sayisi, aktif, konum_adi, enlem").order("ad"),
    o.supabase.from("santiye_alanlari").select("santiye_id, tur, ad, bodrum, zemin, kat, cati").eq("aktif", true).order("sira"),
  ]);
  const tarif = new Map<string, SantiyeAlani[]>();
  for (const a of (alanlar ?? []) as (SantiyeAlani & { santiye_id: string })[]) tarif.set(a.santiye_id, [...(tarif.get(a.santiye_id) ?? []), a]);

  return (
    <Sayfa baslik="Şantiyeler" geri="/yonetim" geriAd="Yönetim">
      {kayit && (
        <p className="rounded-xl bg-yesil px-4 py-3 font-bold text-white">{kayit === "yeni" ? "✓ Şantiye oluşturuldu" : "✓ Şantiye güncellendi"}</p>
      )}
      <Link href="/yonetim/santiyeler/yeni" className="flex min-h-16 items-center justify-center gap-2 rounded-2xl bg-vurgu text-xl font-extrabold text-black lg:max-w-md">
        <Plus className="size-7" strokeWidth={3} /> Yeni Şantiye
      </Link>
      <ul className="flex flex-col gap-3">
        {(data ?? []).map((s) => {
          const t = tarif.get(s.id) ?? [];
          const bloklar = t.filter((a) => a.tur === "blok");
          const cevre = t.filter((a) => a.tur === "cevre");
          return (
            <li key={s.id} className="rounded-2xl border-2 border-cizgi p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-lg font-bold break-words">{s.ad}</p>
                  {s.adres && <p className="text-soluk">{s.adres}</p>}
                  {t.length ? (
                    <div className="mt-1 text-sm">
                      <p>
                        <b>{bloklar.length === 1 ? bloklar[0].ad : `${bloklar.length} blok`}</b>
                        <span className="text-soluk">
                          {" "}· {bloklar.length === 1 || bloklar.every((b) => alanOzeti(b) === alanOzeti(bloklar[0])) ? alanOzeti(bloklar[0]) : "farklı kat sayıları"}
                        </span>
                      </p>
                      {cevre.length > 0 && <p className="text-soluk">Çevre: {cevre.map((c) => c.ad).join(", ")}</p>}
                    </div>
                  ) : (
                    <p className="text-sm text-soluk">
                      {s.bodrum_kat} bodrum + zemin + {s.kat_sayisi} kat · <b className="text-kirmizi">bloklar tarif edilmedi</b>
                    </p>
                  )}
                </div>
                {!s.aktif && <Etiket sinif="bg-gri text-white">Kapalı</Etiket>}
              </div>
              <Link href={`/yonetim/santiyeler/${s.id}`} className="mt-3 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-koyu font-bold text-white lg:max-w-xs">
                <Pencil className="size-5" /> {t.length ? "Tarifi düzenle" : "Blok ve alanları tarif et"}
              </Link>
              <KonumAyarla id={s.id} mevcut={s.enlem != null ? (s.konum_adi ?? "Girildi") : null} />
              <form action={santiyeGuncelle} className="mt-3">
                <input type="hidden" name="id" value={s.id} />
                <input type="hidden" name="aktif" value={s.aktif ? "0" : "1"} />
                <button className="min-h-12 rounded-xl border-2 border-cizgi px-4 font-semibold">
                  {s.aktif ? "Şantiyeyi kapat" : "Yeniden aç"}
                </button>
              </form>
            </li>
          );
        })}
      </ul>
    </Sayfa>
  );
}
