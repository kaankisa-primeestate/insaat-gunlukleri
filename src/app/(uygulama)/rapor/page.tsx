import Link from "next/link";
import { AlertTriangle, Camera, ClipboardList, UserX } from "lucide-react";
import { yetkiIste } from "@/lib/oturum";
import { Bos, Etiket, Sayfa } from "@/components/kabuk";
import { bugun, goreliTarih, kisaTarih } from "@/lib/sabitler";

type GunlukSatir = {
  id: string;
  is_tarihi: string;
  taseron_id: string;
  kisi_sayisi: number;
  katlar: string[];
  is_kalemleri: string[];
  notu: string | null;
  gelmedi: boolean;
  devam: boolean;
  fotograflar: string[];
  taseronlar: { firma_adi: string } | null;
};

type TasOzet = {
  taseronId: string;
  firmaAdi: string;
  gunler: GunlukSatir[];
  calisilanGun: number;
  gelmediGun: number;
  kisiGun: number;
  katlar: string[];
  isKalemleri: string[];
  fotoSayisi: number;
  sonKayit: GunlukSatir;
};

function fmtIst(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(d);
}

/** Verilen tarihin içinde bulunduğu haftanın Pazartesi'si. */
function haftaBaslangici(tarih: string): string {
  const d = new Date(tarih + "T12:00:00");
  const gun = d.getDay(); // 0=Pazar..6=Cmt
  d.setDate(d.getDate() - (gun === 0 ? 6 : gun - 1));
  return fmtIst(d);
}

/** Seçilen döneme göre [başlangıç, bugün] aralığı. */
function donemAraligi(donem: "hafta" | "ay", bugunTarih: string): { bas: string; bit: string } {
  if (donem === "ay") {
    const d = new Date(bugunTarih + "T12:00:00");
    return { bas: fmtIst(new Date(d.getFullYear(), d.getMonth(), 1, 12)), bit: bugunTarih };
  }
  return { bas: haftaBaslangici(bugunTarih), bit: bugunTarih };
}

/** Pazartesi'den bugüne kadar olan haftanın 7 günü (gelecek günler de dahil, grafik için). */
function haftaGunleri(bugunTarih: string): string[] {
  const bas = new Date(haftaBaslangici(bugunTarih) + "T12:00:00");
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(bas);
    d.setDate(bas.getDate() + i);
    return fmtIst(d);
  });
}

