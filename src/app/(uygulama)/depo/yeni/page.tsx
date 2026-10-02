import { depoIste, yerSecenekleri } from "@/lib/depo-sunucu";
import { Sayfa } from "@/components/kabuk";
import { KalemFormu } from "./form";

export default async function YeniDepoKaydi() {
  const o = await depoIste(true);
  const yer = await yerSecenekleri(o);
  return (
    <Sayfa baslik="Depoya Kayıt" geri="/depo" geriAd="Vazgeç">
      <KalemFormu firmaId={o.firma.id} {...yer} />
    </Sayfa>
  );
}
