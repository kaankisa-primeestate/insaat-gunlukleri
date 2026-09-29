import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { NotebookPen, AlertTriangle, BookOpen, Building2, ChevronRight, ClipboardList, HardHat, MapPin, Settings, Truck, Users } from "lucide-react";
import { GecikmeSesi } from "@/components/gecikme-sesi";
import type { AnaSayfaVerisi } from "./veri";
import { AnlikHava } from "./anlik-hava";

/**
 * Tasarım A, "Grafit Başlık": üstte koyu blok (şantiye, tarih, sayaçlar),
 * altında beyaz kartlar. Yedek tasarım; `?tasarim=a` ile denenir, varsayılan
 * yapmak için page.tsx içindeki TASARIM değişir.
 */
export function Grafit({ v }: { v: AnaSayfaVerisi }) {
  const sayaclar = [
    v.hata != null && { href: "/hatali", sayi: v.hata, ad: "açık hata", renk: "text-kirmizi-parlak" },
    v.talep != null && { href: "/talep", sayi: v.talep, ad: "bekleyen talep", renk: "text-vurgu" },
    v.teslimat != null && { href: "/teslimat", sayi: v.teslimat, ad: "teslimat bugün", renk: "text-mavi-parlak" },
  ].filter(Boolean) as { href: string; sayi: number; ad: string; renk: string }[];
  const g = v.gunluk;

  return (
    <div className="flex flex-col gap-4">
      <header className="-mx-4 -mt-3 rounded-b-[28px] bg-linear-to-b from-yazi to-koyu px-5 pt-5 pb-6 text-white shadow-[0_10px_30px_-12px_rgb(15_20_25/0.6)] lg:mx-0 lg:mt-0 lg:rounded-[28px] lg:px-8">
        <div className="flex items-center gap-3 lg:hidden">
          <div className="grid size-10 place-items-center rounded-xl bg-vurgu">
            <HardHat className="size-6 text-black" strokeWidth={2.4} />
          </div>
          <div className="min-w-0 leading-tight">
            <p className="text-[15px] font-extrabold tracking-tight">İnşaat Günlükleri</p>
            <p className="truncate text-[13px] text-white/65">{v.firma}</p>
          </div>
          <div className="ml-auto grid size-10 shrink-0 place-items-center rounded-full bg-white/10 text-sm font-bold ring-1 ring-white/20">
            {v.basHarfler}
          </div>
        </div>
        <div className="mt-6 lg:mt-0">
          <p className="flex items-center gap-1.5 text-[13px] font-semibold tracking-wide text-vurgu uppercase">
            <MapPin className="size-4" /> Şantiye
          </p>
          <h1 className="mt-1 text-[30px] leading-tight font-extrabold tracking-tight break-words">{v.santiye}</h1>
          <p className="mt-0.5 text-white/70">{v.tarih}</p>
          {v.santiye && (
            <div className="mt-1">
              <Suspense fallback={<p className="h-6" />}>
                <AnlikHava konum={v.konum} merkez={v.merkez} koyu />
              </Suspense>
            </div>
          )}
        </div>
        {sayaclar.length > 0 && (
          <div className={`mt-5 grid gap-2 ${sayaclar.length === 3 ? "grid-cols-3" : sayaclar.length === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
            {sayaclar.map((x) => (
              <Link key={x.href} href={x.href} className="rounded-2xl bg-white/[0.07] px-3 py-3 ring-1 ring-white/10 active:bg-white/15">
                <p className={`text-[28px] leading-none font-extrabold ${x.renk}`}>{x.sayi}</p>
                <p className="mt-1.5 text-[12.5px] leading-tight font-semibold text-white/75">{x.ad}</p>
              </Link>
            ))}
          </div>
        )}
      </header>

      {v.gecikenler.length > 0 && (
        <Link href="/taseronlar" className="flex items-center gap-3 rounded-2xl border border-kirmizi-acik bg-zemin p-4 shadow-sm">
          <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-kirmizi text-white">
            <AlertTriangle className="size-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-extrabold text-kirmizi">Gecikme uyarısı</p>
            <p className="font-semibold">{v.gecikenler.map((x) => `${x.firma} · ${x.metin}`).join(", ")}</p>
          </div>
          <ChevronRight className="size-5 shrink-0 text-soluk" />
          <GecikmeSesi adet={v.gecikenler.length} />
        </Link>
      )}

      {g && g.toplam > 0 && (
        <Link href="/gunluk" className="rounded-2xl bg-zemin p-4 shadow-sm">
          <div className="flex items-baseline justify-between gap-2">
            <p className="font-extrabold">Bugünün günlükleri</p>
            <p className="text-sm font-bold text-soluk">
              {g.girilen} / {g.toplam} taşeron
            </p>
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-gri-acik">
            <div className="h-full rounded-full bg-linear-to-r from-vurgu to-vurgu-koyu" style={{ width: `${(g.girilen / g.toplam) * 100}%` }} />
          </div>
          <p className="mt-2 text-sm text-soluk">
            {g.bekleyenler.length ? `Bekleniyor: ${g.bekleyenler.slice(0, 3).join(", ")}${g.bekleyenler.length > 3 ? ` +${g.bekleyenler.length - 3}` : ""}` : "Tüm günlükler girildi"}
          </p>
        </Link>
      )}

      <nav className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {g && <Kart href="/gunluk" ikon={<BookOpen />} renk="bg-sari-acik text-kahve" ad="Günlükler" alt={`${g.girilen} kayıt bugün`} />}
        {v.hata != null && <Kart href="/hatali" ikon={<AlertTriangle />} renk="bg-kirmizi-acik text-kirmizi" ad="Hatalı İşler" alt={`${v.hata} açık`} rozet={v.hata} />}
        {v.talep != null && <Kart href="/talep" ikon={<ClipboardList />} renk="bg-mavi-acik text-mavi" ad="Talepler" alt={`${v.talep} bekliyor`} />}
        {v.teslimat != null && <Kart href="/teslimat" ikon={<Truck />} renk="bg-yesil-acik text-yesil" ad="Teslimat" alt={`${v.teslimat} araç bugün`} />}
        {v.karar != null && (
          <Kart
            href={v.karar ? "/karar?bekleyen=1" : "/karar"}
            ikon={<NotebookPen />}
            renk="bg-sari-acik text-kahve"
            ad="Karar Defteri"
            alt={v.karar ? `${v.karar} onay bekliyor` : "Saha kararları"}
            rozet={v.karar || undefined}
          />
        )}
        <Kart
          href={v.firmaBag.href}
          ikon={v.firmaBag.ad === "Firmam" ? <Building2 /> : <Users />}
          renk="bg-gri-acik text-yazi"
          ad={v.firmaBag.ad}
          alt={v.firmaBag.ad === "Firmam" ? "Bilgiler, sözleşmeler" : "Firmalar, sözleşmeler"}
        />
        {v.merkez && <Kart href="/yonetim" ikon={<Settings />} renk="bg-gri-acik text-yazi" ad="Yönetim" alt="Kullanıcı, şantiye" />}
      </nav>
    </div>
  );
}

function Kart({ href, ikon, renk, ad, alt, rozet }: { href: string; ikon: ReactNode; renk: string; ad: string; alt: string; rozet?: number }) {
  return (
    <Link
      href={href}
      className="relative flex min-h-32 flex-col justify-between rounded-2xl bg-zemin p-4 shadow-[0_1px_2px_rgb(15_20_25/0.06),0_6px_16px_-8px_rgb(15_20_25/0.18)] active:scale-[0.98]"
    >
      <div className={`grid size-12 place-items-center rounded-xl ${renk} [&_svg]:size-6`}>{ikon}</div>
      {!!rozet && (
        <span className="absolute top-4 right-4 grid size-7 place-items-center rounded-full bg-kirmizi text-sm font-extrabold text-white">{rozet}</span>
      )}
      <div>
        <p className="text-[17px] leading-tight font-extrabold">{ad}</p>
        <p className="mt-0.5 text-[13.5px] font-medium text-soluk">{alt}</p>
      </div>
    </Link>
  );
}
