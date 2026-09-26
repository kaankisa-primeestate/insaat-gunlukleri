"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle, BookOpen, Building2, ClipboardList, House, Settings, Truck, Users } from "lucide-react";

const IKONLAR = {
  ana: House,
  gunluk: BookOpen,
  hatali: AlertTriangle,
  talep: ClipboardList,
  teslimat: Truck,
  taseron: Users,
  firma: Building2,
  yonetim: Settings,
};

/** Soldaki menüde bir bağlantı; bulunulan bölüm koyu görünür. */
export function MenuBaglantisi({ href, ad, ikon }: { href: string; ad: string; ikon: keyof typeof IKONLAR }) {
  const yol = usePathname();
  const aktif = href === "/" ? yol === "/" : yol === href || yol.startsWith(href + "/");
  const Ikon = IKONLAR[ikon];
  return (
    <Link
      href={href}
      className={`flex min-h-12 items-center gap-3 rounded-xl px-3 text-base font-bold ${
        aktif ? "bg-koyu text-white" : "text-yazi hover:bg-zemin"
      }`}
    >
      <Ikon className="size-5 shrink-0" />
      {ad}
    </Link>
  );
}
