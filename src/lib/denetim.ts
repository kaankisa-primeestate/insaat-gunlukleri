export function kullaniciAdiDenetle(k: string): string | null {
  if (!/^[a-z0-9][a-z0-9._-]{2,31}$/.test(k)) {
    return "Kullanıcı adı 3-32 karakter olmalı; yalnızca küçük harf (Türkçe karakter olmadan), rakam, nokta, tire.";
  }
  return null;
}

/** Formdan gelen metni kırpar ve uzunluğunu sınırlar; boşsa null. */
export function metin(form: FormData, ad: string, en = 300): string | null {
  const d = String(form.get(ad) ?? "").trim();
  return d ? d.slice(0, en) : null;
}

export function tarihMi(d: unknown): d is string {
  return typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d);
}

export function uuidMi(d: unknown): d is string {
  return typeof d === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(d);
}

/** Fotoğraf yolları yalnızca kullanıcının firma klasöründen kabul edilir. */
export function fotoYollari(form: FormData, firmaId: string, en = 6): string[] {
  return form
    .getAll("fotograflar")
    .map(String)
    .filter((y) => y.startsWith(firmaId + "/") && !y.includes(".."))
    .slice(0, en);
}

/**
 * Veritabanı hatasını kullanıcıya gösterilecek metne çevirir. Kendi
 * kurallarımızın (P0001) iletileri zaten Türkçe ve açıklayıcıdır.
 */
export function veritabaniHatasi(e: { code?: string; message: string }): string {
  if (e.code === "P0001") return e.message;
  if (e.code === "23505") return "Bu kayıt zaten var.";
  if (e.code === "42501") return "Bu işlem için yetkiniz yok.";
  return "Kaydedilemedi: " + e.message;
}
