import Link from "next/link";
import { CalendarClock, Check, Clock, History, Pencil, Users } from "lucide-react";
import type { Oturum } from "@/lib/oturum";
import { kisaTarih } from "@/lib/sabitler";
import { degistirebilir, duzeltebilir, kilitli, onayBekliyor, type Karar } from "@/lib/karar";
import { Etiket } from "@/components/kabuk";
import { Fotolar } from "@/components/fotolar";
import { SilDugmesi } from "@/components/sil-dugmesi";
import { OkudumDugmesi } from "./okudum";
import { kararSil } from "./eylemler";

/**
 * Karar kartı: günlük kartıyla aynı düzen. Telefonda tek sütun; bilgisayarda
 * yazı sağ kenara kadar akar, fotoğraf sağda, düğmeler altta.
 */
export function KararKarti({ k, o, adresler, yeniSurum }: { k: Karar; o: Oturum; adresler: Record<string, string>; yeniSurum?: Karar }) {
  const yer = [k.yer, k.daire && `Daire ${k.daire}`, k.mahal].filter(Boolean).join(" · ");
  const bekliyor = onayBekliyor(o, k);
  const kaydeden = k.profiller && (
    <>
      <CalendarClock className="size-4" /> {k.profiller.ad_soyad}
    </>
  );
  const islemler = [
    bekliyor && <OkudumDugmesi key="o" id={k.id} />,
    duzeltebilir(o, k) && (
      <Link key="d" href={`/karar/${k.id}/duzenle`} className="flex min-h-11 items-center gap-1.5 rounded-xl bg-vurgu px-3 font-bold text-black">
        <Pencil className="size-5" /> Düzenle
      </Link>
    ),
    degistirebilir(o, k) && !duzeltebilir(o, k) && (
      <Link key="y" href={`/karar/yeni?onceki=${k.id}`} className="flex min-h-11 items-center gap-1.5 rounded-xl border-2 border-yazi px-3 font-bold">
        <History className="size-5" /> Kararı değiştir
      </Link>
    ),
    o.merkez && kilitli(k) && <SilDugmesi key="s" id={k.id} eylem={kararSil} soru="Bu karar okunmuş. Yine de silinsin mi? Geri alınamaz." kucuk />,
  ].filter(Boolean);

  return (
    <article
      id={`k-${k.id}`}
      className={`flex scroll-mt-20 flex-col gap-2 rounded-2xl border-2 p-3 lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-x-6 lg:gap-y-3 lg:p-4 ${
        bekliyor ? "border-yesil" : "border-cizgi"
      } ${k.degisti ? "bg-yuzey" : ""}`}
    >
      <div className="contents lg:flex lg:min-w-0 lg:flex-col lg:gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {/* Tarih ve yer tek yazı: uzun yer alt satıra kelime kelime akar. */}
          <span className="text-lg font-extrabold">
            {kisaTarih(k.is_tarihi)}
            {yer && ` · ${yer}`}
          </span>
          {k.degisti && (
            <Etiket sinif="bg-gri text-white">
              Değişti{yeniSurum ? ` → ${kisaTarih(yeniSurum.is_tarihi)}` : ""}
            </Etiket>
          )}
          {k.duzenleme && <Etiket sinif="bg-yuzey text-soluk border border-cizgi">düzenlendi</Etiket>}
          {bekliyor && <Etiket sinif="bg-yesil text-white">Onayınızı bekliyor</Etiket>}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {k.konu && <Etiket sinif="bg-koyu text-white">{k.konu}</Etiket>}
          {kaydeden && <span className="hidden items-center gap-1 text-sm text-soluk lg:flex">{kaydeden}</span>}
        </div>
        <p className={`text-lg leading-snug font-semibold whitespace-pre-line ${k.degisti ? "line-through decoration-2" : ""}`}>{k.karar}</p>
        {(k.karar_muhataplari.length > 0 || k.dis_katilimcilar.length > 0) && (
          <div className="flex flex-wrap items-center gap-1.5">
            <Users className="size-5 text-soluk" aria-label="Kiminle" />
            {k.karar_muhataplari.map((m) => (
              <span
                key={m.id}
                title={m.okundu ? `${m.okuyan_kisi?.ad_soyad ?? ""} okudu` : "Okumadı"}
                className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-sm font-bold ${
                  m.okundu ? "bg-yesil-acik text-yesil" : "border border-cizgi bg-zemin text-soluk"
                }`}
              >
                {m.okundu ? <Check className="size-4" strokeWidth={3} /> : <Clock className="size-4" />}
                {m.taseronlar?.firma_adi ?? m.kisi?.ad_soyad}
                {!m.okundu && (k.degisti ? " · okumadı" : " · bekliyor")}
              </span>
            ))}
            {k.dis_katilimcilar.map((d) => (
              <span key={d} className="rounded-lg bg-gri-acik px-2 py-0.5 text-sm font-bold">
                {d}
              </span>
            ))}
          </div>
        )}
        {k.onceki_id && (
          <Link href={`/karar?gecmis=1#k-${k.onceki_id}`} className="text-sm font-semibold text-mavi underline">
            Bu karar öncekinin yerine yazıldı, eskisini gör
          </Link>
        )}
        {k.degisti && yeniSurum && (
          <Link href={`#k-${yeniSurum.id}`} className="text-sm font-semibold text-mavi underline">
            Geçerli kararı gör
          </Link>
        )}
      </div>
      <Fotolar yollar={k.fotograflar} adresler={adresler} />
      {kaydeden && <p className="flex items-center gap-1 text-sm text-soluk lg:hidden">{kaydeden}</p>}
      {islemler.length > 0 && <div className="flex flex-wrap gap-2 border-t-2 border-cizgi pt-2 lg:col-span-2">{islemler}</div>}
    </article>
  );
}
