import Link from "next/link";
import type { ReactNode } from "react";
import { AlertTriangle, BookOpen, Camera, ChevronLeft, ClipboardList, House, Inbox, Plus } from "lucide-react";

export function Sayfa({
  baslik,
  geri = "/",
  geriAd = "Ana sayfa",
  sag,
  genis,
  children,
}: {
  baslik: string;
  geri?: string;
  geriAd?: string;
  sag?: ReactNode;
  genis?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`mx-auto flex w-full flex-1 flex-col ${genis ? "max-w-2xl lg:max-w-6xl" : "max-w-2xl"}`}>
      <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-slate-800 bg-koyu/95 px-3.5 py-2.5 text-white shadow-md backdrop-blur-md lg:px-7">
        <Link
          href={geri}
          className="flex min-h-11 items-center gap-1.5 rounded-full border border-white/15 bg-white/10 pr-3.5 pl-2.5 text-sm font-bold text-white hover:bg-white/20 active:scale-95"
        >
          <ChevronLeft className="size-5 text-vurgu" strokeWidth={2.8} />
          <span>{geriAd}</span>
        </Link>
        <div className="ml-auto flex items-center gap-2">{sag}</div>
      </header>

      <main className="flex flex-col gap-4 px-4 pt-5 pb-28 lg:px-8">
        <div className="flex items-center gap-3 border-l-4 border-vurgu pl-3">
          <h1 className="text-2xl font-extrabold tracking-tight text-yazi">{baslik}</h1>
        </div>
        {children}
      </main>

      <nav className="fixed right-0 bottom-0 left-0 z-20 flex items-center justify-around border-t border-cizgi bg-yuzey/95 px-2 py-1.5 shadow-lg backdrop-blur-md lg:hidden">
        <Link
          href="/"
          className="flex min-h-12 flex-col items-center justify-center rounded-xl px-3 py-1 text-xs font-bold text-soluk hover:text-yazi"
        >
          <House className="size-5 text-vurgu-koyu" strokeWidth={2.2} />
          <span className="mt-0.5 text-[11px]">Özet</span>
        </Link>
        <Link
          href="/gunluk"
          className="flex min-h-12 flex-col items-center justify-center rounded-xl px-3 py-1 text-xs font-bold text-soluk hover:text-yazi"
        >
          <BookOpen className="size-5" strokeWidth={2.2} />
          <span className="mt-0.5 text-[11px]">Günlük</span>
        </Link>
        <Link
          href="/hatali"
          className="flex min-h-12 flex-col items-center justify-center rounded-xl px-3 py-1 text-xs font-bold text-soluk hover:text-yazi"
        >
          <AlertTriangle className="size-5 text-kirmizi" strokeWidth={2.2} />
          <span className="mt-0.5 text-[11px]">Hatalı İş</span>
        </Link>
        <Link
          href="/talep"
          className="flex min-h-12 flex-col items-center justify-center rounded-xl px-3 py-1 text-xs font-bold text-soluk hover:text-yazi"
        >
          <ClipboardList className="size-5" strokeWidth={2.2} />
          <span className="mt-0.5 text-[11px]">Talepler</span>
        </Link>
      </nav>
    </div>
  );
}

export function Bos({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-cizgi bg-yuzey px-5 py-8 text-center shadow-xs">
      <Inbox className="size-8 text-soluk/60" strokeWidth={1.8} />
      <p className="text-base font-medium text-soluk">{children}</p>
    </div>
  );
}

export function Etiket({ sinif, children }: { sinif: string; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-extrabold tracking-tight tabular-nums shadow-2xs ${sinif}`}>
      {children}
    </span>
  );
}

export function GecikmeEtiketi({ gun }: { gun: number | null | undefined }) {
  if (gun == null || gun > 7) return null;
  const acil = gun <= 0;
  return (
    <Etiket sinif={acil ? "bg-kirmizi text-white" : "bg-sari-acik text-kahve border border-sari"}>
      {gun < 0 ? `⚠️ ${-gun} gün gecikti` : gun === 0 ? "⏰ Bugün bitiyor" : `⏳ ${gun} gün kaldı`}
    </Etiket>
  );
}

export function BuyukBag({
  href,
  children,
  sinif = "bg-yuzey border border-cizgi hover:border-vurgu",
}: {
  href: string;
  children: ReactNode;
  sinif?: string;
}) {
  return (
    <Link
      href={href}
      className={`flex min-h-16 items-center gap-3.5 rounded-2xl px-4 py-3 text-base font-bold shadow-xs transition active:scale-[0.98] ${sinif}`}
    >
      {children}
    </Link>
  );
}

export function YeniEkle({ href, kamera = true }: { href: string; kamera?: boolean }) {
  return (
    <Link
      href={href}
      className="group flex min-h-16 items-center justify-between gap-3 rounded-2xl border-2 border-slate-900/10 bg-vurgu px-4 py-3 text-lg font-extrabold text-slate-950 shadow-md transition hover:brightness-105 active:scale-[0.98] lg:max-w-md"
    >
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-slate-950 text-vurgu shadow-xs">
          <Plus className="size-6" strokeWidth={3} />
        </span>
        <div className="flex flex-col text-left">
          <span className="leading-tight">Yeni Kayıt Ekle</span>
          <span className="text-xs font-semibold text-slate-900/75">Hızlı saha girişi</span>
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-xl bg-slate-950/10 px-2.5 py-1.5">
        {kamera && <Camera className="size-5 text-slate-950" strokeWidth={2.4} />}
        <span className="font-mono text-xs font-extrabold">⚡ 10sn</span>
      </div>
    </Link>
  );
}
