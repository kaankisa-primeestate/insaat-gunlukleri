import { notFound } from "next/navigation";
import { merkezIste } from "@/lib/oturum";
import { ROL_ADI, type Rol } from "@/lib/sabitler";
import { Sayfa } from "@/components/kabuk";
import { YetkiMatrisi } from "@/components/yetki-matrisi";
import { kullaniciDurum, santiyeAta } from "../../eylemler";
import { SifreFormu } from "./sifre";
import { SecimPenceresi } from "@/components/secim-penceresi";

export default async function Kullanici({ params, searchParams }: PageProps<"/yonetim/kullanicilar/[id]">) {
  const o = await merkezIste();
  const { id } = await params;
  const { kayit } = await searchParams;
  const { data: k } = await o.supabase
    .from("profiller")
    .select("id, ad_soyad, kullanici_adi, telefon, rol, aktif, taseron_id, taseronlar(firma_adi)")
    .eq("id", id)
    .maybeSingle();
  if (!k) notFound();
  const rol = k.rol as Rol;

  const [{ data: atanan }, { data: yetkiler }] = await Promise.all([
    o.supabase.from("kullanici_santiye").select("santiye_id").eq("kullanici_id", id),
    o.supabase.from("yetkiler").select("sayfa, gorur, duzenler").eq("kullanici_id", id),
  ]);
  const atananlar = new Set((atanan ?? []).map((a) => a.santiye_id));
  const taseron = k.taseronlar as unknown as { firma_adi: string } | null;

  return (
    <Sayfa baslik={k.ad_soyad} geri="/yonetim/kullanicilar" geriAd="Kullanıcılar">
      {kayit && (
        <p className="rounded-xl bg-yesil px-4 py-3 font-bold text-white">
          ✓ Hesap oluşturuldu. Kullanıcı adı: {k.kullanici_adi}
        </p>
      )}
      <div className="rounded-2xl bg-yuzey p-4">
        <p>
          <b>Kullanıcı adı:</b> {k.kullanici_adi}
        </p>
        <p>
          <b>Rol:</b> {ROL_ADI[rol]}
          {taseron ? ` — ${taseron.firma_adi}` : ""}
        </p>
        {k.telefon && (
          <p>
            <b>Telefon:</b> <a href={`tel:${k.telefon}`} className="underline">{k.telefon}</a>
          </p>
        )}
      </div>

      {rol === "sef" && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-bold">Sorumlu olduğu şantiyeler</h2>
          <form action={santiyeAta} className="flex flex-col gap-2">
            <input type="hidden" name="id" value={k.id} />
            <SecimPenceresi
              ad="santiye"
              baslik="Sorumlu olduğu şantiyeler"
              coklu
              bosYazi="Şantiye seçmek için dokunun"
              varsayilan={[...atananlar]}
              secenekler={o.santiyeler.map((s) => ({ deger: s.id, ad: s.ad }))}
            />
            <button className="min-h-14 rounded-2xl bg-koyu text-lg font-bold text-white">Şantiyeleri Kaydet</button>
          </form>
        </section>
      )}

      {rol === "taseron" ? (
        <p className="rounded-2xl bg-yuzey p-4">
          Taşeron kullanıcılarının yetkileri taşeron firmasının <b>Yetki</b> sekmesinden verilir.
        </p>
      ) : (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-bold">Yetkiler</h2>
          <YetkiMatrisi rol={rol} mevcut={yetkiler ?? []} kullaniciId={k.id} />
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">Şifre değiştir</h2>
        <SifreFormu id={k.id} />
      </section>

      {k.id !== o.profil.id && (
        <form action={kullaniciDurum}>
          <input type="hidden" name="id" value={k.id} />
          <input type="hidden" name="aktif" value={k.aktif ? "0" : "1"} />
          <button className={`min-h-14 w-full rounded-2xl text-lg font-bold ${k.aktif ? "bg-kirmizi text-white" : "bg-yesil text-white"}`}>
            {k.aktif ? "Hesabı Kapat" : "Hesabı Yeniden Aç"}
          </button>
        </form>
      )}
    </Sayfa>
  );
}
