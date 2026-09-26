"use client";

/**
 * Fotoğrafı tarayıcıda küçültür: uzun kenar en fazla 1280 piksel, JPEG
 * kalite 0.6. Telefon fotoğrafı 3-5 MB'tan ~150 KB'a iner; sahada zayıf
 * bağlantıda hızlı gider, ücretsiz depolama alanı geç dolar.
 */
export async function kucult(dosya: File, uzunKenar = 1280, kalite = 0.6): Promise<Blob> {
  if (!dosya.type.startsWith("image/")) throw new Error("Görsel değil");
  const bitmap = await createImageBitmap(dosya, { imageOrientation: "from-image" });
  const oran = Math.min(1, uzunKenar / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * oran);
  const h = Math.round(bitmap.height * oran);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Sıkıştırılamadı"))), "image/jpeg", kalite),
  );
}

/**
 * Ana sayfadaki kamera düğmesiyle çekilen fotoğraf, kayıt formu açılana
 * kadar burada bekler. Sayfa geçişi tarayıcı içinde olduğu için bellek korunur.
 */
let bekleyen: File[] = [];
export function fotoBirak(dosyalar: File[]) {
  bekleyen = dosyalar;
}
export function fotoAl(): File[] {
  const d = bekleyen;
  bekleyen = [];
  return d;
}
