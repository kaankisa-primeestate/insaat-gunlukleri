import type { ReactNode } from "react";
import Link from "next/link";
import { CalendarClock, Clock, Users, Layers } from "lucide-react";
import { Etiket } from "./kabuk";
import { HATA_DURUM, ONEM, TALEP_DURUM, bugun, kisaTarih, type HataDurum, type Onem, type TalepDurum } from "@/lib/sabitler";

export type Gunluk = {
  id: string;
  is_tarihi: string;
  kisi_sayisi: number;
  katlar: string[];
  is_kalemleri: string[];
  notu: string | null;
  fotograflar: string[];
  olusturma: string;
  olusturan?: string;
  /** Doluysa kayıt girildikten sonra düzenlenmiştir. */
  guncelleme?: string | null;
  taseronlar?: { firma_adi: string } | null;
  profiller?: { ad_soyad: string } | null;
};

export type Hata = {
  id: string;
  is_tarihi: string;
  aciklama: string;
  kat: string | null;
  onem: Onem;
  durum: HataDurum;
  fotograflar: string[];
  taseronlar?: { firma_adi: string } | null;
  /** Hatalı iş bir kullanıcıya (kalfa, şef) yazıldıysa. */
  sorumlu?: { ad_soyad: string } | null;
  /** Son revizyon notu (sorgu yalnız sonuncuyu getirir). */
  hatali_notlar?: { sira: number; metin: string; olusturma: string }[];
};

export type Talep = {
  id: string;
  urun: string;
  miktar: number;
  birim: string;
  durum: TalepDurum;
  is_tarihi: string;
  taseronlar?: { firma_adi: string } | null;
  /** Listede olmayan, elle yazılmış "kimin için" adı. */
  taseron_adi?: string | null;
  termin?: string | null;
};

