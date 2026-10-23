import React, { useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  BookOpen,
  Camera,
  ChevronLeft,
  ClipboardList,
  House,
  Inbox,
  Plus,
  CheckCircle2,
  Clock,
  Copy,
  Check,
} from "lucide-react";

/**
 * Hem Next.js (GitHub/Vercel) hem de standart tarayıcı önizlemesinde
 * hatasız çalışan evrensel bağlantı bileşeni.
 */
function Baglanti({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}

/** Alt sayfaların ortak çerçevesi: modern koyu üst bar, vurgulu başlık ve mobil alt hızlı erişim çubuğu. */
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
  /** Liste sayfaları bilgisayarda geniş açılır; formlar okunaklı genişlikte kalır. */
  genis?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`mx-auto flex w-full flex-1 flex-col ${
        genis ? "max-w-2xl lg:max-w-6xl" : "max-w-2xl"
      }`}
    >
      {/* Modern Sabit Üst Kabuk */}
      <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-slate-800 bg-slate-900/95 px-3.5 py-2.5 text-white shadow-md backdrop-blur-md lg:px-7">
        <Baglanti
          href={geri}
          className="flex min-h-11 items-center gap-1.5 rounded-full border border-white/15 bg-white/10 pr-3.5 pl-2.5 text-sm font-bold text-white hover:bg-white/20 active:scale-95"
        >
          <ChevronLeft className="size-5 text-amber-400" strokeWidth={2.8} />
          <span>{geriAd}</span>
        </Baglanti>
        <div className="ml-auto flex items-center gap-2">{sag}</div>
      </header>

      {/* Ana İçerik Alanı */}
      <main className="flex flex-col gap-4 px-4 pt-5 pb-28 lg:px-8">
        <div className="flex items-center gap-3 border-l-4 border-amber-400 pl-3">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            {baslik}
          </h1>
        </div>
        {children}
      </main>

      {/* Mobil Alt Hızlı Gezinme Çubuğu (Sadece Mobil/Tablet Saha Ekranlarında Görünür) */}
      <nav className="fixed right-0 bottom-0 left-0 z-20 flex items-center justify-around border-t border-slate-200 bg-white/95 px-2 py-1.5 shadow-lg backdrop-blur-md lg:hidden">
        <Baglanti
          href="/"
          className="flex min-h-12 flex-col items-center justify-center rounded-xl px-3 py-1 text-xs font-bold text-slate-600 hover:text-slate-900"
        >
          <House className="size-5 text-amber-600" strokeWidth={2.2} />
          <span className="mt-0.5 text-[11px]">Özet</span>
        </Baglanti>
        <Baglanti
          href="/gunluk"
          className="flex min-h-12 flex-col items-center justify-center rounded-xl px-3 py-1 text-xs font-bold text-slate-600 hover:text-slate-900"
        >
          <BookOpen className="size-5" strokeWidth={2.2} />
          <span className="mt-0.5 text-[11px]">Günlük</span>
        </Baglanti>
        <Baglanti
          href="/hatali"
          className="flex min-h-12 flex-col items-center justify-center rounded-xl px-3 py-1 text-xs font-bold text-slate-600 hover:text-slate-900"
        >
          <AlertTriangle className="size-5 text-red-600" strokeWidth={2.2} />
          <span className="mt-0.5 text-[11px]">Hatalı İş</span>
        </Baglanti>
        <Baglanti
          href="/talep"
          className="flex min-h-12 flex-col items-center justify-center rounded-xl px-3 py-1 text-xs font-bold text-slate-600 hover:text-slate-900"
        >
          <ClipboardList className="size-5" strokeWidth={2.2} />
          <span className="mt-0.5 text-[11px]">Talepler</span>
        </Baglanti>
      </nav>
    </div>
  );
}

export function Bos({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-white px-5 py-8 text-center shadow-xs">
      <Inbox className="size-8 text-slate-400" strokeWidth={1.8} />
      <p className="text-base font-medium text-slate-600">{children}</p>
    </div>
  );
}

