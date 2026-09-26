import Link from "next/link";
import { Fragment } from "react";
import { notFound } from "next/navigation";
import { FileText, Pencil, Phone, Plus, UserPlus, CornerDownRight } from "lucide-react";
import { oturum } from "@/lib/oturum";
import { imzala } from "@/lib/dosya";
import { tarihYaz, type Rol } from "@/lib/sabitler";
import { Bos, Etiket, GecikmeEtiketi, Sayfa } from "@/components/kabuk";
import { GunlukKarti, HataKarti, TalepKarti, type Gunluk, type Hata, type Talep } from "@/components/kartlar";
import { YetkiMatrisi } from "@/components/yetki-matrisi";
import { sozlesmeTamamla } from "../eylemler";
import { TaseronKaldir } from "./kaldir";
import { gunlukDegisebilir } from "@/lib/gunluk";
import { GunlukIslemleri } from "../../gunluk/islemler";

const SEKMELER = [
  { kod: "bilgi", ad: "Bilgi" },
  { kod: "kayitlar", ad: "Kayıtlar" },
  { kod: "yetki", ad: "Yetki" },
] as const;

export default async function TaseronSayfasi({ params, searchParams }: PageProps<"/taseronlar/[id]">) {
  const o = await oturum();
  const { id } = await params;
  const sp = await searchParams;
  const sekme = SEKMELER.some((s) => s.kod === sp.sekme) ? (sp.sekme as string) : "bilgi";

  const { data: t } = await o.supabase
    .from("taseronlar")
    .select("id, firma_adi, yetkililer, vergi_no, iban, is_turleri, ust_taseron_id, alt_taseron_yetkisi, aktif")
    .eq("id", id)
    .maybeSingle();
  if (!t) notFound();

  const sekmeler = SEKMELER.filter((s) => s.kod !== "yetki" || o.merkez);
  const kendisi = o.taseron && o.profil.taseron_id === t.id;

  return (
    <Sayfa
      genis
      baslik={t.firma_adi}
      geri={o.taseron ? "/" : "/taseronlar"}
      geriAd={o.taseron ? "Ana sayfa" : "Taşeronlar"}
      sag={
        !o.taseron && o.yetki("taseronlar", true) ? (
          <Link href={`/taseronlar/${t.id}/duzenle`} className="flex min-h-12 items-center gap-1 rounded-xl border-2 border-cizgi px-3 font-semibold">
            <Pencil className="size-5" /> Düzenle
          </Link>
        ) : null
      }
    >
      {sp.kayit && <p className="rounded-xl bg-yesil px-4 py-3 font-bold text-white">✓ Kaydedildi</p>}
      <div className="flex flex-wrap items-center gap-2">
        {(t.is_turleri as string[]).map((tur) => (
          <Etiket key={tur} sinif="bg-koyu text-white">{tur}</Etiket>
        ))}
        {t.ust_taseron_id && <Etiket sinif="bg-yuzey border border-cizgi">Alt taşeron</Etiket>}
        {!t.aktif && <Etiket sinif="bg-gri text-white">Pasif</Etiket>}
      </div>

      <nav className="grid grid-flow-col gap-1 rounded-2xl bg-yuzey p-1 lg:hidden">
        {sekmeler.map((s) => (
          <Link
            key={s.kod}
            href={`/taseronlar/${t.id}?sekme=${s.kod}`}
            replace
            className={`flex min-h-12 items-center justify-center rounded-xl text-lg font-bold ${
              sekme === s.kod ? "bg-koyu text-white" : "text-soluk"
            }`}
          >
            {s.ad}
          </Link>
        ))}
      </nav>

      {o.merkez && (
        <nav className="hidden w-fit grid-cols-2 gap-1 rounded-2xl bg-yuzey p-1 lg:grid">
          {[
            { kod: "bilgi", ad: "Bilgi ve kayıtlar" },
            { kod: "yetki", ad: "Yetki" },
          ].map((x) => (
            <Link
              key={x.kod}
              href={`/taseronlar/${t.id}?sekme=${x.kod}`}
              replace
              className={`flex min-h-11 items-center justify-center rounded-xl px-5 font-bold ${
                (x.kod === "yetki") === (sekme === "yetki") ? "bg-koyu text-white" : "text-soluk"
              }`}
            >
              {x.ad}
            </Link>
          ))}
        </nav>
      )}

      {sekme === "yetki" && o.merkez ? (
        <Yetki o={o} taseronId={t.id} />
      ) : (
        // Telefonda sekmeye göre biri; bilgisayarda bilgi ve kayıtlar yan yana.
        <div className="lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start lg:gap-8">
          <div className={sekme === "bilgi" ? "" : "hidden lg:block"}>
            <Bilgi o={o} t={t} kendisi={kendisi} />
          </div>
          <div className={sekme === "kayitlar" ? "" : "hidden lg:block"}>
            <h2 className="mb-3 hidden text-xl font-bold lg:block">Kayıtlar</h2>
            <Kayitlar o={o} taseronId={t.id} />
          </div>
        </div>
      )}
    </Sayfa>
  );
}