/** Termin etiketi: geçmiş/bugün kırmızı, yarın sarı, sonrası gri. Teslim alınmış talepte gösterilmez. */
function TerminEtiketi({ termin }: { termin: string }) {
  const b = bugun();
  const y = new Date(b + "T12:00:00");
  y.setDate(y.getDate() + 1);
  const yarin = y.toISOString().slice(0, 10);
  const [yazi, sinif] =
    termin < b ? [`Termin geçti · ${kisaTarih(termin)}`, "bg-kirmizi text-white"]
    : termin === b ? ["Bugün lazım", "bg-kirmizi text-white"]
    : termin === yarin ? ["Yarın lazım", "bg-sari text-black"]
    : [`${kisaTarih(termin)} lazım`, "bg-gri-acik text-yazi"];
  return (
    <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-sm font-bold ${sinif}`}>
      <Clock className="size-4" /> {yazi}
    </span>
  );
}

/** Kayıt günüyle sunucuya giriş günü farklıysa "sonradan girildi" gösterilir. */
function sonradanMi(isTarihi: string, olusturma: string) {
  const giris = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(new Date(olusturma));
  return giris > isTarihi;
}

export { Fotolar } from "./fotolar";
import { Fotolar } from "./fotolar";

export function GunlukKarti({
  g,
  adresler,
  taseronGoster = true,
  islemler,
}: {
  g: Gunluk;
  adresler: Record<string, string>;
  taseronGoster?: boolean;
  /** Düzenle / Sil düğmeleri (yetkisi olana). */
  islemler?: ReactNode;
}) {
  // Telefonda tek sütun. Bilgisayarda yazı soldan başlayıp kartın sağ
  // kenarına kadar akar (not uzun olunca boydan boya), fotoğraf sağda durur,
  // düğmeler en altta. Sol kutu telefonda "contents" olur, sıra değişmez.
  const giren = g.profiller && (
    <>
      <CalendarClock className="size-4" /> {g.profiller.ad_soyad}
    </>
  );
  return (
    <article className="flex flex-col gap-2 rounded-2xl border-2 border-cizgi p-3 lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-x-6 lg:gap-y-3 lg:p-4">
      <div className="contents lg:flex lg:min-w-0 lg:flex-col lg:gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-lg font-extrabold">{kisaTarih(g.is_tarihi)}</span>
          {taseronGoster && g.taseronlar && <span className="text-lg font-extrabold">· {g.taseronlar.firma_adi}</span>}
          {sonradanMi(g.is_tarihi, g.olusturma) && <Etiket sinif="bg-yuzey text-soluk border border-cizgi">sonradan girildi</Etiket>}
          {g.guncelleme && <Etiket sinif="bg-yuzey text-soluk border border-cizgi">düzenlendi</Etiket>}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-base">
          <span className="flex items-center gap-1"><Users className="size-5" /> {g.kisi_sayisi} kişi</span>
          {g.katlar.length > 0 && <span className="flex items-center gap-1"><Layers className="size-5" /> {g.katlar.join(", ")}</span>}
          {giren && <span className="hidden items-center gap-1 text-sm text-soluk lg:flex">{giren}</span>}
        </div>
        {g.is_kalemleri.length > 0 && <p className="font-semibold">{g.is_kalemleri.join(", ")}</p>}
        {g.notu && <p className="text-soluk">{g.notu}</p>}
      </div>
      <Fotolar yollar={g.fotograflar} adresler={adresler} />
      {giren && <p className="flex items-center gap-1 text-sm text-soluk lg:hidden">{giren}</p>}
      {islemler && <div className="flex flex-wrap gap-2 border-t-2 border-cizgi pt-2 lg:col-span-2">{islemler}</div>}
    </article>
  );
}

/** Zaman damgasının Türkiye saatine göre günü (YYYY-MM-DD). */
const gunu = (t: string) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(new Date(t));

export function HataKarti({ h, adresler, taseronGoster = true }: { h: Hata; adresler: Record<string, string>; taseronGoster?: boolean }) {
  return (
    <Link href={`/hatali/${h.id}`} className="flex gap-3 rounded-2xl border-2 border-cizgi p-3 active:bg-yuzey">
      {h.fotograflar[0] && adresler[h.fotograflar[0]] && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={adresler[h.fotograflar[0]]} alt="" loading="lazy" className="size-20 shrink-0 rounded-xl object-cover" />
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap gap-1">
          <Etiket sinif={ONEM[h.onem].renk}>{ONEM[h.onem].ad}</Etiket>
          <Etiket sinif={HATA_DURUM[h.durum].renk}>{HATA_DURUM[h.durum].ad}</Etiket>
        </div>
        <p className="font-bold break-words">{h.aciklama}</p>
        <p className="text-sm text-soluk">
          {kisaTarih(h.is_tarihi)}
          {taseronGoster && (h.taseronlar ?? h.sorumlu) ? ` · ${h.taseronlar?.firma_adi ?? h.sorumlu?.ad_soyad}` : ""}
          {h.kat ? ` · ${h.kat}` : ""}
        </p>
        {h.hatali_notlar?.[0] && (
          <p className="line-clamp-2 text-sm break-words">
            <b className="mr-1 rounded bg-koyu px-1.5 text-white">Rev. {h.hatali_notlar[0].sira}</b>
            <span className="text-soluk">{kisaTarih(gunu(h.hatali_notlar[0].olusturma))} · </span>
            {h.hatali_notlar[0].metin}
          </p>
        )}
      </div>
    </Link>
  );
}

export function TalepKarti({ t, taseronGoster = true }: { t: Talep; taseronGoster?: boolean }) {
  return (
    <Link href={`/talep/${t.id}`} className="flex items-center gap-3 rounded-2xl border-2 border-cizgi p-3 active:bg-yuzey">
      <div className="min-w-0 flex-1">
        <p className="text-lg font-bold break-words">
          {Number(t.miktar).toLocaleString("tr-TR")} {t.birim} {t.urun}
        </p>
        <p className="text-sm text-soluk">
          {kisaTarih(t.is_tarihi)}
          {taseronGoster && (t.taseronlar ?? t.taseron_adi) ? ` · ${t.taseronlar?.firma_adi ?? t.taseron_adi} için` : ""}
        </p>
        {t.termin && (t.durum === "acildi" || t.durum === "satin_alindi" || t.durum === "yolda") && <TerminEtiketi termin={t.termin} />}
      </div>
      <Etiket sinif={TALEP_DURUM[t.durum].renk}>{TALEP_DURUM[t.durum].ad}</Etiket>
    </Link>
  );
}

