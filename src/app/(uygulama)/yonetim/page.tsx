import { Building2, MapPin, Users } from "lucide-react";
import { merkezIste } from "@/lib/oturum";
import { BuyukBag, Sayfa } from "@/components/kabuk";

export default async function Yonetim() {
  await merkezIste();
  return (
    <Sayfa baslik="Yönetim">
      <div className="flex flex-col gap-3">
        <BuyukBag href="/yonetim/santiyeler"><MapPin className="size-7" /> Şantiyeler</BuyukBag>
        <BuyukBag href="/taseronlar"><Building2 className="size-7" /> Taşeronlar ve Yetkileri</BuyukBag>
        <BuyukBag href="/yonetim/kullanicilar"><Users className="size-7" /> Kullanıcılar ve Yetkileri</BuyukBag>
      </div>
      <div className="rounded-2xl bg-yuzey p-4 text-soluk">
        <p className="font-bold text-yazi">Kurulum sırası</p>
        <ol className="mt-2 list-decimal pl-5">
          <li>Şantiyeleri ekleyin.</li>
          <li>Taşeronları ve sözleşmelerini girin (sözleşme, taşeronu şantiyeye bağlar).</li>
          <li>Şef, satın almacı ve taşeronlara giriş hesabı açın.</li>
        </ol>
      </div>
    </Sayfa>
  );
}
