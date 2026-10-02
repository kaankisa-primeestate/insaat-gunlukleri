import "server-only";
import webpush from "web-push";
import { supabaseYonetici } from "./supabase/server";
import type { Rol } from "./sabitler";

/** Bildirim türleri; kişi istediğini kapatır (bildirim_tercihleri.kapali). */
export const BILDIRIM_TURLERI = {
  hatali_yeni: "Yeni hatalı iş",
  hatali_gelisme: "Hatalı işte gelişme (revizyon, durum)",
  karar: "Karar Defteri (yeni karar, revizyon)",
  talep_yeni: "Yeni talep",
  talep_durum: "Talebin durumu değişti",
} as const;
export type BildirimTuru = keyof typeof BILDIRIM_TURLERI;

/**
 * Bildirim anahtarları (VAPID). İlk ihtiyaçta üretilip veritabanının gizli
 * ayar tablosuna yazılır; tarayıcıdan erişilemez, ortam değişkeni gerekmez.
 */
let anahtarlar: { publicKey: string; privateKey: string } | null = null;
export async function vapid() {
  if (anahtarlar) return anahtarlar;
  const db = supabaseYonetici();
  const oku = async () => {
    const { data, error } = await db.from("sistem_ayarlari").select("anahtar, deger").in("anahtar", ["vapid_public", "vapid_private"]);
    if (error) throw new Error("Bildirim anahtarları okunamadı: " + error.message);
    const m = new Map((data ?? []).map((x) => [x.anahtar, x.deger as string]));
    return m.get("vapid_public") && m.get("vapid_private") ? { publicKey: m.get("vapid_public")!, privateKey: m.get("vapid_private")! } : null;
  };
  let a = await oku();
  if (!a) {
    const yeni = webpush.generateVAPIDKeys();
    // Aynı anda iki istek üretirse ilk yazılan kalır.
    await db.from("sistem_ayarlari").upsert(
      [
        { anahtar: "vapid_public", deger: yeni.publicKey },
        { anahtar: "vapid_private", deger: yeni.privateKey },
      ],
      { onConflict: "anahtar", ignoreDuplicates: true },
    );
    a = await oku();
    if (!a) throw new Error("Bildirim anahtarları kaydedilemedi.");
  }
  anahtarlar = a;
  return a;
}

/** Türkiye saatine göre sessiz saatte mi (20–07 gibi gece yarısını aşan aralık dahil). */
function sessizMi(t: { sessiz: boolean; sessiz_bas: number; sessiz_bit: number } | undefined) {
  const tercih = t ?? { sessiz: true, sessiz_bas: 20, sessiz_bit: 7 };
  if (!tercih.sessiz) return false;
  const saat = Number(new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hour12: false, timeZone: "Europe/Istanbul" }).format(new Date()));
  const { sessiz_bas: b, sessiz_bit: s } = tercih;
  return b === s ? false : b < s ? saat >= b && saat < s : saat >= b || saat < s;
}

type Bildirim = {
  firmaId: string;
  tur: BildirimTuru;
  /** İşlemi yapan; kendi işleminin bildirimi ona gitmez. */
  yapan: string;
  kullanicilar?: (string | null | undefined)[];
  /** Bu taşeron firmalarının bütün hesapları. */
  taseronlar?: (string | null | undefined)[];
  roller?: Rol[];
  baslik: string;
  govde: string;
  url: string;
};

/**
 * Bildirim gönderir. Merkez her bildirimi alır; kişi kapattığı türü almaz;
 * sessiz saatte ses ve titreşim olmaz. Geçersizleşen abonelik silinir.
 * Hata kaydı bozmaz: bildirim gitmezse kayıt yine yerindedir.
 */
