import { merkezIste } from "@/lib/oturum";
import { Sayfa, Etiket } from "@/components/kabuk";
import { santiyeGuncelle } from "../eylemler";
import { SantiyeFormu } from "./form";

export default async function Santiyeler() {
  const o = await merkezIste();
  const { data } = await o.supabase.from("santiyeler").select("id, ad, adres, bodrum_kat, kat_sayisi, aktif").order("ad");
  return (
    <Sayfa baslik="Şantiyeler" geri="/yonetim" geriAd="Yönetim">
      <ul className="flex flex-col gap-3">
        {(data ?? []).map((s) => (
          <li key={s.id} className="rounded-2xl border-2 border-cizgi p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-lg font-bold break-words">{s.ad}</p>
                {s.adres && <p className="text-soluk">{s.adres}</p>}
                <p className="text-sm text-soluk">
                  {s.bodrum_kat} bodrum + zemin + {s.kat_sayisi} kat
                </p>
              </div>
              {!s.aktif && <Etiket sinif="bg-gri text-white">Kapalı</Etiket>}
            </div>
            <form action={santiyeGuncelle} className="mt-3">
              <input type="hidden" name="id" value={s.id} />
              <input type="hidden" name="aktif" value={s.aktif ? "0" : "1"} />
              <button className="min-h-12 rounded-xl border-2 border-cizgi px-4 font-semibold">
                {s.aktif ? "Şantiyeyi kapat" : "Yeniden aç"}
              </button>
            </form>
          </li>
        ))}
      </ul>
      <h2 className="text-xl font-bold">Yeni şantiye</h2>
      <SantiyeFormu />
    </Sayfa>
  );
}
