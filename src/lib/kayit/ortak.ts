import "server-only";
import { bugun } from "@/lib/sabitler";
import { tarihMi } from "@/lib/denetim";

/** Kayıt sonucu: hata / uyarı ya da başarıda gidilecek adres. */
export type Sonuc = { hata?: string; uyari?: string; tamam?: string; git?: string };

/**
 * Kaydın günü: telefonda girildiği gün ("kayit_gunu"). Çevrimdışı girilip
 * ertesi gün gönderilen kayıt girildiği günü taşır. Telefon saati bozuksa
 * diye ileri tarih ve 14 günden eski tarih kabul edilmez; o zaman bugün.
 */
export function kayitGunu(form: FormData): string {
  const g = form.get("kayit_gunu");
  const b = bugun();
  const sinir = new Date(b + "T12:00:00");
  sinir.setDate(sinir.getDate() - 14);
  return tarihMi(g) && g <= b && g >= sinir.toISOString().slice(0, 10) ? g : b;
}
