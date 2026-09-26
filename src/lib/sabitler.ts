export type Rol = "merkez" | "personel" | "sef" | "satinalma" | "taseron";

export const ROL_ADI: Record<Rol, string> = {
  merkez: "Merkez (Yönetici)",
  personel: "Merkez Personeli",
  sef: "Şantiye Şefi / Kalfa",
  satinalma: "Satın Alma",
  taseron: "Taşeron",
};

export const SAYFALAR = [
  { kod: "gunluk", ad: "Şantiye Günlüğü" },
  { kod: "hatali", ad: "Eksik / Hatalı İşler" },
  { kod: "talep", ad: "Talep / Tedarik" },
  { kod: "teslimat", ad: "Teslimat Takvimi" },
  { kod: "sozlesme", ad: "Sözleşme Bilgisi" },
  { kod: "taseronlar", ad: "Taşeronlar" },
] as const;
export type Sayfa = (typeof SAYFALAR)[number]["kod"];

/** Veritabanındaki varsayilan_yetki işlevinin aynısı; ekranda gösterim için. */
export function varsayilanYetki(rol: Rol, sayfa: Sayfa, duzen: boolean): boolean {
  switch (rol) {
    case "merkez":
    case "personel":
      return true;
    case "sef":
      return sayfa === "sozlesme" || sayfa === "taseronlar" ? !duzen : true;
    case "satinalma":
      return sayfa === "talep" || sayfa === "teslimat" ? true : !duzen;
    case "taseron":
      if (sayfa === "taseronlar") return false;
      if (sayfa === "gunluk" || sayfa === "sozlesme") return !duzen;
      return true;
  }
}

/** Taşeronun iş türü ve günlükte seçilecek iş kalemleri. */
export const IS_TURLERI: Record<string, string[]> = {
  "Kalıp": ["Tabliye", "Kolon", "Perde", "Kiriş", "Merdiven", "Söküm"],
  "Demir": ["Tabliye", "Kolon", "Perde", "Kiriş", "Temel", "Merdiven"],
  "Beton": ["Tabliye", "Kolon", "Perde", "Temel", "Şap"],
  "Duvar": ["Tuğla", "Bims", "Gazbeton", "Bölme"],
  "Sıva": ["İç sıva", "Dış sıva", "Kaba sıva", "Saten"],
  "Alçı": ["Alçı sıva", "Alçıpan", "Asma tavan", "Kartonpiyer"],
  "Alçıpan": ["Bölme duvar", "Asma tavan", "Duvar kaplama", "Derz"],
  "Boya": ["Astar", "İç boya", "Dış boya", "Rötuş"],
  "Seramik": ["Zemin", "Duvar", "Islak hacim", "Balkon"],
  "Mermer": ["Merdiven", "Denizlik", "Tezgah", "Zemin", "Cephe"],
  "Elektrik": ["Boru", "Kablo çekimi", "Pano", "Anahtar-priz", "Aydınlatma", "Zayıf akım"],
  "Sıhhi Tesisat": ["Pis su", "Temiz su", "Vitrifiye", "Test"],
  "Mekanik": ["Isıtma", "Doğalgaz", "Havalandırma", "Yangın"],
  "Yalıtım": ["Temel", "Çatı", "Mantolama", "Islak hacim", "Ses"],
  "Çatı": ["Karkas", "Kaplama", "Oluk", "Yalıtım"],
  "Doğrama": ["Pencere", "Kapı", "Korkuluk", "Cam"],
  "Cephe": ["İskele", "Kaplama", "Mantolama", "Cam cephe"],
  "Hafriyat": ["Kazı", "Dolgu", "Nakliye", "İksa"],
  "Asansör": ["Montaj", "Ray", "Kabin", "Test"],
  "Peyzaj": ["Toprak", "Bitki", "Sulama", "Sert zemin"],
  "Diğer": [],
};
export const IS_TURU_LISTESI = Object.keys(IS_TURLERI);

export const BIRIMLER = ["Adet", "Kamyon", "Ton", "Kg", "m³", "m²", "m", "Torba", "Paket", "Palet", "Rulo", "Litre"];
export const ARACLAR = ["Kamyon", "Kamyonet", "Tır", "Mikser", "Pompa", "Vinç", "Panelvan", "Traktör"];

export const ONEM = {
  acil: { ad: "Acil", renk: "bg-kirmizi text-white", secili: "peer-checked:bg-kirmizi peer-checked:text-white" },
  normal: { ad: "Normal", renk: "bg-sari text-black", secili: "peer-checked:bg-sari peer-checked:text-black" },
  dusuk: { ad: "Düşük", renk: "bg-yesil text-white", secili: "peer-checked:bg-yesil peer-checked:text-white" },
} as const;
export type Onem = keyof typeof ONEM;

export const HATA_DURUM = {
  tespit: { ad: "Tespit Edildi", renk: "bg-kirmizi text-white" },
  duzeltiliyor: { ad: "Düzeltiliyor", renk: "bg-sari text-black" },
  onaylandi: { ad: "Onaylandı", renk: "bg-yesil text-white" },
} as const;
export type HataDurum = keyof typeof HATA_DURUM;

export const TALEP_DURUM = {
  acildi: { ad: "Talep Açıldı", renk: "bg-kirmizi text-white" },
  satin_alindi: { ad: "Satın Alındı", renk: "bg-sari text-black" },
  yolda: { ad: "Yolda", renk: "bg-mavi text-white" },
  teslim_alindi: { ad: "Teslim Alındı", renk: "bg-yesil text-white" },
  kapandi: { ad: "Kapandı", renk: "bg-gri text-white" },
} as const;
export type TalepDurum = keyof typeof TALEP_DURUM;
export const TALEP_SIRASI: TalepDurum[] = ["acildi", "satin_alindi", "yolda", "teslim_alindi", "kapandi"];

/** Kullanıcı adından giriş için kullanılan iç e-posta adresi. E-posta gönderilmez. */
export function girisEpostasi(kullaniciAdi: string) {
  return `${kullaniciAdi.trim().toLowerCase()}@giris.insaat-gunlukleri.local`;
}

export function katListesi(bodrum: number, katSayisi: number): string[] {
  const liste: string[] = [];
  for (let i = bodrum; i >= 1; i--) liste.push(`${i}. Bodrum`);
  liste.push("Zemin");
  for (let i = 1; i <= katSayisi; i++) liste.push(`${i}. Kat`);
  liste.push("Çatı", "Çevre");
  return liste;
}

/** Türkiye saatine göre bugünün tarihi (YYYY-MM-DD). */
export function bugun(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(new Date());
}

export function tarihYaz(t: string | null | undefined): string {
  if (!t) return "—";
  const d = new Date(t.length === 10 ? t + "T12:00:00" : t);
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Istanbul" }).format(d);
}

export function kisaTarih(t: string): string {
  const d = new Date(t + "T12:00:00");
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", weekday: "short", timeZone: "Europe/Istanbul" }).format(d);
}
