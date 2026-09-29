"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { oturum } from "@/lib/oturum";
import { IS_TURU_LISTESI, girisEpostasi } from "@/lib/sabitler";
import { kullaniciAdiDenetle, metin, tarihMi, uuidMi, veritabaniHatasi } from "@/lib/denetim";
import { supabaseYonetici } from "@/lib/supabase/server";
import type { FormDurumu } from "@/components/form";

type SozlesmeSatiri = { santiyeId: string; mevcut: string | null; kayit: Record<string, unknown> };

/** Formdaki bir şantiye bloğu (s.<kimlik>.alan) → sözleşme alanları ya da hata. */
function sozlesmeOku(form: FormData, santiyeId: string, santiyeAd: string, firmaId: string): Record<string, unknown> | string {
  const al = (x: string) => form.get(`s.${santiyeId}.${x}`);
  const tarif = metin(form, `s.${santiyeId}.tarif`, 500);
  if (!tarif || tarif.length < 2) return `${santiyeAd}: işin tarifini yazın.`;
  const tur = al("tur");
  const kayit: Record<string, unknown> = { is_tarifi: tarif, santiye_id: santiyeId };
  if (tur === "belirsiz") {
    const b = al("baslangic");
    Object.assign(kayit, { sure_belirsiz: true, baslangic: tarihMi(b) ? b : null, bitis: null, yer_teslim: null, sure_gun: null });
  } else if (tur === "sure") {
    const y = al("yer_teslim");
    const gun = Math.round(Number(al("sure_gun")));
    if (!tarihMi(y)) return `${santiyeAd}: yer teslim tarihi gerekli.`;
    if (!(gun >= 1 && gun <= 3650)) return `${santiyeAd}: süre 1 ile 3650 gün arasında olmalı.`;
    Object.assign(kayit, { sure_belirsiz: false, baslangic: y, bitis: null, yer_teslim: y, sure_gun: gun });
  } else {
    const b = al("baslangic");
    const bt = al("bitis");
    if (!tarihMi(bt)) return `${santiyeAd}: bitiş tarihi gerekli (belli değilse "Henüz belli değil"i seçin).`;
    if (tarihMi(b) && b > bt) return `${santiyeAd}: bitiş başlangıçtan önce olamaz.`;
    Object.assign(kayit, { sure_belirsiz: false, baslangic: tarihMi(b) ? b : null, bitis: bt, yer_teslim: null, sure_gun: null });
  }
  const belge = String(al("belge") ?? "");
  if (belge.startsWith(firmaId + "/") && !belge.includes("..")) kayit.belge_yolu = belge;
  if (al("belge_kaldir") === "1") kayit.belge_yolu = null;
  return kayit;
}

/**
 * Taşeron sayfasının tek kaydı: firma bilgileri, çalıştığı şantiyeler
 * (sözleşmeler) ve yeni taşeronda isteğe bağlı giriş hesabı. Önce her şey
 * denetlenir, sonra yazılır; yarım kayıt kalmaz. İşareti kaldırılan
 * şantiyenin sözleşmesi silinmez, "iş bitti" olur.
 */
