import { oturum } from "@/lib/oturum";
import { Sayfa } from "@/components/kabuk";
import { BekleyenListesi } from "./liste";

/** Telefonda bekleyen (henüz gönderilmemiş) kayıtlar; internet yokken de açılır. */
export default async function Bekleyenler() {
  await oturum();
  return (
    <Sayfa baslik="Bekleyen Kayıtlar">
      <p className="text-soluk">
        İnternet yokken girilen kayıtlar bu telefonda bekler ve internet gelince kendiliğinden gönderilir. Burada yalnız sizin bu
        telefondaki kayıtlarınız görünür.
      </p>
      <BekleyenListesi />
    </Sayfa>
  );
}
