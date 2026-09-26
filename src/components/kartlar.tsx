import Link from "next/link";
import { CalendarClock, Users, Layers } from "lucide-react";
import { Etiket } from "./kabuk";
import { HATA_DURUM, ONEM, TALEP_DURUM, kisaTarih, type HataDurum, type Onem, type TalepDurum } from "@/lib/sabitler";

export type Gunluk = {
  id: string;
  is_tarihi: string;
  kisi_sayisi: number;
  katlar: string[];
  is_kalemleri: string[];
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
  /** Hatalı iş bir kullanıcıya (kalfa, şef) yazıldıysa. */
  sorumlu?: { ad_soyad: string } | null;
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

export { Fotolar } from "./fotolar";
import { Fotolar } from "./fotolar";

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
        {g.katlar.length > 0 && <span className="flex items-center gap-1"><Layers className="size-5" /> {g.katlar.join(", ")}</span>}
        {g.is_kalemleri.length > 0 && <span className="font-semibold">{g.is_kalemleri.join(", ")}</span>}
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
          {taseronGoster && (h.taseronlar ?? h.sorumlu) ? ` · ${h.taseronlar?.firma_adi ?? h.sorumlu?.ad_soyad}` : ""}
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

/** Bilgisayar ekranı için günlük tablosu: bir satır bir kayıt. */
export function GunlukTablosu({ liste, adresler }: { liste: Gunluk[]; adresler: Record<string, string> }) {
  return (
    <div className="overflow-x-auto rounded-2xl border-2 border-cizgi">
      <table className="w-full text-left text-base">
        <thead className="bg-koyu text-sm text-white">
          <tr>
            {["Tarih", "Taşeron", "Kişi", "Kat", "Yapılan iş", "Not", "Fotoğraf", "Giren"].map((b) => (
              <th key={b} className="px-3 py-2 font-bold whitespace-nowrap">{b}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {liste.map((g) => (
            <tr key={g.id} className="border-t-2 border-cizgi align-top even:bg-yuzey">
              <td className="px-3 py-2 font-bold whitespace-nowrap">
                {kisaTarih(g.is_tarihi)}
                {sonradanMi(g.is_tarihi, g.olusturma) && <span className="block text-xs font-semibold text-soluk">sonradan girildi</span>}
              </td>
              <td className="px-3 py-2 font-semibold">{g.taseronlar?.firma_adi}</td>
              <td className="px-3 py-2 text-center">{g.kisi_sayisi}</td>
              <td className="px-3 py-2">{g.katlar.join(", ")}</td>
              <td className="px-3 py-2">{g.is_kalemleri.join(", ")}</td>
              <td className="max-w-xs px-3 py-2 text-soluk">{g.notu}</td>
              <td className="px-3 py-2">
                <Fotolar yollar={g.fotograflar} adresler={adresler} boyut="size-12" />
              </td>
              <td className="px-3 py-2 text-sm whitespace-nowrap text-soluk">{g.profiller?.ad_soyad}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