export async function bildir(b: Bildirim) {
  try {
    const db = supabaseYonetici();
    const kisiler = b.kullanicilar?.filter((x): x is string => Boolean(x)) ?? [];
    const firmalar = b.taseronlar?.filter((x): x is string => Boolean(x)) ?? [];
    // Alt taşeronun işi ana taşeronuna da gider.
    if (firmalar.length) {
      const { data: ust } = await db.from("taseronlar").select("ust_taseron_id").in("id", firmalar).not("ust_taseron_id", "is", null);
      for (const u of ust ?? []) if (!firmalar.includes(u.ust_taseron_id as string)) firmalar.push(u.ust_taseron_id as string);
    }
    const kosullar = ["rol.eq.merkez"];
    if (kisiler.length) kosullar.push(`id.in.(${kisiler.join(",")})`);
    if (firmalar.length) kosullar.push(`taseron_id.in.(${firmalar.join(",")})`);
    if (b.roller?.length) kosullar.push(`rol.in.(${b.roller.join(",")})`);
    const { data: alicilar } = await db.from("profiller").select("id").eq("firma_id", b.firmaId).eq("aktif", true).or(kosullar.join(","));
    const ids = (alicilar ?? []).map((a) => a.id as string).filter((id) => id !== b.yapan);
    if (!ids.length) return;

    const [{ data: tercihler }, { data: abonelikler }] = await Promise.all([
      db.from("bildirim_tercihleri").select("kullanici_id, kapali, sessiz, sessiz_bas, sessiz_bit").in("kullanici_id", ids),
      db.from("bildirim_abonelikleri").select("id, kullanici_id, endpoint, p256dh, auth").in("kullanici_id", ids),
    ]);
    if (!abonelikler?.length) return;
    const tercih = new Map((tercihler ?? []).map((t) => [t.kullanici_id as string, t]));
    const { publicKey, privateKey } = await vapid();
    webpush.setVapidDetails("mailto:bildirim@insaat-gunlukleri.local", publicKey, privateKey);

    await Promise.all(
      abonelikler.map(async (a) => {
        const t = tercih.get(a.kullanici_id);
        if ((t?.kapali as string[] | undefined)?.includes(b.tur)) return;
        const yuk = JSON.stringify({ baslik: b.baslik, govde: b.govde.slice(0, 180), url: b.url, etiket: b.tur + ":" + b.url, sessiz: sessizMi(t) });
        try {
          await webpush.sendNotification({ endpoint: a.endpoint, keys: { p256dh: a.p256dh, auth: a.auth } }, yuk, { TTL: 86400 });
        } catch (e) {
          const kod = (e as { statusCode?: number }).statusCode;
          if (kod === 404 || kod === 410) await db.from("bildirim_abonelikleri").delete().eq("id", a.id);
        }
      }),
    );
  } catch (e) {
    console.error("Bildirim gönderilemedi:", e);
  }
}

/** "Deneme bildirimi gönder": yalnız kişinin kendi telefonlarına. */
export async function denemeBildirimi(kullaniciId: string) {
  const db = supabaseYonetici();
  const { data } = await db.from("bildirim_abonelikleri").select("id, endpoint, p256dh, auth").eq("kullanici_id", kullaniciId);
  if (!data?.length) return 0;
  const { publicKey, privateKey } = await vapid();
  webpush.setVapidDetails("mailto:bildirim@insaat-gunlukleri.local", publicKey, privateKey);
  let giden = 0;
  for (const a of data) {
    try {
      await webpush.sendNotification(
        { endpoint: a.endpoint, keys: { p256dh: a.p256dh, auth: a.auth } },
        JSON.stringify({ baslik: "🔔 Deneme bildirimi", govde: "Bildirimler bu telefonda çalışıyor.", url: "/bildirimler", etiket: "deneme", sessiz: false }),
        { TTL: 600 },
      );
      giden++;
    } catch (e) {
      const kod = (e as { statusCode?: number }).statusCode;
      if (kod === 404 || kod === 410) await db.from("bildirim_abonelikleri").delete().eq("id", a.id);
    }
  }
  return giden;
}
