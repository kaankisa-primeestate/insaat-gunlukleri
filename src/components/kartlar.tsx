import Link from "next/link";
import { CalendarClock, Users, Layers } from "lucide-react";
import { Etiket } from "./kabuk";
import { HATA_DURUM, ONEM, TALEP_DURUM, kisaTarih, type HataDurum, type Onem, type TalepDurum } from "@/lib/sabitler";

export type Gunluk = {
  id: string;
  is_tarihi: string;
  kisi_sayisi: number;
  kat: string | null;
  is_kalemi: string | null;
  notu: string | null;
  fotograflar: string[];
  olusturma: string;
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
};

export type Talep = {
  id: string;
  urun: string;
  miktar: number;
  birim: string;
  durum: TalepDurum;
  is_tarihi: string;
  taseronlar?: { firma_adi: string } | null;
};

/** Kayıt günüyle sunucuya giriş günü farklıysa "sonradan girildi" gösterilir. */
function sonradanMi(isTarihi: string, olusturma: string) {
  const giris = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(new Date(olusturma));
  return giris > isTarihi;
}

export function Fotolar({ yollar, adresler }: { yollar: string[]; adresler: Record<string, string> }) {
  if (!yollar.length) return null;
  return (
    <div className="flex gap-2 overflow-x-auto">
      {yollar.map((y) =>
        adresler[y] ? (
          <a key={y} href={adresler[y]} target="_blank" rel="noreferrer" className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={adresler[y]} alt="" loading="lazy" className="size-24 rounded-xl object-cover" />
          </a>
        ) : null,
      )}
    </div>
  );
}

export function GunlukKarti({ g, adresler, taseronGoster = true }: { g: Gunluk; adresler: Record<string, string>; taseronGoster?: boolean }) {
  return (
    <article className="flex flex-col gap-2 rounded-2xl border-2 border-cizgi p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-lg font-extrabold">{kisaTarih(g.is_tarihi)}</span>
        {taseronGoster && g.taseronlar && <span className="font-bold">· {g.taseronlar.firma_adi}</span>}
        {sonradanMi(g.is_tarihi, g.olusturma) && <Etiket sinif="bg-yuzey text-soluk border border-cizgi">sonradan girildi</Etiket>}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-base">
        <span className="flex items-center gap-1"><Users className="size-5" /> {g.kisi_sayisi} kişi</span>
        {g.kat && <span className="flex items-center gap-1"><Layers className="size-5" /> {g.kat}</span>}
        {g.is_kalemi && <span className="font-semibold">{g.is_kalemi}</span>}
      </div>
      {g.notu && <p className="text-soluk">{g.notu}</p>}
      <Fotolar yollar={g.fotograflar} adresler={adresler} />
      {g.profiller && (
        <p className="flex items-center gap-1 text-sm text-soluk">
          <CalendarClock className="size-4" /> {g.profiller.ad_soyad}
        </p>
      )}
    </article>
  );
}

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
          {taseronGoster && h.taseronlar ? ` · ${h.taseronlar.firma_adi}` : ""}
          {h.kat ? ` · ${h.kat}` : ""}
        </p>
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
          {taseronGoster && t.taseronlar ? ` · ${t.taseronlar.firma_adi} için` : ""}
        </p>
      </div>
      <Etiket sinif={TALEP_DURUM[t.durum].renk}>{TALEP_DURUM[t.durum].ad}</Etiket>
    </Link>
  );
}
