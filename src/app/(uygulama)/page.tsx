import Link from "next/link";
import { LogOut } from "lucide-react";
import { oturum } from "@/lib/oturum";
import { cikisYap } from "@/app/giris/eylem";
import { anaSayfaVerisi } from "./_ana-sayfa/veri";
import { BugunKarti } from "./_ana-sayfa/bugun-karti";
import { Grafit } from "./_ana-sayfa/grafit";
import { AnaEkranIpucu } from "@/components/ana-ekran-ipucu";
import { BildirimDavet } from "@/components/bildirim-davet";

/**
 * Ana sayfa tasarımı. İki tasarım hazır duruyor, aynı veriyi çizer:
 * "b" Bugün Kartı (varsayılan), "a" Grafit Başlık. Değiştirmek için bu satır
 * değişir; yayındaki sitede `?tasarim=a` ile öteki denenebilir.
 */
const TASARIM: "a" | "b" = "b";

export default async function AnaSayfa({ searchParams }: PageProps<"/">) {
  const o = await oturum();
  const { yetki: yetkiUyarisi, kayit, tasarim } = await searchParams;
  const v = await anaSayfaVerisi(o);
  const secilen = tasarim === "a" || tasarim === "b" ? tasarim : TASARIM;

  return (
    <div className="flex flex-1 flex-col bg-yuzey">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 pt-3 pb-16 lg:max-w-5xl lg:px-8 lg:pt-8">
        {yetkiUyarisi === "yok" && (
          <p className="rounded-xl bg-kirmizi px-4 py-3 font-semibold text-white">Bu sayfayı görme yetkiniz yok.</p>
        )}
        {kayit && <p className="rounded-xl bg-yesil px-4 py-3 text-lg font-bold text-white">✓ Kaydedildi</p>}
        <AnaEkranIpucu />
        <BildirimDavet />

        {!v.santiye && (
          <div className="rounded-2xl bg-zemin p-5 text-center">
            <p className="font-semibold">Henüz size bağlı bir şantiye yok.</p>
            {o.merkez ? (
              <Link href="/yonetim/santiyeler" className="mt-3 inline-block rounded-xl bg-vurgu px-5 py-3 font-bold text-black">
                Şantiye Ekle
              </Link>
            ) : (
              <p className="mt-1 text-soluk">Merkezin sizi bir şantiyeye eklemesi gerekiyor.</p>
            )}
          </div>
        )}

        {secilen === "a" ? <Grafit v={v} /> : <BugunKarti v={v} />}

        {/* Şantiye girişte seçilir; başka şantiyeye geçmek için çıkış yapılır. */}
        <form action={cikisYap} className="mt-2 lg:hidden">
          <button
            type="submit"
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl text-[15px] font-semibold text-soluk active:bg-gri-acik"
          >
            <LogOut className="size-5" />
            Çıkış{o.santiyeler.length > 1 ? " (şantiye değiştirmek için)" : ""}
          </button>
        </form>
      </div>
    </div>
  );
}