export function Etiket({
  sinif,
  children,
}: {
  sinif: string;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-extrabold tracking-tight tabular-nums shadow-2xs ${sinif}`}
    >
      {children}
    </span>
  );
}

export function GecikmeEtiketi({ gun }: { gun: number | null | undefined }) {
  if (gun == null || gun > 7) return null;
  const acil = gun <= 0;
  return (
    <Etiket
      sinif={
        acil
          ? "bg-red-600 text-white"
          : "bg-amber-100 text-amber-900 border border-amber-400"
      }
    >
      {gun < 0
        ? `⚠️ ${-gun} gün gecikti`
        : gun === 0
        ? "⏰ Bugün bitiyor"
        : `⏳ ${gun} gün kaldı`}
    </Etiket>
  );
}

export function BuyukBag({
  href,
  children,
  sinif = "bg-white border border-slate-300 hover:border-amber-400",
}: {
  href: string;
  children: ReactNode;
  sinif?: string;
}) {
  return (
    <Baglanti
      href={href}
      className={`flex min-h-16 items-center gap-3.5 rounded-2xl px-4 py-3 text-base font-bold shadow-xs transition active:scale-[0.98] ${sinif}`}
    >
      {children}
    </Baglanti>
  );
}

/**
 * Bölüm sayfalarının en üstündeki tek kayıt düğmesi.
 * Saha Anayasası'na uygun yüksek kontrastlı, kamera rozetli modern aksiyon kartı.
 */
export function YeniEkle({
  href,
  kamera = true,
}: {
  href: string;
  kamera?: boolean;
}) {
  return (
    <Baglanti
      href={href}
      className="group flex min-h-16 items-center justify-between gap-3 rounded-2xl border-2 border-slate-900/10 bg-amber-400 px-4 py-3 text-lg font-extrabold text-slate-950 shadow-md transition hover:brightness-105 active:scale-[0.98] lg:max-w-md"
    >
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-slate-950 text-amber-400 shadow-xs">
          <Plus className="size-6" strokeWidth={3} />
        </span>
        <div className="flex flex-col text-left">
          <span className="leading-tight">Yeni Kayıt Ekle</span>
          <span className="text-xs font-semibold text-slate-900/75">
            Hızlı saha girişi
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-xl bg-slate-950/10 px-2.5 py-1.5">
        {kamera && (
          <Camera className="size-5 text-slate-950" strokeWidth={2.4} />
        )}
        <span className="font-mono text-xs font-extrabold">⚡ 10sn</span>
      </div>
    </Baglanti>
  );
}

/**
 * Sağ paneldeki "Preview" (Önizleme) sekmesinde yeni kabuk bileşenlerinin
 * nasıl göründüğünü canlı test edebilmeniz için varsayılan önizleme bileşeni.
 */
export default function App() {
  const [kopyalandi, setKopyalandi] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Sayfa
        baslik="Şantiye Günlüğü (Aşama 2 Önizleme)"
        geri="/"
        geriAd="Ana Sayfa"
        sag={
          <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-extrabold text-slate-950">
            Polenium Manzara
          </span>
        }
      >
        {/* GitHub Kopyalama Bilgi Kartı */}
        <div className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-50 p-4 text-sm text-emerald-950 shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <p className="font-extrabold">
              ✅ Aşama 2 (`src/components/kabuk.tsx`) Hazır!
            </p>
            <button
              type="button"
              onClick={() => {
                setKopyalandi(true);
                setTimeout(() => setKopyalandi(false), 2500);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-800"
            >
              {kopyalandi ? (
                <>
                  <Check className="size-4" /> Test Edildi
                </>
              ) : (
                <>
                  <Copy className="size-4" /> Önizleme Aktif
                </>
              )}
            </button>
          </div>
          <p className="mt-1 text-xs text-emerald-800">
            Bu dosyadaki kodu kopyalayıp GitHub&apos;daki{" "}
            <strong className="underline">src/components/kabuk.tsx</strong>{" "}
            dosyasına yapıştırarak kaydedebilirsiniz.
          </p>
        </div>

        {/* Yeni Kayıt Ekle Aksiyon Kartı Önizlemesi */}
        <YeniEkle href="#yeni" kamera={true} />

        {/* Gecikme Etiketleri Önizlemesi */}
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-bold text-slate-500 mr-2">
            Rozet Örnekleri:
          </span>
          <GecikmeEtiketi gun={-3} />
          <GecikmeEtiketi gun={0} />
          <GecikmeEtiketi gun={4} />
          <Etiket sinif="bg-emerald-100 text-emerald-800 border border-emerald-300">
            ✓ Onaylandı
          </Etiket>
        </div>

        {/* Büyük Bağlantı Kartları Önizlemesi */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <BuyukBag href="#gunluk">
            <CheckCircle2 className="size-6 text-emerald-600 shrink-0" />
            <div>
              <div className="text-sm font-extrabold text-slate-900">
                Özdemir Kalıp & Demir
              </div>
              <div className="text-xs font-medium text-slate-500">
                A Blok 4. Kat · 8 Usta, 6 İşçi
              </div>
            </div>
          </BuyukBag>
          <BuyukBag href="#hatali">
            <Clock className="size-6 text-amber-600 shrink-0" />
            <div>
              <div className="text-sm font-extrabold text-slate-900">
                Yılmazlar Elektrik
              </div>
              <div className="text-xs font-medium text-slate-500">
                B Blok 2. Kat · Buat montaj kontrolü
              </div>
            </div>
          </BuyukBag>
        </div>

        {/* Boş Durum Önizlemesi */}
        <Bos>Filtreye uygun başka saha kaydı bulunmuyor.</Bos>
      </Sayfa>
    </div>
  );
}
