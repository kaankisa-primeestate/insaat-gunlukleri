/**
 * Çevrimdışı kuyruk (Y1): kayıt önce telefonun kalıcı hafızasına (IndexedDB)
 * yazılır, internet varken hemen, yokken bağlantı gelince sunucuya gider.
 * Fotoğraflar da gönderilene kadar telefonda bekler. Gönderilemeyen kayıt
 * kaybolmaz; "Bekleyenler"de sebebiyle durur.
 */
import { supabaseTarayici } from "./supabase/client";

export type KayitTuru = "gunluk" | "hatali" | "karar";

export const TUR_ADI: Record<KayitTuru, string> = { gunluk: "Günlük", hatali: "Hatalı iş", karar: "Karar" };

export type Bekleyen = {
  id: string;
  tur: KayitTuru;
  kullanici: string;
  santiye_id: string;
  santiye_ad: string;
  ozet: string;
  alanlar: [string, string][];
  zaman: string;
  hata?: string;
};

export type GonderimSonucu = { git: string } | { hata: string } | "ag";

const DB_ADI = "insaat-gunlukleri";
const OLAY = "cevrimdisi-kuyruk";

function ac(): Promise<IDBDatabase> {
  return new Promise((coz, red) => {
    const istek = indexedDB.open(DB_ADI, 1);
    istek.onupgradeneeded = () => {
      const db = istek.result;
      if (!db.objectStoreNames.contains("kuyruk")) db.createObjectStore("kuyruk", { keyPath: "id" });
      if (!db.objectStoreNames.contains("fotolar")) db.createObjectStore("fotolar", { keyPath: "yol" });
    };
    istek.onsuccess = () => coz(istek.result);
    istek.onerror = () => red(istek.error);
  });
}

async function islem<T>(depo: "kuyruk" | "fotolar", kip: IDBTransactionMode, is: (d: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await ac();
  return new Promise((coz, red) => {
    const tx = db.transaction(depo, kip);
    const istek = is(tx.objectStore(depo));
    tx.oncomplete = () => coz(istek.result);
    tx.onerror = () => red(tx.error);
  });
}

const haberVer = () => window.dispatchEvent(new Event(OLAY));

/** Kuyruk değişince (ekleme, gönderim, silme) çağrılır. */
export function kuyrukDinle(f: () => void) {
  window.addEventListener(OLAY, f);
  return () => window.removeEventListener(OLAY, f);
}

export async function bekleyenler(kullanici: string): Promise<Bekleyen[]> {
  const hepsi = await islem<Bekleyen[]>("kuyruk", "readonly", (d) => d.getAll());
  return hepsi.filter((b) => b.kullanici === kullanici).sort((a, b) => a.zaman.localeCompare(b.zaman));
}

export async function kuyrugaEkle(b: Bekleyen) {
  await islem("kuyruk", "readwrite", (d) => d.put(b));
  haberVer();
}

async function kuyruktanSil(b: Bekleyen) {
  await islem("kuyruk", "readwrite", (d) => d.delete(b.id));
  for (const [k, v] of b.alanlar) if (k === "fotograflar") await islem("fotolar", "readwrite", (d) => d.delete(v));
  haberVer();
}

/** Bekleyen kaydı vazgeçerek siler (sunucuya hiç gitmemiş kayıt). */
export const vazgec = kuyruktanSil;

/** İnternet yokken çekilen fotoğraf: kayıtla birlikte gönderilmek üzere telefonda. */
export async function fotoSakla(yol: string, blob: Blob) {
  await islem("fotolar", "readwrite", (d) => d.put({ yol, blob }));
}

/** Ağ hatası mı (internet yok, sunucuya ulaşılamadı)? */
export function agHatasi(e: unknown): boolean {
  if (typeof navigator !== "undefined" && !navigator.onLine) return true;
  const m = e instanceof Error ? e.message : String((e as { message?: string })?.message ?? e);
  return /fetch|network|load failed|internet/i.test(m);
}

/**
 * Bir kaydı gönderir: önce telefonda bekleyen fotoğrafları yükler, sonra
 * kaydı. Başarıda kuyruktan siler. Ağ yoksa "ag" döner, kayıt bekler. Sunucu
 * reddederse sebep kayda yazılır, kayıt bekler (Bekleyenler'de görünür).
 */
export async function gonder(b: Bekleyen): Promise<GonderimSonucu> {
  try {
    for (const [k, yol] of b.alanlar) {
      if (k !== "fotograflar") continue;
      const f = await islem<{ yol: string; blob: Blob } | undefined>("fotolar", "readonly", (d) => d.get(yol));
      if (!f) continue;
      const { error } = await supabaseTarayici().storage.from("dosyalar").upload(yol, f.blob, { contentType: "image/jpeg", upsert: false });
      // Önceki denemede yüklenmiş olabilir; "zaten var" başarıdır.
      if (error && !/exists|duplicate|409/i.test(error.message)) {
        if (agHatasi(error)) return "ag";
        throw new Error("Fotoğraf yüklenemedi: " + error.message);
      }
    }
    const yanit = await fetch("/api/senkron", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ tur: b.tur, santiye_id: b.santiye_id, alanlar: b.alanlar }),
    });
    if (yanit.redirected || !(yanit.headers.get("content-type") ?? "").includes("application/json")) {
      throw new Error("Oturum kapanmış; yeniden giriş yapın, kayıt sonra gönderilir.");
    }
    const s = (await yanit.json()) as { hata?: string; uyari?: string; git?: string };
    if (s.git) {
      await kuyruktanSil(b);
      return { git: s.git };
    }
    throw new Error(s.hata ?? s.uyari ?? "Kaydedilemedi.");
  } catch (e) {
    if (agHatasi(e)) return "ag";
    const hata = e instanceof Error ? e.message : String(e);
    await islem("kuyruk", "readwrite", (d) => d.put({ ...b, hata }));
    haberVer();
    return { hata };
  }
}

let gonderiliyor = false;

/** Kullanıcının bekleyen bütün kayıtlarını sırayla gönderir; ağ yoksa durur. */
export async function hepsiniGonder(kullanici: string, ilerleme?: (gonderilen: number, toplam: number) => void) {
  if (gonderiliyor) return { gonderilen: 0, hatali: 0 };
  gonderiliyor = true;
  let gonderilen = 0;
  let hatali = 0;
  try {
    const liste = (await bekleyenler(kullanici)).filter((b) => !b.hata);
    for (const b of liste) {
      ilerleme?.(gonderilen, liste.length);
      const s = await gonder(b);
      if (s === "ag") break;
      if ("git" in s) gonderilen++;
      else hatali++;
    }
  } finally {
    gonderiliyor = false;
  }
  return { gonderilen, hatali };
}
