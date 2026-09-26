import Link from "next/link";
import {
  AlertTriangle,
  BookOpen,
  ClipboardList,
  HardHat,
  LogOut,
  Package,
  Plus,
  Settings,
  Truck,
  Users,
  Building2,
} from "lucide-react";
import { oturum } from "@/lib/oturum";
import { bugun, ROL_ADI } from "@/lib/sabitler";
import { cikisYap } from "@/app/giris/eylem";
import { KameraDugmesi } from "@/components/kamera-dugmesi";
import { SantiyeSecici } from "@/components/santiye-secici";
import { GecikmeSesi } from "@/components/gecikme-sesi";

export default async function AnaSayfa({ searchParams }: PageProps<"/">) {
  const o = await oturum();
  const { yetki: yetkiUyarisi, kayit } = await searchParams;
  const s = o.santiye;

  // Özet sayılar ve gecikme uyarıları seçili şantiye için.
  const [hatalar, talepler, teslimatlar, taseronlar] = s
    ? await Promise.all([
        o.yetki("hatali")
          ? o.supabase.from("hatali_isler").select("id", { count: "exact", head: true }).eq("santiye_id", s.id).neq("durum", "onaylandi")
          : null,
        o.yetki("talep")
          ? o.supabase.from("talepler").select("id", { count: "exact", head: true }).eq("santiye_id", s.id).not("durum", "in", "(teslim_alindi,kapandi)")
          : null,
        o.yetki("teslimat")
          ? o.supabase.rpc("teslimat_yogunluk", { p_santiye: s.id, p_tarih: bugun() })
          : null,
        o.supabase.rpc("santiye_taseronlari", { p_santiye: s.id }),
      ])
    : [null, null, null, null];

  const gecikenler = ((taseronlar?.data ?? []) as { id: string; firma_adi: string; gecikme: number | null }[]).filter(
    (t) => t.gecikme != null && t.gecikme <= 7,
  );
  const bugunTeslimat = ((teslimatlar?.data ?? []) as { adet: number }[]).reduce((a, b) => a + Number(b.adet), 0);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 pt-3 pb-16">
      <header className="flex items-center gap-3">
        <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-vurgu">
          <HardHat className="size-7 text-black" strokeWidth={2.4} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg leading-tight font-extrabold">{o.profil.ad_soyad}</p>
          <p className="truncate text-sm text-soluk">
            {ROL_ADI[o.profil.rol]} · {o.firma.ad}
          </p>
        </div>
        <form action={cikisYap}>
          <button
            type="submit"
            className="flex min-h-12 min-w-12 flex-col items-center justify-center rounded-xl text-xs font-semibold text-soluk active:bg-yuzey"
          >
            <LogOut className="size-6" />
            Çıkış
          </button>
        </form>
      </header>

      {yetkiUyarisi === "yok" && (
        <p className="rounded-xl bg-kirmizi px-4 py-3 font-semibold text-white">Bu sayfayı görme yetkiniz yok.</p>
      )}
      {kayit && <p className="rounded-xl bg-yesil px-4 py-3 text-lg font-bold text-white">✓ Kaydedildi</p>}

      <SantiyeSecici santiyeler={o.santiyeler} secili={s?.id} />

      {!s && (
        <div className="rounded-2xl bg-yuzey p-5 text-center">
          <p className="font-semibold">Henüz size bağlı bir şantiye yok.</p>
          {o.merkez ? (
            <Link href="/yonetim/santiyeler" className="mt-3 inline-block rounded-xl bg-vurgu px-5 py-3 font-bold text-black">
              Şantiye Ekle
            </Link>
          ) : (
            <p className="mt-1 text-soluk">Merkezin sizi bir şantiyeye eklemesi gerekiyor.</p>
          )}
        </div>
      )}

      {gecikenler.length > 0 && (
        <Link href="/taseronlar" className="flex items-start gap-3 rounded-2xl bg-kirmizi p-4 text-white">
          <AlertTriangle className="size-8 shrink-0" />
          <div>
            <p className="text-lg font-extrabold">Gecikme uyarısı</p>
            <p className="font-semibold">
              {gecikenler
                .map((t) => `${t.firma_adi} (${t.gecikme! < 0 ? `${-t.gecikme!} gün gecikti` : `${t.gecikme} gün kaldı`})`)
                .join(", ")}
            </p>
          </div>
          <GecikmeSesi adet={gecikenler.length} />
        </Link>
      )}

      {s && (
        <section className="flex flex-col gap-3">
          {o.yetki("gunluk", true) && (
            <div className="flex gap-3">
              <Link
                href="/gunluk/yeni"
                className="flex min-h-20 flex-1 items-center justify-center gap-2 rounded-2xl bg-vurgu px-3 text-xl font-extrabold text-black active:scale-[0.98]"
              >
                <Plus className="size-8" strokeWidth={3} />
                Yeni Günlük Ekle
              </Link>
              <KameraDugmesi hedef="/gunluk/yeni" etiket="Fotoğraf çekip günlük başlat" />
            </div>
          )}
          {o.yetki("hatali", true) && !o.taseron && (
            <div className="flex gap-3">
              <Link
                href="/hatali/yeni"
                className="flex min-h-20 flex-1 items-center justify-center gap-2 rounded-2xl bg-kirmizi px-3 text-xl font-extrabold text-white active:scale-[0.98]"
              >
                <AlertTriangle className="size-8" strokeWidth={2.6} />
                Hatalı İş Bildir
              </Link>
              <KameraDugmesi hedef="/hatali/yeni" etiket="Fotoğraf çekip hatalı iş bildir" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            {o.yetki("talep", true) && (
              <Link
                href="/talep/yeni"
                className="flex min-h-18 items-center justify-center gap-2 rounded-2xl bg-koyu px-2 text-lg font-bold text-white active:scale-[0.98]"
              >
                <Package className="size-7" /> Talep Aç
              </Link>
            )}
            {o.yetki("teslimat", true) && (
              <Link
                href="/teslimat?yeni=1"
                className="flex min-h-18 items-center justify-center gap-2 rounded-2xl bg-koyu px-2 text-lg font-bold text-white active:scale-[0.98]"
              >
                <Truck className="size-7" /> Teslimat Gir
              </Link>
            )}
          </div>
        </section>
      )}

      <nav className="grid grid-cols-2 gap-3">
        {s && o.yetki("gunluk") && <Kutu href="/gunluk" ikon={<BookOpen />} ad="Günlükler" />}
        {s && o.yetki("hatali") && (
          <Kutu href="/hatali" ikon={<AlertTriangle />} ad="Hatalı İşler" sayi={hatalar?.count} sayiAd="açık" kirmizi />
        )}
        {s && o.yetki("talep") && <Kutu href="/talep" ikon={<ClipboardList />} ad="Talepler" sayi={talepler?.count} sayiAd="bekleyen" />}
        {s && o.yetki("teslimat") && <Kutu href="/teslimat" ikon={<Truck />} ad="Teslimat Takvimi" sayi={bugunTeslimat} sayiAd="bugün" />}
        {o.taseron ? (
          <Kutu href={`/taseronlar/${o.profil.taseron_id}`} ikon={<Building2 />} ad="Firmam" />
        ) : (
          <Kutu href="/taseronlar" ikon={<Users />} ad="Taşeronlar" />
        )}
        {o.merkez && <Kutu href="/yonetim" ikon={<Settings />} ad="Yönetim" />}
      </nav>
    </div>
  );
}

function Kutu({
  href,
  ikon,
  ad,
  sayi,
  sayiAd,
  kirmizi,
}: {
  href: string;
  ikon: React.ReactNode;
  ad: string;
  sayi?: number | null;
  sayiAd?: string;
  kirmizi?: boolean;
}) {
  return (
    <Link
      href={href}
      className="relative flex min-h-24 flex-col justify-between gap-2 rounded-2xl border-2 border-cizgi bg-yuzey p-3 active:scale-[0.98] [&_svg]:size-7"
    >
      {ikon}
      <span className="text-lg leading-tight font-bold">{ad}</span>
      {!!sayi && (
        <span
          className={`absolute top-2 right-2 rounded-lg px-2 py-0.5 text-sm font-extrabold ${
            kirmizi ? "bg-kirmizi text-white" : "bg-koyu text-white"
          }`}
        >
          {sayi} {sayiAd}
        </span>
      )}
    </Link>
  );
}
