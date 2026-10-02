"use client";

import { createContext, useCallback, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import { CheckCircle2, CloudOff, LoaderCircle, TriangleAlert } from "lucide-react";
import { bekleyenler, hepsiniGonder, kuyrukDinle } from "@/lib/cevrimdisi";

type Baglam = { kullanici: string; santiye: { id: string; ad: string } | null };
const CevrimdisiBaglami = createContext<Baglam | null>(null);

/** Formlar kuyruğa yazarken kimin, hangi şantiyede olduğunu buradan alır. */
export const useCevrimdisi = () => useContext(CevrimdisiBaglami);

/** İnternet yokken açılabilecek sayfalar; service worker bunları telefonda tutar. */
const HAZIR_SAYFALAR = ["/", "/gunluk/yeni", "/hatali/yeni", "/karar/yeni", "/bekleyenler"];

/**
 * Uygulamanın çevrimdışı katmanı: service worker'ı kurar, internet varken
 * formları telefona hazırlar, bekleyen kayıtları internet gelince gönderir
 * ve üstte durum şeridini gösterir.
 */
export function CevrimdisiKatman({ kullanici, santiye, children }: Baglam & { children: ReactNode }) {
  const cevrimici = useSyncExternalStore(
    (f) => {
      window.addEventListener("online", f);
      window.addEventListener("offline", f);
      return () => {
        window.removeEventListener("online", f);
        window.removeEventListener("offline", f);
      };
    },
    () => navigator.onLine,
    () => true,
  );
  const [bekleyen, setBekleyen] = useState(0);
  const [hatali, setHatali] = useState(0);
  const [ilerleme, setIlerleme] = useState<string | null>(null);
  const [gonderildi, setGonderildi] = useState(0);

  const say = useCallback(async () => {
    try {
      const l = await bekleyenler(kullanici);
      setBekleyen(l.filter((b) => !b.hata).length);
      setHatali(l.filter((b) => b.hata).length);
    } catch {
      // IndexedDB kapalı (gizli sekme): çevrimdışı kayıt yok, şerit de yok.
    }
  }, [kullanici]);

  const gonderHepsini = useCallback(async () => {
    if (!navigator.onLine) return;
    const l = await bekleyenler(kullanici).catch(() => []);
    if (!l.some((b) => !b.hata)) return;
    const s = await hepsiniGonder(kullanici, (i, n) => setIlerleme(`${i + 1}/${n}`));
    setIlerleme(null);
    if (s.gonderilen) {
      setGonderildi(s.gonderilen);
      setTimeout(() => setGonderildi(0), 5000);
    }
  }, [kullanici]);

  useEffect(() => {
    // Açılışta sayım ve gönderim; telefon hafızası okunana kadar şerit boş kalır.
    const ilk = setTimeout(() => {
      void say();
      void gonderHepsini();
    }, 0);
    const gelince = () => void gonderHepsini();
    window.addEventListener("online", gelince);
    const birak = kuyrukDinle(() => void say());
    // Telefon uykudan dönünce ya da arada bir: bekleyen varsa yeniden dene.
    const zamanlayici = setInterval(() => void gonderHepsini(), 30000);
    const gorunur = () => document.visibilityState === "visible" && void gonderHepsini();
    document.addEventListener("visibilitychange", gorunur);
    return () => {
      window.removeEventListener("online", gelince);
      document.removeEventListener("visibilitychange", gorunur);
      clearInterval(zamanlayici);
      clearTimeout(ilk);
      birak();
    };
  }, [say, gonderHepsini]);

  // Service worker yalnız yayındaki sürümde; geliştirmede sayfaları eski tutmasın.
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then(() => navigator.serviceWorker.ready)
      .then((r) => {
        if (navigator.onLine && santiye) r.active?.postMessage({ tip: "isit", sayfalar: HAZIR_SAYFALAR });
      })
      .catch(() => {});
  }, [santiye]);

  let serit: ReactNode = null;
  if (!cevrimici) {
    serit = (
      <span className="flex items-center gap-2">
        <CloudOff className="size-5 shrink-0" />
        {bekleyen ? `İnternet yok · ${bekleyen} kayıt telefonda bekliyor` : "İnternet yok · kayıtlar telefona yazılır"}
      </span>
    );
  } else if (ilerleme) {
    serit = (
      <span className="flex items-center gap-2">
        <LoaderCircle className="size-5 shrink-0 animate-spin" /> Gönderiliyor… {ilerleme}
      </span>
    );
  } else if (hatali) {
    serit = (
      <span className="flex items-center gap-2">
        <TriangleAlert className="size-5 shrink-0" /> {hatali} kayıt gönderilemedi · Bekleyenler
      </span>
    );
  } else if (bekleyen) {
    serit = (
      <span className="flex items-center gap-2">
        <LoaderCircle className="size-5 shrink-0 animate-spin" /> {bekleyen} kayıt gönderilmeyi bekliyor
      </span>
    );
  } else if (gonderildi) {
    serit = (
      <span className="flex items-center gap-2">
        <CheckCircle2 className="size-5 shrink-0" /> {gonderildi} kayıt gönderildi
      </span>
    );
  }
  const renk = !cevrimici ? "bg-koyu text-white" : hatali ? "bg-kirmizi text-white" : gonderildi && !bekleyen ? "bg-yesil text-white" : "bg-sari text-black";

  return (
    <CevrimdisiBaglami.Provider value={{ kullanici, santiye }}>
      {serit && (
        <Link href="/bekleyenler" role="status" className={`flex min-h-11 items-center justify-center px-4 py-2 text-center font-bold ${renk}`}>
          {serit}
        </Link>
      )}
      {children}
    </CevrimdisiBaglami.Provider>
  );
}
