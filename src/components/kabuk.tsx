import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";

/** Alt sayfaların ortak çerçevesi: büyük geri düğmesi ve başlık. */
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
    <div className={`mx-auto flex w-full flex-1 flex-col ${genis ? "max-w-2xl lg:max-w-6xl" : "max-w-2xl"}`}>
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b-2 border-cizgi bg-zemin/95 px-3 py-2 backdrop-blur lg:px-7">
        <Link
          href={geri}
          className="flex min-h-12 items-center gap-1 rounded-xl pr-3 pl-1 text-base font-semibold active:bg-yuzey"
        >
          <ChevronLeft className="size-7" />
          {geriAd}
        </Link>
        <div className="ml-auto">{sag}</div>
      </header>
      <main className="flex flex-col gap-5 px-4 pt-4 pb-24 lg:px-8">
        <h1 className="text-2xl font-extrabold">{baslik}</h1>
        {children}
      </main>
    </div>
  );
}

export function Bos({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl bg-yuzey px-4 py-6 text-center text-soluk">{children}</p>;
}

export function Etiket({ sinif, children }: { sinif: string; children: ReactNode }) {
  return <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-sm font-bold ${sinif}`}>{children}</span>;
}

export function GecikmeEtiketi({ gun }: { gun: number | null | undefined }) {
  if (gun == null || gun > 7) return null;
  return (
    <Etiket sinif="bg-kirmizi text-white">
      {gun < 0 ? `${-gun} gün gecikti` : gun === 0 ? "Bugün bitiyor" : `${gun} gün kaldı`}
    </Etiket>
  );
}

export function BuyukBag({ href, children, sinif = "bg-yuzey border-2 border-cizgi" }: { href: string; children: ReactNode; sinif?: string }) {
  return (
    <Link href={href} className={`flex min-h-16 items-center gap-3 rounded-2xl px-4 text-lg font-bold active:scale-[0.98] ${sinif}`}>
      {children}
    </Link>
  );
}