export default async function Rapor({ searchParams }: PageProps<"/rapor">) {
  const o = await yetkiIste("gunluk");
  if (!o.santiye) return <Sayfa baslik="Rapor"><Bos>Şantiye seçili değil.</Bos></Sayfa>;
  if (o.taseron) return <Sayfa baslik="Rapor"><Bos>Bu sayfa şantiye ofisi içindir.</Bos></Sayfa>;

  const sp = await searchParams;
  const donem = sp.donem === "ay" ? "ay" : "hafta";
  const bugunTarih = bugun();
  const { bas, bit } = donemAraligi(donem, bugunTarih);
  const gunler7 = haftaGunleri(bugunTarih);
  const haftaBas = gunler7[0];

  const [{ data: donemVerisi }, haftaSonucu, hataSonucu, talepSonucu] = await Promise.all([
    o.supabase
      .from("gunlukler")
      .select("id, is_tarihi, taseron_id, kisi_sayisi, katlar, is_kalemleri, notu, gelmedi, devam, fotograflar, taseronlar(firma_adi)")
      .eq("santiye_id", o.santiye.id)
      .gte("is_tarihi", bas)
      .lte("is_tarihi", bit)
      .order("is_tarihi", { ascending: false }),
    donem === "hafta"
      ? null
      : o.supabase
          .from("gunlukler")
          .select("is_tarihi, kisi_sayisi")
          .eq("santiye_id", o.santiye.id)
          .gte("is_tarihi", haftaBas)
          .lte("is_tarihi", bugunTarih),
    o.yetki("hatali")
      ? o.supabase.from("hatali_isler").select("onem").eq("santiye_id", o.santiye.id).neq("durum", "onaylandi")
      : null,
    o.yetki("talep")
      ? o.supabase.from("talepler").select("id").eq("santiye_id", o.santiye.id).not("durum", "in", "(teslim_alindi,kapandi)")
      : null,
  ]);

  const gunluk = (donemVerisi ?? []) as unknown as GunlukSatir[];
  const haftaVerisi = donem === "hafta" ? gunluk : ((haftaSonucu?.data ?? []) as { is_tarihi: string; kisi_sayisi: number }[]);

  // KPI'lar
  const toplamKisiGun = gunluk.reduce((a, g) => a + g.kisi_sayisi, 0);
  const aktifTaseronSayisi = new Set(gunluk.filter((g) => !g.gelmedi).map((g) => g.taseron_id)).size;
  const bugunGelmeyen = gunluk.filter((g) => g.is_tarihi === bugunTarih && g.gelmedi).length;
  const acikHata = hataSonucu?.data ?? [];
  const acilHata = acikHata.filter((h) => h.onem === "acil").length;
  const bekleyenTalep = talepSonucu?.data?.length ?? 0;

  // Haftalık kişi-gün grafiği
  const gunlukToplam = new Map<string, number>();
  for (const g of haftaVerisi) gunlukToplam.set(g.is_tarihi, (gunlukToplam.get(g.is_tarihi) ?? 0) + g.kisi_sayisi);
  const enYuksek = Math.max(1, ...gunler7.map((t) => gunlukToplam.get(t) ?? 0));

  // Taşeron bazlı özet
  const tasMap = new Map<string, TasOzet>();
  for (const g of gunluk) {
    let t = tasMap.get(g.taseron_id);
    if (!t) {
      t = {
        taseronId: g.taseron_id,
        firmaAdi: g.taseronlar?.firma_adi ?? "—",
        gunler: [],
        calisilanGun: 0,
        gelmediGun: 0,
        kisiGun: 0,
        katlar: [],
        isKalemleri: [],
        fotoSayisi: 0,
        sonKayit: g,
      };
      tasMap.set(g.taseron_id, t);
    }
    t.gunler.push(g);
    if (g.gelmedi) t.gelmediGun++;
    else {
      t.calisilanGun++;
      t.kisiGun += g.kisi_sayisi;
      t.fotoSayisi += g.fotograflar.length;
      for (const k of g.katlar) if (!t.katlar.includes(k)) t.katlar.push(k);
      for (const i of g.is_kalemleri) if (!t.isKalemleri.includes(i)) t.isKalemleri.push(i);
    }
    if (g.is_tarihi > t.sonKayit.is_tarihi) t.sonKayit = g;
  }
  const taseronlar = [...tasMap.values()].sort((a, b) => b.kisiGun - a.kisiGun);

  return (
    <Sayfa baslik="Rapor" geri="/" sag={<span className="font-bold text-soluk">{o.santiye.ad}</span>} genis>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-xl border-2 border-cizgi bg-zemin p-1">
          <Link
            href="/rapor?donem=hafta"
            className={`rounded-lg px-4 py-2 text-sm font-bold ${donem === "hafta" ? "bg-koyu text-white" : "text-soluk"}`}
          >
            Bu hafta
          </Link>
          <Link
            href="/rapor?donem=ay"
            className={`rounded-lg px-4 py-2 text-sm font-bold ${donem === "ay" ? "bg-koyu text-white" : "text-soluk"}`}
          >
            Bu ay
          </Link>
        </div>
        <p className="text-sm text-soluk">
          {kisaTarih(bas)} – {kisaTarih(bit)}
        </p>
      </div>

      {/* KPI şeridi */}
      <div className="mt-4 flex flex-wrap gap-3">
        <div className="min-w-36 flex-1 rounded-2xl border-2 border-cizgi bg-zemin p-4">
          <p className="text-2xl font-extrabold">{toplamKisiGun}</p>
          <p className="text-sm font-bold text-soluk">toplam kişi-gün</p>
        </div>
        <div className="min-w-36 flex-1 rounded-2xl border-2 border-cizgi bg-zemin p-4">
          <p className="text-2xl font-extrabold">{aktifTaseronSayisi}</p>
          <p className="text-sm font-bold text-soluk">aktif taşeron</p>
        </div>
        {o.yetki("hatali") && (
          <div className="min-w-36 flex-1 rounded-2xl border-2 border-kirmizi-acik bg-kirmizi-acik p-4">
            <p className="flex items-center gap-1.5 text-2xl font-extrabold text-kirmizi"><AlertTriangle className="size-5" /> {acikHata.length}</p>
            <p className="text-sm font-bold text-kirmizi">açık hatalı iş{acilHata > 0 ? ` · ${acilHata} acil` : ""}</p>
          </div>
        )}
        <div className="min-w-36 flex-1 rounded-2xl border-2 border-sari-acik bg-sari-acik p-4">
          <p className="flex items-center gap-1.5 text-2xl font-extrabold text-kahve"><UserX className="size-5" /> {bugunGelmeyen}</p>
          <p className="text-sm font-bold text-kahve">bugün gelmeyen taşeron</p>
        </div>
        {o.yetki("talep") && (
          <div className="min-w-36 flex-1 rounded-2xl border-2 border-cizgi bg-zemin p-4">
            <p className="flex items-center gap-1.5 text-2xl font-extrabold"><ClipboardList className="size-5" /> {bekleyenTalep}</p>
            <p className="text-sm font-bold text-soluk">teslim bekleyen talep</p>
          </div>
        )}
      </div>

      {/* Haftalık kişi-gün grafiği */}
      <div className="mt-4 rounded-2xl border-2 border-cizgi bg-zemin p-4">
        <p className="mb-3 text-sm font-extrabold">Bu hafta kişi-gün</p>
        <div className="flex items-end gap-3 overflow-x-auto" style={{ height: 96 }}>
          {gunler7.map((t) => {
            const deger = gunlukToplam.get(t) ?? 0;
            const gelecek = t > bugunTarih;
            return (
              <div key={t} className="flex flex-shrink-0 flex-col items-center gap-1.5">
                <span className="text-xs font-bold text-soluk">{deger > 0 ? deger : gelecek ? "" : "—"}</span>
                <div
                  className={`w-6 rounded-t ${t === bugunTarih ? "bg-vurgu" : gelecek ? "bg-cizgi" : "bg-koyu"}`}
                  style={{ height: Math.max(4, (deger / enYuksek) * 70) }}
                />
                <span className="text-xs text-soluk">{kisaTarih(t).split(" ")[2]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Taşeron bazlı özet */}
      <p className="mt-6 mb-2 text-sm font-extrabold">Taşeron özeti</p>
      {taseronlar.length === 0 && <Bos>Bu dönemde kayıt yok.</Bos>}
      <div className="flex flex-col gap-3">
        {taseronlar.map((t) => (
          <TaseronKarti key={t.taseronId} t={t} bugunTarih={bugunTarih} />
        ))}
      </div>
    </Sayfa>
  );
}

function TaseronKarti({ t, bugunTarih }: { t: TasOzet; bugunTarih: string }) {
  const bugunKaydi = t.sonKayit.is_tarihi === bugunTarih;
  return (
    <div className="rounded-2xl border-2 border-cizgi bg-zemin p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-lg font-extrabold">{t.firmaAdi}</p>
          <p className="text-sm text-soluk">
            {t.calisilanGun} gün çalıştı{t.gelmediGun > 0 ? ` · ${t.gelmediGun} gün gelmedi` : ""} · {t.kisiGun} kişi-gün · son kayıt: {goreliTarih(t.sonKayit.is_tarihi)}
          </p>
        </div>
        {bugunKaydi && t.sonKayit.gelmedi && <Etiket sinif="bg-kirmizi-acik text-kirmizi">bugün gelmedi</Etiket>}
        {bugunKaydi && !t.sonKayit.gelmedi && <Etiket sinif="bg-yesil-acik text-yesil">aktif</Etiket>}
      </div>
      {(t.katlar.length > 0 || t.isKalemleri.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {[...t.isKalemleri, ...t.katlar].slice(0, 6).map((x, i) => (
            <span key={i} className="rounded-full bg-yuzey px-2.5 py-1 text-xs font-bold text-soluk">{x}</span>
          ))}
          {t.isKalemleri.length + t.katlar.length > 6 && (
            <span className="rounded-full bg-yuzey px-2.5 py-1 text-xs font-bold text-soluk">+{t.isKalemleri.length + t.katlar.length - 6}</span>
          )}
        </div>
      )}
      {t.fotoSayisi > 0 && (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-soluk"><Camera className="size-4" /> {t.fotoSayisi} fotoğraf</p>
      )}
      <details className="mt-3">
        <summary className="cursor-pointer text-sm font-extrabold">▸ Gün gün dökümü</summary>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-bold text-soluk">
                <th className="py-1.5 pr-3">Tarih</th><th className="py-1.5 pr-3">Kişi</th><th className="py-1.5 pr-3">Kat</th><th className="py-1.5">Not</th>
              </tr>
            </thead>
            <tbody>
              {t.gunler.map((g) => (
                <tr key={g.id} className="border-t border-cizgi">
                  <td className="py-1.5 pr-3 whitespace-nowrap">{kisaTarih(g.is_tarihi)}</td>
                  <td className="py-1.5 pr-3">{g.gelmedi ? <span className="font-bold text-kirmizi">Gelmedi</span> : g.kisi_sayisi}</td>
                  <td className="py-1.5 pr-3">{g.katlar.join(", ") || "—"}</td>
                  <td className="py-1.5 text-soluk">{g.notu ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
