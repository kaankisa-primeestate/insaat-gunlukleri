import { NextResponse } from "next/server";
import { oturumTemel } from "@/lib/oturum";
import { gunlukYaz } from "@/lib/kayit/gunluk";
import { hataYaz } from "@/lib/kayit/hatali";
import { kararYaz } from "@/lib/kayit/karar";
import type { Sonuc } from "@/lib/kayit/ortak";

const YAZICILAR = { gunluk: gunlukYaz, hatali: hataYaz, karar: kararYaz } as const;

/**
 * Çevrimdışı kuyruğun gönderimi: telefonda bekleyen kayıt, formun sunucu
 * eylemiyle aynı kuralla yazılır. Şantiye, kaydın girildiği şantiyedir
 * (o an seçili olan değil). Kimlik telefonda üretildiği için aynı kayıt iki
 * kez gelirse ikincisi yok sayılır.
 */
export async function POST(istek: Request) {
  let govde: { tur?: string; santiye_id?: string; alanlar?: [string, string][] };
  try {
    govde = await istek.json();
  } catch {
    return NextResponse.json({ hata: "Geçersiz istek." }, { status: 400 });
  }
  const yaz = YAZICILAR[govde.tur as keyof typeof YAZICILAR];
  if (!yaz || !Array.isArray(govde.alanlar)) return NextResponse.json({ hata: "Geçersiz istek." }, { status: 400 });

  const o = await oturumTemel();
  const santiye = o.santiyeler.find((s) => s.id === govde.santiye_id);
  if (!santiye) return NextResponse.json({ hata: "Bu şantiyeye erişiminiz yok ya da şantiye kapatılmış." });

  const form = new FormData();
  for (const [k, v] of govde.alanlar.slice(0, 500)) if (typeof k === "string" && typeof v === "string") form.append(k, v);
  // Düzeltme çevrimdışı yapılmaz; kuyruktan yalnız yeni kayıt gelir.
  form.delete("duzenle");

  let sonuc: Sonuc;
  try {
    sonuc = await yaz({ ...o, santiye }, form);
  } catch (e) {
    return NextResponse.json({ hata: "Sunucu hatası: " + (e instanceof Error ? e.message : String(e)) }, { status: 500 });
  }
  return NextResponse.json(sonuc);
}
