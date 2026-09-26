import Link from "next/link";
import { ChevronRight, UserPlus } from "lucide-react";
import { merkezIste } from "@/lib/oturum";
import { ROL_ADI, type Rol } from "@/lib/sabitler";
import { BuyukBag, Etiket, Sayfa } from "@/components/kabuk";

export default async function Kullanicilar() {
  const o = await merkezIste();
  const { data } = await o.supabase
    .from("profiller")
    .select("id, ad_soyad, kullanici_adi, rol, aktif, taseronlar(firma_adi)")
    .order("rol")
    .order("ad_soyad");

  return (
    <Sayfa baslik="Kullanıcılar" geri="/yonetim" geriAd="Yönetim">
      <BuyukBag href="/yonetim/kullanicilar/yeni" sinif="bg-vurgu text-black">
        <UserPlus className="size-7" /> Yeni Kullanıcı
      </BuyukBag>
      <ul className="flex flex-col gap-2">
        {(data ?? []).map((k) => {
          const taseron = k.taseronlar as unknown as { firma_adi: string } | null;
          return (
            <li key={k.id}>
              <Link href={`/yonetim/kullanicilar/${k.id}`} className="flex items-center gap-3 rounded-2xl border-2 border-cizgi p-3 active:bg-yuzey">
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-bold">{k.ad_soyad}</p>
                  <p className="text-sm text-soluk">
                    {k.kullanici_adi} · {ROL_ADI[k.rol as Rol]}
                    {taseron ? ` · ${taseron.firma_adi}` : ""}
                  </p>
                </div>
                {!k.aktif && <Etiket sinif="bg-gri text-white">Pasif</Etiket>}
                <ChevronRight className="size-6 text-soluk" />
              </Link>
            </li>
          );
        })}
      </ul>
    </Sayfa>
  );
}