type O = Awaited<ReturnType<typeof oturum>>;
type T = {
  id: string;
  firma_adi: string;
  yetkililer: { ad: string; telefon: string }[];
  vergi_no: string | null;
  iban: string | null;
  ust_taseron_id: string | null;
  alt_taseron_yetkisi: boolean;
  aktif: boolean;
};

async function Bilgi({ o, t, kendisi }: { o: O; t: T; kendisi: boolean }) {
  const [{ data: sozlesmeler }, { data: altlar }, { data: ust }] = await Promise.all([
    o.yetki("sozlesme")
      ? o.supabase
          .from("sozlesmeler")
          .select("id, is_tarifi, baslangic, bitis, yer_teslim, sure_gun, bitis_hesap, belge_yolu, tamamlandi, santiyeler(ad)")
          .eq("taseron_id", t.id)
          .order("bitis_hesap")
      : Promise.resolve({ data: null }),
    o.supabase.from("taseronlar").select("id, firma_adi, is_turleri").eq("ust_taseron_id", t.id).order("firma_adi"),
    t.ust_taseron_id
      ? o.supabase.from("taseronlar").select("id, firma_adi").eq("id", t.ust_taseron_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const belgeler = await imzala((sozlesmeler ?? []).map((s) => s.belge_yolu).filter(Boolean) as string[]);
  const bugunStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(new Date());
  const altEkleyebilir = (!o.taseron && o.yetki("taseronlar", true)) || (kendisi && t.alt_taseron_yetkisi);

  return (
    <div className="flex flex-col gap-5">
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-2xl bg-yuzey p-4">
        {t.yetkililer.map((y, i) => (
          <Fragment key={i}>
            <dt className="font-bold">{t.yetkililer.length > 1 ? `${i + 1}. yetkili` : "Yetkili"}</dt>
            <dd className="flex flex-col">
              {y.ad && <span>{y.ad}</span>}
              {y.telefon && (
                <a href={`tel:${y.telefon.replace(/\s+/g, "")}`} className="inline-flex min-h-10 items-center gap-1 font-semibold text-mavi underline">
                  <Phone className="size-4" /> {y.telefon}
                </a>
              )}
            </dd>
          </Fragment>
        ))}
        {t.vergi_no && (<><dt className="font-bold">Vergi no</dt><dd>{t.vergi_no}</dd></>)}
        {t.iban && (<><dt className="font-bold">IBAN</dt><dd className="break-all">{t.iban}</dd></>)}
        {ust && (
          <>
            <dt className="font-bold">Ana taşeron</dt>
            <dd>
              {o.taseron ? ust.firma_adi : <Link href={`/taseronlar/${ust.id}`} className="underline">{ust.firma_adi}</Link>}
            </dd>
          </>
        )}
      </dl>

      {!o.taseron && o.yetki("taseronlar", true) && (
        <Link
          href={`/taseronlar/${t.id}/duzenle`}
          className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 border-yazi text-lg font-bold"
        >
          <Pencil className="size-6" /> Bilgileri Düzenle
        </Link>
      )}

      {sozlesmeler && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-bold">Sözleşmeler</h2>
          {sozlesmeler.length === 0 && <Bos>Sözleşme yok.</Bos>}
          {sozlesmeler.map((s) => {
            const kalan = Math.round((Date.parse(s.bitis_hesap) - Date.parse(bugunStr)) / 86400000);
            const santiye = s.santiyeler as unknown as { ad: string } | null;
            return (
              <article key={s.id} className={`flex flex-col gap-2 rounded-2xl border-2 p-3 ${!s.tamamlandi && kalan <= 7 ? "border-kirmizi" : "border-cizgi"}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-lg font-bold">{santiye?.ad}</span>
                  {s.tamamlandi ? <Etiket sinif="bg-yesil text-white">Tamamlandı</Etiket> : <GecikmeEtiketi gun={kalan} />}
                </div>
                <p>{s.is_tarifi}</p>
                <p className="text-soluk">
                  {s.yer_teslim
                    ? `Yer teslim ${tarihYaz(s.yer_teslim)} + ${s.sure_gun} gün`
                    : s.baslangic
                      ? `${tarihYaz(s.baslangic)} başlangıç`
                      : ""}
                </p>
                <p className="font-bold">Bitiş: {tarihYaz(s.bitis_hesap)}</p>
                <div className="flex flex-wrap gap-2">
                  {s.belge_yolu && belgeler[s.belge_yolu] && (
                    <a
                      href={belgeler[s.belge_yolu]}
                      target="_blank"
                      rel="noreferrer"
                      className="flex min-h-12 items-center gap-2 rounded-xl bg-koyu px-4 font-semibold text-white"
                    >
                      <FileText className="size-5" /> Belgeyi aç
                    </a>
                  )}
                  {!o.taseron && o.yetki("taseronlar", true) && (
                    <Link
                      href={`/taseronlar/${t.id}/sozlesme/${s.id}`}
                      className="flex min-h-12 items-center gap-2 rounded-xl bg-vurgu px-4 font-bold text-black"
                    >
                      <Pencil className="size-5" /> Düzelt
                    </Link>
                  )}
                  {!o.taseron && o.yetki("taseronlar", true) && (
                    <form action={sozlesmeTamamla}>
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="taseron_id" value={t.id} />
                      <input type="hidden" name="tamamlandi" value={s.tamamlandi ? "0" : "1"} />
                      <button className="min-h-12 rounded-xl border-2 border-cizgi px-4 font-semibold">
                        {s.tamamlandi ? "Devam ediyor say" : "İş bitti"}
                      </button>
                    </form>
                  )}
                </div>
              </article>
            );
          })}
          {!o.taseron && o.yetki("taseronlar", true) && (
            <Link href={`/taseronlar/${t.id}/sozlesme`} className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-koyu text-lg font-bold text-white">
              <Plus className="size-6" /> Sözleşme Ekle
            </Link>
          )}
        </section>
      )}

      {(altlar?.length || altEkleyebilir) && !t.ust_taseron_id ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-bold">Alt taşeronlar</h2>
          {(altlar ?? []).map((a) => (
            <Link key={a.id} href={`/taseronlar/${a.id}`} className="flex min-h-14 items-center gap-2 rounded-2xl border-2 border-cizgi px-3 font-bold">
              <CornerDownRight className="size-5 text-soluk" /> {a.firma_adi}
              <span className="font-normal text-soluk">· {(a.is_turleri as string[]).join(", ")}</span>
            </Link>
          ))}
          {altEkleyebilir && (
            <Link href="/taseronlar/yeni" className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-cizgi font-bold">
              <Plus className="size-6" /> Alt Taşeron Ekle
            </Link>
          )}
        </section>
      ) : null}

      {!o.taseron && o.yetki("taseronlar", true) && <TaseronKaldir id={t.id} aktif={t.aktif} />}
    </div>
  );
}

/** Taşerona ait tüm kayıtlar tek zaman çizelgesinde (Senaryo 2 ve 3). */
async function Kayitlar({ o, taseronId }: { o: O; taseronId: string }) {
  const [g, h, t] = await Promise.all([
    o.yetki("gunluk")
      ? o.supabase
          .from("gunlukler")
          .select("id, is_tarihi, kisi_sayisi, katlar, is_kalemleri, notu, fotograflar, olusturma, olusturan, guncelleme, profiller!gunlukler_olusturan_fkey(ad_soyad)")
          .eq("taseron_id", taseronId)
          .order("is_tarihi", { ascending: false })
          .limit(100)
      : null,
    o.yetki("hatali")
      ? o.supabase
          .from("hatali_isler")
          .select("id, is_tarihi, aciklama, kat, onem, durum, fotograflar")
          .eq("taseron_id", taseronId)
          .order("is_tarihi", { ascending: false })
          .limit(100)
      : null,
    o.yetki("talep")
      ? o.supabase
          .from("talepler")
          .select("id, urun, miktar, birim, durum, is_tarihi")
          .eq("taseron_id", taseronId)
          .order("is_tarihi", { ascending: false })
          .limit(100)
      : null,
  ]);

  type Olay = { tarih: string; tur: "g"; v: Gunluk } | { tarih: string; tur: "h"; v: Hata } | { tarih: string; tur: "t"; v: Talep };
  const olaylar: Olay[] = [
    ...((g?.data ?? []) as unknown as Gunluk[]).map((v) => ({ tarih: v.is_tarihi, tur: "g" as const, v })),
    ...((h?.data ?? []) as Hata[]).map((v) => ({ tarih: v.is_tarihi, tur: "h" as const, v })),
    ...((t?.data ?? []) as Talep[]).map((v) => ({ tarih: v.is_tarihi, tur: "t" as const, v })),
  ].sort((a, b) => (a.tarih < b.tarih ? 1 : a.tarih > b.tarih ? -1 : 0));

  const adresler = await imzala(
    olaylar.flatMap((x) => (x.tur === "g" ? x.v.fotograflar : x.tur === "h" ? x.v.fotograflar.slice(0, 1) : [])),
  );

  const acikHata = ((h?.data ?? []) as Hata[]).filter((x) => x.durum !== "onaylandi").length;
  const toplamGun = new Set(((g?.data ?? []) as unknown as Gunluk[]).map((x) => x.is_tarihi)).size;
  const teslim = ((t?.data ?? []) as Talep[]).filter((x) => x.durum === "teslim_alindi" || x.durum === "kapandi").length;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2 text-center">
        <Sayac ad="gün kayıt" deger={toplamGun} />
        <Sayac ad="açık hata" deger={acikHata} kirmizi={acikHata > 0} />
        <Sayac ad="teslim ürün" deger={teslim} />
      </div>
      {olaylar.length === 0 && <Bos>Bu taşeron için henüz kayıt yok.</Bos>}
      {olaylar.map((x) =>
        x.tur === "g" ? (
          <GunlukKarti
            key={"g" + x.v.id}
            g={x.v}
            adresler={adresler}
            taseronGoster={false}
            islemler={
              gunlukDegisebilir(o, { olusturan: x.v.olusturan!, olusturma: x.v.olusturma }) ? <GunlukIslemleri id={x.v.id} /> : undefined
            }
          />
        ) : x.tur === "h" ? (
          <HataKarti key={"h" + x.v.id} h={x.v} adresler={adresler} taseronGoster={false} />
        ) : (
          <TalepKarti key={"t" + x.v.id} t={x.v} taseronGoster={false} />
        ),
      )}
    </div>
  );
}

function Sayac({ ad, deger, kirmizi }: { ad: string; deger: number; kirmizi?: boolean }) {
  return (
    <div className={`rounded-2xl p-3 ${kirmizi ? "bg-kirmizi text-white" : "bg-yuzey"}`}>
      <p className="text-2xl font-extrabold">{deger}</p>
      <p className="text-sm font-semibold">{ad}</p>
    </div>
  );
}

async function Yetki({ o, taseronId }: { o: O; taseronId: string }) {
  const [{ data: yetkiler }, { data: hesaplar }] = await Promise.all([
    o.supabase.from("yetkiler").select("sayfa, gorur, duzenler").eq("taseron_id", taseronId),
    o.supabase.from("profiller").select("id, ad_soyad, kullanici_adi, aktif").eq("taseron_id", taseronId).order("ad_soyad"),
  ]);
  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">Giriş hesapları</h2>
        {(hesaplar ?? []).length === 0 && <Bos>Bu taşeronun henüz giriş hesabı yok.</Bos>}
        {(hesaplar ?? []).map((h) => (
          <Link key={h.id} href={`/yonetim/kullanicilar/${h.id}`} className="flex min-h-14 items-center gap-2 rounded-2xl border-2 border-cizgi px-3">
            <span className="font-bold">{h.ad_soyad}</span>
            <span className="text-soluk">· {h.kullanici_adi}</span>
            {!h.aktif && <Etiket sinif="bg-gri text-white">Pasif</Etiket>}
          </Link>
        ))}
        <Link
          href={`/yonetim/kullanicilar/yeni?taseron=${taseronId}`}
          className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-koyu text-lg font-bold text-white"
        >
          <UserPlus className="size-6" /> Giriş Hesabı Aç
        </Link>
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">Sayfa yetkileri</h2>
        <p className="text-soluk">Bu firmanın tüm hesapları için geçerlidir. Taşeron her sayfada yalnızca kendi kayıtlarını görür.</p>
        <YetkiMatrisi rol={"taseron" as Rol} mevcut={yetkiler ?? []} taseronId={taseronId} />
      </section>
    </div>
  );
}
