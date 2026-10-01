import Link from "next/link";
import { Check, Clock, History, Pencil, Users } from "lucide-react";
import type { Oturum } from "@/lib/oturum";
import { degistirebilir, duzeltebilir, kilitli, onayBekliyor, surumAdi, type Karar, type Zincir } from "@/lib/karar";
import { Etiket } from "@/components/kabuk";
import { Fotolar } from "@/components/fotolar";
import { SilDugmesi } from "@/components/sil-dugmesi";
import { OkudumDugmesi } from "./okudum";
import { kararSil } from "./eylemler";

const zaman = (t: string) =>
  new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" }).format(new Date(t));
const yerYazisi = (k: Karar) => [k.yer, k.daire && `Daire ${k.daire}`, k.mahal].filter(Boolean).join(" · ");

/**
 * Bir karar ve revizyonları tek kartta, zaman çizelgesi olarak: ilk karar
 * üstte, her revizyon altında, geçerli olan en altta. Hepsi açık; ilk neye
 * karar verildiği, sonra neye evrildiği kaydırarak okunur.
 */
export function KararKarti({ z, o, adresler }: { z: Zincir; o: Oturum; adresler: Record<string, string> }) {
  const k = z.son;
  const yer = yerYazisi(k);
  const bekliyor = onayBekliyor(o, k);
  const rev = z.surumler.length - 1;
  const islemler = [
    bekliyor && <OkudumDugmesi key="o" id={k.id} />,
    duzeltebilir(o, k) && (
      <Link key="d" href={`/karar/${k.id}/duzenle`} className="flex min-h-11 items-center gap-1.5 rounded-xl bg-vurgu px-3 font-bold text-black">
        <Pencil className="size-5" /> Düzenle
      </Link>
    ),
    degistirebilir(o, k) && !duzeltebilir(o, k) && (
      <Link key="y" href={`/karar/yeni?onceki=${k.id}`} className="flex min-h-11 items-center gap-1.5 rounded-xl bg-koyu px-3 font-bold text-white">
        <History className="size-5" /> Rev. {rev + 1} Yap
      </Link>
    ),
    o.merkez && kilitli(k) && (
      <SilDugmesi
        key="s"
        id={k.id}
        eylem={kararSil}
        soru={rev ? `${surumAdi(rev)} silinsin mi? Önceki hâli yeniden geçerli olur. Geri alınamaz.` : "Bu karar okunmuş. Yine de silinsin mi? Geri alınamaz."}
        kucuk
      />
    ),
  ].filter(Boolean);

  return (
    <article className={`flex flex-col gap-3 rounded-2xl border-2 p-3 lg:p-4 ${bekliyor ? "border-yesil" : "border-cizgi"}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-lg font-extrabold">{yer || "Yer belirtilmedi"}</span>
        {k.konu && <Etiket sinif="bg-koyu text-white">{k.konu}</Etiket>}
        {rev > 0 && <Etiket sinif="bg-vurgu text-black">{rev} revizyon</Etiket>}
        {bekliyor && <Etiket sinif="bg-yesil text-white">Onayınızı bekliyor</Etiket>}
      </div>

      <ol className="flex flex-col">
        {z.surumler.map((s, i) => {
          const gecerli = i === z.surumler.length - 1;
          const farkliYer = yerYazisi(s);
          return (
            <li key={s.id} id={`k-${s.id}`} className="relative flex scroll-mt-20 gap-3 pb-4 last:pb-0">
              <div className="relative flex w-4 shrink-0 justify-center">
                {!gecerli && <span className="absolute top-3 -bottom-6 w-1 rounded bg-cizgi" />}
                <span className={`relative mt-1.5 size-4 rounded-full ring-4 ring-zemin ${gecerli ? "bg-yesil" : "bg-gri"}`} />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-2 lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-x-6">
                <div className="flex min-w-0 flex-col gap-1.5">
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className={`rounded-lg px-2 py-0.5 font-extrabold ${gecerli ? "bg-yesil text-white" : "bg-gri-acik"}`}>{surumAdi(i)}</span>
                    <span className="text-sm text-soluk">
                      {zaman(s.olusturma)}
                      {s.profiller ? ` · ${s.profiller.ad_soyad}` : ""}
                    </span>
                    {gecerli && rev > 0 && <span className="text-sm font-bold text-yesil">Geçerli</span>}
                    {s.duzenleme && <Etiket sinif="bg-yuzey text-soluk border border-cizgi">düzenlendi</Etiket>}
                  </p>
                  {farkliYer && farkliYer !== yer && <p className="text-sm font-semibold text-soluk">{farkliYer}</p>}
                  <p className={`text-lg leading-snug whitespace-pre-line break-words ${gecerli ? "font-semibold" : "text-soluk"}`}>{s.karar}</p>
                  <Muhataplar k={s} gecerli={gecerli} />
                </div>
                <Fotolar yollar={s.fotograflar} adresler={adresler} boyut="size-20" />
              </div>
            </li>
          );
        })}
      </ol>

      {islemler.length > 0 && <div className="flex flex-wrap gap-2 border-t-2 border-cizgi pt-2">{islemler}</div>}
    </article>
  );
}

function Muhataplar({ k, gecerli }: { k: Karar; gecerli: boolean }) {
  if (!k.karar_muhataplari.length && !k.dis_katilimcilar.length) return null;
  return (
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
          {!m.okundu && (gecerli ? " · bekliyor" : " · okumadı")}
        </span>
      ))}
      {k.dis_katilimcilar.map((d) => (
        <span key={d} className="rounded-lg bg-gri-acik px-2 py-0.5 text-sm font-bold">
          {d}
        </span>
      ))}
    </div>
  );
}
