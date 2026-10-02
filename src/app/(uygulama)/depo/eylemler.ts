"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { oturum } from "@/lib/oturum";
import { BIRIMLER } from "@/lib/sabitler";
import { fotoYollari, metin, uuidMi, veritabaniHatasi } from "@/lib/denetim";
import { artikFotolariSil } from "@/lib/dosya";
import { HAREKETLER, type HareketKodu } from "@/lib/depo";
import type { FormDurumu } from "@/components/form";

async function yazabilir() {
  const o = await oturum();
  return !o.taseron && o.yetki("depo", true) ? o : null;
}

/** Yer: tanımlı depo ("yer" = kimlik), daha önce yazılmış yer ("ad:<yer>") ya da elle yazılan. */
function yerOku(form: FormData) {
  const secim = form.get("yer");
  if (uuidMi(secim)) return { depo_id: secim, yer_adi: null };
  const onceki = String(secim ?? "");
  const yazi = onceki.startsWith("ad:") ? onceki.slice(3).trim().slice(0, 80) : metin(form, "yer_adi", 80);
  return yazi && yazi.length >= 2 ? { depo_id: null, yer_adi: yazi } : null;
}

/** Yeni depo kaydı; formda "id" varsa var olan kaydın düzeltilmesi (iz bırakır). */
export async function kalemKaydet(_: FormDurumu, form: FormData): Promise<FormDurumu> {
  const o = await yazabilir();
  if (!o) return { hata: "Depo kaydı yetkiniz yok." };
  const id = form.get("id");
  const ad = metin(form, "ad", 80);
  const birim = String(form.get("birim") ?? "");
  if (!ad || ad.length < 2) return { hata: "Ne olduğunu yazın." };
  if (!BIRIMLER.includes(birim)) return { hata: "Birimi seçin." };
  const fotograflar = fotoYollari(form, o.firma.id);
  const alanlar = { ad, ozellik: metin(form, "ozellik", 300), birim, notu: metin(form, "notu", 300), fotograflar };

  if (uuidMi(id)) {
    // Miktar ve yer burada değişmez; onlar hareketle değişir. Düzeltme revizyon olarak yazılır.
    const { data: eski } = await o.supabase.from("depo_kalemleri").select("fotograflar").eq("id", id).maybeSingle();
    const { data, error } = await o.supabase.from("depo_kalemleri").update(alanlar).eq("id", id).select("id");
    if (error) return { hata: veritabaniHatasi(error) };
    if (!data?.length) return { hata: "Bu kaydı düzeltme yetkiniz yok." };
    await artikFotolariSil(eski?.fotograflar, fotograflar);
    revalidatePath("/depo");
    redirect(`/depo/${id}?duzeltildi=1`);
  }

  const miktar = Number(String(form.get("miktar") ?? "").replace(",", "."));
  const yer = yerOku(form);
  if (!(miktar >= 0 && miktar < 1e9)) return { hata: "Miktarı girin." };
  if (!yer) return { hata: "Nerede durduğunu yazın ya da seçin." };
  const yeniId = crypto.randomUUID();
  const { error } = await o.supabase
    .from("depo_kalemleri")
    .insert({ id: yeniId, firma_id: o.firma.id, ...alanlar, ...yer, depoda: Math.round(miktar * 100) / 100 });
  if (error) return { hata: veritabaniHatasi(error) };
  revalidatePath("/depo");
  redirect(`/depo/${yeniId}?kayit=1`);
}

/** Ver, geri al, kullanıldı, depoya ekle, yer değiştir, miktarı düzelt, elden çıktı / yeniden aç. */
export async function hareketKaydet(_: FormDurumu, form: FormData): Promise<FormDurumu> {
  const o = await yazabilir();
  if (!o) return { hata: "Depo kaydı yetkiniz yok." };
  const kalem = form.get("kalem");
  const tur = String(form.get("tur")) as HareketKodu;
  if (!uuidMi(kalem) || !(tur in HAREKETLER)) return { hata: "Geçersiz istek." };
  const miktar = Number(String(form.get("miktar") ?? "").replace(",", "."));
  const santiye = form.get("santiye");
  const yer = tur === "yer" ? yerOku(form) : null;
  if (tur === "yer" && !yer) return { hata: "Yeni yeri yazın ya da seçin." };

  const { data, error } = await o.supabase.rpc("depo_hareket", {
    p_kalem: kalem,
    p_tur: tur,
    p_miktar: Number.isFinite(miktar) ? miktar : null,
    p_kime: metin(form, "kime", 80),
    p_santiye: uuidMi(santiye) ? santiye : null,
    p_durum: metin(form, "durum", 40),
    p_notu: metin(form, "notu", 300),
    p_kaynak: form.get("kaynak") === "disari" ? "disari" : "depo",
    p_depo: yer?.depo_id ?? null,
    p_yer: yer?.yer_adi ?? null,
  });
  if (error) return { hata: veritabaniHatasi(error) };
  revalidatePath("/depo");
  revalidatePath(`/depo/${kalem}`);
  redirect(`/depo/${kalem}?rev=${data}#rev-${data}`);
}

/** Yeni depo tanımı; şirket tarafındaki herkes ekler. */
export async function depoEkle(_: FormDurumu, form: FormData): Promise<FormDurumu> {
  const o = await yazabilir();
  if (!o) return { hata: "Depo tanımlama yetkiniz yok." };
  const ad = metin(form, "ad", 60);
  if (!ad || ad.length < 2) return { hata: "Depo adını yazın." };
  const { error } = await o.supabase.from("depolar").insert({ firma_id: o.firma.id, ad });
  if (error) return { hata: error.code === "23505" ? "Bu adla bir depo zaten var." : veritabaniHatasi(error) };
  revalidatePath("/depo/depolar");
  return { tamam: `“${ad}” eklendi.` };
}

/** Depo silinmez; kullanılmayan depo pasife alınır, seçim listesinden çıkar. */
export async function depoDurum(_: FormDurumu, form: FormData): Promise<FormDurumu> {
  const o = await yazabilir();
  if (!o) return { hata: "Depo tanımlama yetkiniz yok." };
  const id = form.get("id");
  const aktif = form.get("aktif") === "1";
  if (!uuidMi(id)) return { hata: "Geçersiz istek." };
  const { data, error } = await o.supabase.from("depolar").update({ aktif }).eq("id", id).select("id");
  if (error) return { hata: veritabaniHatasi(error) };
  if (!data?.length) return { hata: "Değiştirilemedi." };
  revalidatePath("/depo/depolar");
  return { tamam: aktif ? "Depo yeniden kullanımda." : "Depo pasife alındı; içindeki kayıtlar yerinde durur." };
}
