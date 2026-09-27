import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, Droplets, Sun, Wind, type LucideIcon } from "lucide-react";

export type Hava = {
  kod: number;
  en_yuksek: number | null;
  en_dusuk: number | null;
  yagis: number | null;
  ruzgar: number | null;
  sicaklik?: number | null;
};

/** WMO hava kodu → Türkçe ad ve simge. */
export function havaAdi(kod: number): { ad: string; Ikon: LucideIcon } {
  if (kod === 0) return { ad: "Açık", Ikon: Sun };
  if (kod <= 2) return { ad: "Parçalı bulutlu", Ikon: CloudSun };
  if (kod === 3) return { ad: "Kapalı", Ikon: Cloud };
  if (kod === 45 || kod === 48) return { ad: "Sisli", Ikon: CloudFog };
  if (kod >= 51 && kod <= 57) return { ad: "Çisenti", Ikon: CloudDrizzle };
  if ((kod >= 61 && kod <= 67) || (kod >= 80 && kod <= 82)) return { ad: "Yağmurlu", Ikon: CloudRain };
  if ((kod >= 71 && kod <= 77) || kod === 85 || kod === 86) return { ad: "Karlı", Ikon: CloudSnow };
  if (kod >= 95) return { ad: "Fırtınalı", Ikon: CloudLightning };
  return { ad: "Bulutlu", Ikon: Cloud };
}

const derece = (x: number | null | undefined) => (x == null ? "–" : `${Math.round(x)}°`);

/**
 * Sahayı etkileyen değerler öne çıkar: 1 mm ve üstü yağış, 40 km/s ve üstü
 * rüzgâr. Beton, iskele, vinç kararlarının dayanağı bunlar.
 */
export function HavaEtiketi({ h, sinif = "" }: { h: Hava; sinif?: string }) {
  const { ad, Ikon } = havaAdi(h.kod);
  const yagisli = (h.yagis ?? 0) >= 1;
  const ruzgarli = (h.ruzgar ?? 0) >= 40;
  return (
    <span className={`inline-flex flex-wrap items-center gap-x-2 gap-y-0.5 ${sinif}`} title={ad}>
      <span className="inline-flex items-center gap-1">
        <Ikon className="size-5" aria-hidden />
        <span className="sr-only">{ad}</span>
        {derece(h.en_yuksek)} / {derece(h.en_dusuk)}
      </span>
      {yagisli && (
        <span className="inline-flex items-center gap-0.5 font-bold text-mavi">
          <Droplets className="size-4" aria-hidden /> {Number(h.yagis).toLocaleString("tr-TR")} mm
        </span>
      )}
      {ruzgarli && (
        <span className="inline-flex items-center gap-0.5 font-bold text-kirmizi">
          <Wind className="size-4" aria-hidden /> {Math.round(h.ruzgar!)} km/s
        </span>
      )}
    </span>
  );
}
