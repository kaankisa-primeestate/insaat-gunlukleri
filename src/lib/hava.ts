import "server-only";
import { supabaseYonetici } from "./supabase/server";
import { bugun } from "./sabitler";

/**
 * Hava durumu: Open-Meteo (anahtarsız). Sağlayıcı yalnızca bu dosyada;
 * değişirse başka yer etkilenmez.
 *
 * Lisans: Open-Meteo'nun ücretsiz kullanımı ticari olmayan kullanım içindir.
 * Pilot için yeterli; program satılmadan önce ücretli pakete ya da ticari
 * kullanıma açık bir sağlayıcıya geçilmeli (ERTELENENLER).
 */
const ADRES = "https://api.open-meteo.com/v1/forecast";
const GUNLUK = "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max";

export type Konum = { enlem: number | null; boylam: number | null };
export type GunHavasi = { kod: number; en_yuksek: number | null; en_dusuk: number | null; yagis: number | null; ruzgar: number | null };
export type AnlikHava = GunHavasi & { sicaklik: number | null };

function konumVar(k: Konum): k is { enlem: number; boylam: number } {
  return k.enlem != null && k.boylam != null;
}

async function getir(url: string, saniyeSakla: number) {
  try {
    const cevap = await fetch(url, { next: { revalidate: saniyeSakla }, signal: AbortSignal.timeout(4000) });
    if (!cevap.ok) return null;
    return await cevap.json();
  } catch {
    // Hava servisi yavaş ya da kapalıysa sayfa beklemez, hava görünmez.
    return null;
  }
}

function gunOku(d: { daily?: Record<string, (number | null)[]> } | null): GunHavasi | null {
  const g = d?.daily;
  if (!g || g.weather_code?.[0] == null) return null;
  return {
    kod: g.weather_code[0]!,
    en_yuksek: g.temperature_2m_max?.[0] ?? null,
    en_dusuk: g.temperature_2m_min?.[0] ?? null,
    yagis: g.precipitation_sum?.[0] ?? null,
    ruzgar: g.wind_speed_10m_max?.[0] ?? null,
  };
}

/** Ana sayfa için şu anki hava ve bugünün en yüksek/en düşüğü (30 dk saklanır). */
export async function anlikHava(k: Konum): Promise<AnlikHava | null> {
  if (!konumVar(k)) return null;
  const d = await getir(
    `${ADRES}?latitude=${k.enlem}&longitude=${k.boylam}&current=temperature_2m,weather_code&daily=${GUNLUK}&timezone=Europe%2FIstanbul&forecast_days=1`,
    1800,
  );
  const gun = gunOku(d);
  if (!gun) return null;
  return { ...gun, kod: d.current?.weather_code ?? gun.kod, sicaklik: d.current?.temperature_2m ?? null };
}

/**
 * Şantiyenin verilen günlerdeki hava kaydını tamamlar: eksik günü ve henüz
 * kesinleşmemiş geçmiş günü Open-Meteo'dan alıp yazar. Kayıt ekranını
 * bekletmemek için `after()` içinden çağrılır. Open-Meteo geçmişte en çok
 * 92 günü verir; daha eskisi boş kalır.
 */
export async function havaTamamla(santiye: { id: string } & Konum, firmaId: string, tarihler: string[]) {
  if (!konumVar(santiye) || tarihler.length === 0) return;
  const yonetici = supabaseYonetici();
  const gun = bugun();
  const sinir = new Date(Date.now() - 90 * 864e5).toISOString().slice(0, 10);
  const istenen = [...new Set(tarihler)].filter((t) => t <= gun && t >= sinir).slice(0, 14);
  if (!istenen.length) return;

  const { data: mevcut } = await yonetici
    .from("hava_durumu")
    .select("tarih, kesin, guncelleme")
    .eq("santiye_id", santiye.id)
    .in("tarih", istenen);
  const durum = new Map((mevcut ?? []).map((m) => [m.tarih as string, m]));
  const eksik = istenen.filter((t) => {
    const m = durum.get(t);
    if (!m) return true;
    if (m.kesin) return false;
    // Bugünün tahmini saatte bir tazelenir; geçmiş gün kesinleşince bir kez daha alınır.
    return t < gun || Date.now() - new Date(m.guncelleme).getTime() > 3600e3;
  });

  for (const t of eksik) {
    const g = gunOku(
      await getir(
        `${ADRES}?latitude=${santiye.enlem}&longitude=${santiye.boylam}&daily=${GUNLUK}&timezone=Europe%2FIstanbul&start_date=${t}&end_date=${t}`,
        600,
      ),
    );
    if (!g) continue;
    await yonetici.from("hava_durumu").upsert({
      santiye_id: santiye.id,
      firma_id: firmaId,
      tarih: t,
      ...g,
      kesin: t < gun,
      guncelleme: new Date().toISOString(),
    });
  }
}

/** Konum arama (ilçe, şehir). Yönetim > Şantiyeler'de kullanılır. */
export async function konumAra(sorgu: string) {
  const d = await getir(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(sorgu)}&count=8&language=tr&countryCode=TR`,
    86400,
  );
  return ((d?.results ?? []) as { id: number; name: string; latitude: number; longitude: number; admin1?: string; admin2?: string }[]).map((r) => ({
    id: r.id,
    ad: [r.name, r.admin2?.replace(/ İlçesi$/, ""), r.admin1].filter((x, i, a) => x && a.indexOf(x) === i).join(", "),
    enlem: r.latitude,
    boylam: r.longitude,
  }));
}
