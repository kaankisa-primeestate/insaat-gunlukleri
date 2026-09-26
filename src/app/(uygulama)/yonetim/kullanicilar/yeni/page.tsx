import { merkezIste } from "@/lib/oturum";
import { Sayfa } from "@/components/kabuk";
import { KullaniciFormu } from "./form";

export default async function YeniKullanici({ searchParams }: PageProps<"/yonetim/kullanicilar/yeni">) {
  const o = await merkezIste();
  const { taseron } = await searchParams;
  const { data: taseronlar } = await o.supabase.from("taseronlar").select("id, firma_adi, ust_taseron_id").eq("aktif", true).order("firma_adi");
  const secili = typeof taseron === "string" ? taseron : undefined;
  return (
    <Sayfa
      baslik="Yeni Kullanıcı"
      geri={secili ? `/taseronlar/${secili}?sekme=hesaplar` : "/yonetim/kullanicilar"}
      geriAd="Geri"
    >
      <KullaniciFormu
        taseronlar={taseronlar ?? []}
        santiyeler={o.santiyeler.map((s) => ({ id: s.id, ad: s.ad }))}
        taseronId={secili}
      />
    </Sayfa>
  );
}
