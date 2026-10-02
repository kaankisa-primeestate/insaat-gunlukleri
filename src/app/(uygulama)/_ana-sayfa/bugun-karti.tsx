import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { NotebookPen, AlertTriangle, BookOpen, CalendarDays, ChevronRight, ClipboardList, HardHat, Settings, Truck, Users, Building2, Package } from "lucide-react";
import { GecikmeSesi } from "@/components/gecikme-sesi";
import type { AnaSayfaVerisi } from "./veri";
import { AnlikHava } from "./anlik-hava";

/**
 * Tasarım B, "Bugün Kartı": açık zemin, ortada günün durumunu özetleyen
 * turuncu kart, altında bölümler satır satır. Satırlar tek elle, başparmakla
 * basılacak boyda.
 */
export function BugunKarti({ v }: { v: AnaSayfaVerisi }) {
  const sayaclar = [
    v.hata != null && { href: "/hatali", sayi: v.hata, ad: "açık hata" },
    v.talep != null && { href: "/talep", sayi: v.talep, ad: "talep" },
    v.teslimat != null && { href: "/teslimat", sayi: v.teslimat, ad: "teslimat" },
  ].filter(Boolean) as { href: string; sayi: number; ad: string }[];

  return (
    <div className="flex flex-col">
      {/* Bilgisayarda logo ve kişi soldaki menüde; burada yalnız telefonda. */}
      <div className="flex items-center gap-2.5 lg:hidden">
        <div className="grid size-9 place-items-center rounded-[10px] bg-yazi">
          <HardHat className="size-5 text-vurgu" strokeWidth={2.4} />
        </div>
        <p className="min-w-0 truncate font-extrabold tracking-tight">İnşaat Günlükleri</p>
        <div
          className="ml-auto grid size-10 shrink-0 place-items-center rounded-full bg-zemin text-sm font-bold shadow-sm ring-1 ring-black/5"
          aria-label={v.ad}
        >
          {v.basHarfler}
        </div>
      </div>

      <div className="mt-5 lg:mt-0">
        <p className="text-[15px] font-semibold text-soluk">
          {v.selam}, {v.ad}
        </p>
        <h1 className="text-[32px] leading-[1.1] font-extrabold tracking-tight break-words">{v.santiye}</h1>
        <p className="mt-1 flex items-center gap-1.5 text-[15px] text-soluk">
          <CalendarDays className="size-4" /> {v.tarih}
        </p>
        {v.santiye && (
          <div className="mt-1">
            <Suspense fallback={<p className="h-6" />}>
              <AnlikHava konum={v.konum} merkez={v.merkez} />
            </Suspense>
          </div>
        )}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2 lg:items-start">
        <div className="flex flex-col gap-4">
          {(v.gunluk || sayaclar.length > 0) && (
            <section className="rounded-[26px] bg-linear-to-br from-vurgu to-vurgu-koyu p-5 text-black shadow-[0_16px_32px_-18px_var(--color-vurgu-koyu)]">
              {v.gunluk && <GunlukDurumu g={v.gunluk} />}
              {sayaclar.length > 0 && (
                <div
                  className={`grid divide-x divide-black/10 text-center ${v.gunluk ? "mt-4 border-t border-black/10 pt-3" : ""} ${
                    sayaclar.length === 3 ? "grid-cols-3" : sayaclar.length === 2 ? "grid-cols-2" : "grid-cols-1"
                  }`}
                >
                  {sayaclar.map((x) => (
                    <Link key={x.href} href={x.href} className="flex flex-col items-center py-1.5 active:bg-black/5">
                      <span className="text-2xl font-extrabold">{x.sayi}</span>
                      <span className="text-[13px] font-bold text-black/75">{x.ad}</span>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          )}

          {v.gecikenler.length > 0 && (
            <Link
              href="/taseronlar"
              className="flex items-center gap-3 rounded-2xl bg-kirmizi px-4 py-3.5 text-white shadow-[0_10px_24px_-14px_var(--color-kirmizi)]"
            >
              <AlertTriangle className="size-6 shrink-0" />
              <p className="flex-1 font-bold">
                {v.gecikenler.map((g) => `${g.firma} · ${g.metin}`).join(", ")}
              </p>
              <ChevronRight className="size-5 shrink-0 opacity-80" />
              <GecikmeSesi adet={v.gecikenler.length} />
            </Link>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {v.santiye && (v.gunluk || v.hata != null || v.talep != null || v.teslimat != null || v.karar != null) && (
            <Grup ad="Şantiye">
              {v.gunluk && <Satir href="/gunluk" ikon={<BookOpen />} renk="bg-yazi text-vurgu" ad="Günlükler" />}
              {v.hata != null && (
                <Satir href="/hatali" ikon={<AlertTriangle />} renk="bg-kirmizi text-white" ad="Hatalı İşler" rozet={v.hata ? `${v.hata} açık` : undefined} kirmizi />
              )}
              {v.talep != null && (
                <Satir href="/talep" ikon={<ClipboardList />} renk="bg-mavi text-white" ad="Talepler" rozet={v.talep ? `${v.talep} bekliyor` : undefined} />
              )}
              {v.teslimat != null && (
                <Satir href="/teslimat" ikon={<Truck />} renk="bg-yesil text-white" ad="Teslimat Takvimi" rozet={v.teslimat ? `${v.teslimat} bugün` : undefined} />
              )}
              {v.karar != null && (
                <Satir
                  href={v.karar ? "/karar?bekleyen=1" : "/karar"}
                  ikon={<NotebookPen />}
                  renk="bg-kahve text-white"
                  ad="Karar Defteri"
                  rozet={v.karar ? `${v.karar} onay bekliyor` : undefined}
                  kirmizi={v.karar > 0}
                />
              )}
            </Grup>
          )}
          <Grup ad="Firma">
            <Satir
              href={v.firmaBag.href}
              ikon={v.firmaBag.ad === "Firmam" ? <Building2 /> : <Users />}
              renk="bg-gri text-white"
              ad={v.firmaBag.ad}
            />
            {v.depo && <Satir href="/depo" ikon={<Package />} renk="bg-kahve text-white" ad="Depo" />}
            {v.merkez && <Satir href="/yonetim" ikon={<Settings />} renk="bg-gri text-white" ad="Yönetim" />}
          </Grup>
        </div>
      </div>
    </div>
  );
}

function GunlukDurumu({ g }: { g: NonNullable<AnaSayfaVerisi["gunluk"]> }) {
  if (g.toplam === 0) {
    return (
      <Link href="/taseronlar" className="block">
        <p className="text-[13px] font-bold tracking-wider text-black/75 uppercase">Bugün</p>
        <p className="text-xl leading-tight font-extrabold">Bu şantiyede henüz taşeron yok</p>
        <p className="mt-1 font-semibold text-black/75">Taşeronlar bölümünden sözleşme ekleyin</p>
      </Link>
    );
  }
  const r = 34;
  const cevre = 2 * Math.PI * r;
  const tamam = g.girilen === g.toplam;
  return (
    <Link href="/gunluk" className="flex items-center gap-5">
      <div className="relative size-24 shrink-0">
        <svg viewBox="0 0 80 80" className="size-full -rotate-90" aria-hidden>
          <circle cx="40" cy="40" r={r} fill="none" stroke="rgb(0 0 0 / 0.12)" strokeWidth="9" />
          <circle
            cx="40"
            cy="40"
            r={r}
            fill="none"
            stroke="var(--color-yazi)"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={cevre}
            strokeDashoffset={cevre * (1 - g.girilen / g.toplam)}
          />
        </svg>
        <span className="absolute inset-0 grid place-items-center text-xl font-extrabold">
          {g.girilen}/{g.toplam}
        </span>
      </div>
      <div className="min-w-0">
        <p className="text-[13px] font-bold tracking-wider text-black/75 uppercase">Bugün</p>
        <p className="text-[21px] leading-tight font-extrabold">
          {tamam ? "Tüm günlükler girildi" : g.girilen === 0 ? "Henüz günlük girilmedi" : `${g.girilen} taşeron günlüğü girildi`}
        </p>
        {!tamam && (
          <p className="mt-1 line-clamp-2 font-semibold text-black/75">
            Bekleniyor: {g.bekleyenler.slice(0, 3).join(", ")}
            {g.bekleyenler.length > 3 ? ` +${g.bekleyenler.length - 3}` : ""}
          </p>
        )}
      </div>
    </Link>
  );
}

function Grup({ ad, children }: { ad: string; children: ReactNode }) {
  return (
    <section className="mt-2 first:mt-0">
      <h2 className="mb-2 px-1 text-[13px] font-bold tracking-wider text-soluk uppercase">{ad}</h2>
      <ul className="divide-y divide-gri-acik overflow-hidden rounded-[22px] bg-zemin shadow-[0_1px_2px_rgb(15_20_25/0.05),0_8px_24px_-14px_rgb(15_20_25/0.2)]">
        {children}
      </ul>
    </section>
  );
}

function Satir({
  href,
  ikon,
  renk,
  ad,
  rozet,
  kirmizi,
}: {
  href: string;
  ikon: ReactNode;
  renk: string;
  ad: string;
  rozet?: string;
  kirmizi?: boolean;
}) {
  return (
    <li>
      <Link href={href} className="flex min-h-16 items-center gap-3.5 px-4 active:bg-yuzey lg:hover:bg-yuzey">
        <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${renk} [&_svg]:size-5`}>{ikon}</span>
        <span className="min-w-0 flex-1 text-[17px] leading-tight font-bold">{ad}</span>
        {rozet && (
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[13px] font-extrabold ${
              kirmizi ? "bg-kirmizi-acik text-kirmizi" : "bg-gri-acik text-yazi"
            }`}
          >
            {rozet}
          </span>
        )}
        <ChevronRight className="size-5 shrink-0 text-soluk" />
      </Link>
    </li>
  );
}
