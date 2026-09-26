import { HardHat, LogOut } from "lucide-react";
import { oturum } from "@/lib/oturum";
import { ROL_ADI } from "@/lib/sabitler";
import { cikisYap } from "@/app/giris/eylem";
import { MenuBaglantisi } from "@/components/menu";

/**
 * Bilgisayar ekranında solda sabit menü; telefonda hiç görünmez, telefon
 * görünümü aynen kalır. Sahada kayıt telefondan, ofiste takip bilgisayardan.
 */
export default async function UygulamaDuzeni({ children }: LayoutProps<"/">) {
  const o = await oturum();
  const s = o.santiye;
  const menu = [
    { href: "/", ad: "Ana sayfa", ikon: "ana" as const, goster: true },
    { href: "/gunluk", ad: "Günlükler", ikon: "gunluk" as const, goster: !!s && o.yetki("gunluk") },
    { href: "/hatali", ad: "Hatalı İşler", ikon: "hatali" as const, goster: !!s && o.yetki("hatali") },
    { href: "/talep", ad: "Talepler", ikon: "talep" as const, goster: !!s && o.yetki("talep") },
    { href: "/teslimat", ad: "Teslimat Takvimi", ikon: "teslimat" as const, goster: !!s && o.yetki("teslimat") },
    o.taseron
      ? { href: `/taseronlar/${o.profil.taseron_id}`, ad: "Firmam", ikon: "firma" as const, goster: true }
      : { href: "/taseronlar", ad: "Taşeronlar", ikon: "taseron" as const, goster: true },
    { href: "/yonetim", ad: "Yönetim", ikon: "yonetim" as const, goster: o.merkez },
  ].filter((m) => m.goster);

  return (
    <div className="flex flex-1">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r-2 border-cizgi bg-yuzey lg:flex">
        <div className="flex items-center gap-3 px-5 py-5">
          <div className="grid size-11 place-items-center rounded-xl bg-vurgu">
            <HardHat className="size-6 text-black" strokeWidth={2.4} />
          </div>
          <div className="min-w-0">
            <p className="leading-tight font-extrabold">İnşaat Günlükleri</p>
            <p className="truncate text-sm text-soluk">{o.firma.ad}</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {menu.map((m) => (
            <MenuBaglantisi key={m.href} href={m.href} ad={m.ad} ikon={m.ikon} />
          ))}
        </nav>
        <div className="border-t-2 border-cizgi p-4">
          <p className="truncate font-bold">{o.profil.ad_soyad}</p>
          <p className="mb-3 truncate text-sm text-soluk">{ROL_ADI[o.profil.rol]}</p>
          <form action={cikisYap}>
            <button className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-cizgi font-semibold text-soluk hover:bg-zemin">
              <LogOut className="size-5" /> Çıkış
            </button>
          </form>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