export async function taseronKaydet(_: FormDurumu, form: FormData): Promise<FormDurumu> {
  const o = await oturum();
  const id = form.get("id");
  const duzenle = uuidMi(id);
  const firmaAdi = metin(form, "firma_adi", 120);
  const isTurleri = [...new Set(form.getAll("is_turleri").map(String))].filter((t) => IS_TURU_LISTESI.includes(t));
  if (!firmaAdi || firmaAdi.length < 2) return { hata: "Firma adı gerekli." };
  if (!isTurleri.length) return { hata: "Yaptığı en az bir işi seçin." };

  const iban = metin(form, "iban", 40)?.replace(/\s+/g, "").toUpperCase() ?? null;
  if (iban && !/^TR\d{24}$/.test(iban)) return { hata: "IBAN TR ile başlamalı ve 26 karakter olmalı." };

  // Yetkili satırları ad ve telefon olarak eşleşir; ikisi de boş satır atılır.
  const adlar = form.getAll("yetkili_ad").map((x) => String(x).trim().slice(0, 80));
  const teller = form.getAll("yetkili_tel").map((x) => String(x).trim().slice(0, 20));
  const yetkililer = adlar
    .map((ad, i) => ({ ad, telefon: teller[i] ?? "" }))
    .filter((y) => y.ad || y.telefon)
    .slice(0, 10);

  const kayit: Record<string, unknown> = {
    firma_adi: firmaAdi,
    yetkililer,
    vergi_no: metin(form, "vergi_no", 20),
    iban,
    is_turleri: isTurleri,
  };

  // Ana taşeron kendi alt taşeronunu açar: şantiye ve hesap bölümü yoktur,
  // alt taşeron ana taşeronun şantiyelerinde görünür.
  if (o.taseron) {
    if (duzenle) return { hata: "Taşeron bilgilerini merkez düzenler." };
    const yeniId = crypto.randomUUID();
    const { error } = await o.supabase
      .from("taseronlar")
      .insert({ ...kayit, ust_taseron_id: o.profil.taseron_id, id: yeniId, firma_id: o.firma.id });
    if (error) return { hata: veritabaniHatasi(error) };
    revalidatePath("/taseronlar");
    redirect(`/taseronlar/${yeniId}?kayit=1`);
  }

  if (!o.yetki("taseronlar", true)) return { hata: "Taşeron ekleme yetkiniz yok." };
  const ust = form.get("ust_taseron_id");
  kayit.ust_taseron_id = uuidMi(ust) && ust !== id ? ust : null;
  kayit.alt_taseron_yetkisi = form.get("alt_taseron_yetkisi") === "on";

  // Şantiyeler: işaretliler sözleşme olur; işareti kaldırılan "iş bitti".
  const mevcutlar = new Map<string, { id: string; tamamlandi: boolean }>();
  if (duzenle) {
    const { data } = await o.supabase.from("sozlesmeler").select("id, santiye_id, tamamlandi").eq("taseron_id", id);
    for (const s of data ?? []) mevcutlar.set(s.santiye_id as string, { id: s.id as string, tamamlandi: s.tamamlandi as boolean });
  }
  const yazilacak: SozlesmeSatiri[] = [];
  const kapanacak: string[] = [];
  for (const s of o.santiyeler) {
    const mevcut = mevcutlar.get(s.id) ?? null;
    if (form.get(`s.${s.id}.secili`) === "on") {
      const sonuc = sozlesmeOku(form, s.id, s.ad, o.firma.id);
      if (typeof sonuc === "string") return { hata: sonuc };
      yazilacak.push({ santiyeId: s.id, mevcut: mevcut?.id ?? null, kayit: { ...sonuc, tamamlandi: false } });
    } else if (mevcut && !mevcut.tamamlandi) {
      kapanacak.push(mevcut.id);
    }
  }
  // Alt taşeron ana taşeronun şantiyelerinde görünür; kendi sözleşmesi şart değil.
  if (!duzenle && !kayit.ust_taseron_id && !yazilacak.length) {
    return { hata: "Çalıştığı en az bir şantiyeyi işaretleyin; şantiyesi olmayan taşeron hiçbir listede görünmez." };
  }

  // Giriş hesabı (yalnız yeni taşeronda, isteğe bağlı): önce denetlenir.
  const hesapKullanici = String(form.get("hesap_kullanici") ?? "").trim().toLowerCase();
  const hesapSifre = String(form.get("hesap_sifre") ?? "");
  const hesapIstendi = !duzenle && o.merkez && (hesapKullanici || hesapSifre);
  const yonetici = hesapIstendi ? supabaseYonetici() : null;
  if (hesapIstendi) {
    const kHata = kullaniciAdiDenetle(hesapKullanici);
    if (kHata) return { hata: "Giriş hesabı: " + kHata };
    if (hesapSifre.length < 6) return { hata: "Giriş hesabı: şifre en az 6 karakter olmalı." };
    const { data: alinmis } = await yonetici!.from("profiller").select("id").eq("kullanici_adi", hesapKullanici).maybeSingle();
    if (alinmis) return { hata: "Giriş hesabı: bu kullanıcı adı alınmış, başka bir ad deneyin." };
  }

  const taseronId = duzenle ? (id as string) : crypto.randomUUID();

  // Aynı şantiyede aynı işi yapan başka taşeron: önce uyarılır (kesin yasak değil).
  if (form.get("onay") !== "1") {
    const uyarilar: string[] = [];
    for (const y of yazilacak.filter((x) => !x.mevcut || mevcutlar.get(x.santiyeId)?.tamamlandi)) {
      const cakisan = await ayniIsiYapanlar(o, isTurleri, kayit.ust_taseron_id as string | null, taseronId, y.santiyeId);
      const ad = o.santiyeler.find((s) => s.id === y.santiyeId)?.ad;
      if (cakisan.length) uyarilar.push(`${ad}: ${cakisan.join("; ")}`);
    }
    if (uyarilar.length) {
      return {
        uyari:
          `Aynı işi yapan başka taşeron var. ${uyarilar.join(" · ")}. Mükerrer kayıt olabilir. ` +
          "Eski taşeron işi bıraktıysa önce onun şantiyesindeki işareti kaldırın. Gerçekten ikinci bir firma çalışıyorsa \"Yine de kaydet\"e basın.",
      };
    }
  }

  if (duzenle) {
    // Satır dönmezse güncelleme yetki yüzünden yapılmamıştır; "kaydedildi" denmez.
    const { data, error } = await o.supabase.from("taseronlar").update(kayit).eq("id", taseronId).select("id");
    if (error) return { hata: veritabaniHatasi(error) };
    if (!data?.length) return { hata: "Bu taşeronu düzenleme yetkiniz yok." };
  } else {
    const { error } = await o.supabase.from("taseronlar").insert({ ...kayit, id: taseronId, firma_id: o.firma.id });
    if (error) return { hata: veritabaniHatasi(error) };
  }

  for (const y of yazilacak) {
    const { error } = y.mevcut
      ? await o.supabase.from("sozlesmeler").update(y.kayit).eq("id", y.mevcut)
      : await o.supabase.from("sozlesmeler").insert({ ...y.kayit, taseron_id: taseronId, firma_id: o.firma.id });
    if (error) return { hata: "Taşeron kaydedildi ama şantiye kaydedilemedi: " + veritabaniHatasi(error) };
  }
  if (kapanacak.length) await o.supabase.from("sozlesmeler").update({ tamamlandi: true }).in("id", kapanacak);

  let hesapNotu = "";
  if (hesapIstendi) {
    const { data: kul, error } = await yonetici!.auth.admin.createUser({
      email: girisEpostasi(hesapKullanici),
      password: hesapSifre,
      email_confirm: true,
    });
    if (error || !kul.user) {
      hesapNotu = "&hesap=hata";
    } else {
      const { error: pHata } = await yonetici!.from("profiller").insert({
        id: kul.user.id,
        firma_id: o.firma.id,
        kullanici_adi: hesapKullanici,
        ad_soyad: metin(form, "hesap_ad", 80) ?? (yetkililer[0]?.ad || firmaAdi),
        telefon: yetkililer[0]?.telefon || null,
        rol: "taseron",
        taseron_id: taseronId,
      });
      if (pHata) {
        await yonetici!.auth.admin.deleteUser(kul.user.id);
        hesapNotu = "&hesap=hata";
      } else hesapNotu = "&hesap=" + encodeURIComponent(hesapKullanici);
    }
  }

  revalidatePath("/taseronlar");
  revalidatePath(`/taseronlar/${taseronId}`);
  revalidatePath("/");
  redirect(`/taseronlar/${taseronId}?kayit=1${hesapNotu}`);
}

