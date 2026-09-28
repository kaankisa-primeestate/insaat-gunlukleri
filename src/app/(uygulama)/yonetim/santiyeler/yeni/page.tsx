import { merkezIste } from "@/lib/oturum";
import { Sayfa } from "@/components/kabuk";
import { SantiyeTarifi } from "../tarif";

export default async function YeniSantiye() {
  await merkezIste();
  return (
    <Sayfa baslik="Yeni Şantiye" geri="/yonetim/santiyeler" geriAd="Vazgeç">
      <SantiyeTarifi />
    </Sayfa>
  );
}