type O = Awaited<ReturnType<typeof oturum>>;

/** Aynı şantiyede, devam eden sözleşmesi olan ve aynı iş türünü yapan diğer taşeronlar. */
async function ayniIsiYapanlar(o: O, isTurleri: string[], ustTaseron: string | null, taseronId: string, santiyeId: string) {
  const { data } = await o.supabase
    .from("sozlesmeler")
    .select("id, taseronlar!inner(id, firma_adi, is_turleri, ust_taseron_id)")
    .eq("santiye_id", santiyeId)
    .eq("tamamlandi", false)
    .neq("taseron_id", taseronId);
  const turler = new Set(isTurleri.filter((t) => t !== "Diğer"));
  const sonuc: string[] = [];
  for (const s of data ?? []) {
    const t = s.taseronlar as unknown as { id: string; firma_adi: string; is_turleri: string[]; ust_taseron_id: string | null };
    // Ana taşeron ile kendi alt taşeronu aynı işi yapabilir; bu mükerrer değildir.
    if (t.id === ustTaseron || t.ust_taseron_id === taseronId) continue;
    const ortak = t.is_turleri.filter((x) => turler.has(x));
    if (ortak.length) sonuc.push(`${t.firma_adi} (${ortak.join(", ")})`);
  }
  return sonuc;
}

export async function sozlesmeTamamla(form: FormData) {
  const o = await oturum();
  const id = form.get("id");
  const taseronId = form.get("taseron_id");
  if (!uuidMi(id) || o.taseron) return;
  await o.supabase.from("sozlesmeler").update({ tamamlandi: form.get("tamamlandi") === "1" }).eq("id", id);
  revalidatePath(`/taseronlar/${taseronId}`);
  revalidatePath("/");
}

export async function taseronSil(_: FormDurumu, form: FormData): Promise<FormDurumu> {
  const o = await oturum();
  const id = form.get("id");
  if (!uuidMi(id) || o.taseron) return { hata: "Geçersiz istek." };
  const { error } = await o.supabase.rpc("taseron_sil", { p_id: id });
  if (error) return { hata: veritabaniHatasi(error) };
  revalidatePath("/taseronlar");
  redirect("/taseronlar?hepsi=1&silindi=1");
}

export async function taseronDurum(_: FormDurumu, form: FormData): Promise<FormDurumu> {
  const o = await oturum();
  const id = form.get("id");
  if (!uuidMi(id) || o.taseron || !o.yetki("taseronlar", true)) return { hata: "Yetkiniz yok." };
  const aktif = form.get("aktif") === "1";
  const { data, error } = await o.supabase.from("taseronlar").update({ aktif }).eq("id", id).select("id");
  if (error) return { hata: veritabaniHatasi(error) };
  if (!data?.length) return { hata: "Bu taşeronu değiştirme yetkiniz yok." };
  revalidatePath(`/taseronlar/${id}`);
  revalidatePath("/");
  return { tamam: aktif ? "Taşeron yeniden aktif." : "Taşeron pasife alındı; artık seçim listelerinde çıkmaz." };
}
