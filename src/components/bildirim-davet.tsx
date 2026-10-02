"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, X } from "lucide-react";

/**
 * Ana sayfada bir kez: bu telefonda bildirim açık değilse "Bildirimleri aç"
 * daveti. Kapatılırsa bir daha gösterilmez (Bildirimler menüden açılır).
 */
export function BildirimDavet() {
  const [goster, setGoster] = useState(false);
  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        if (localStorage.getItem("bildirim-davet-kapali")) return;
        if (!("serviceWorker" in navigator) || !("Notification" in window)) return;
        if (Notification.permission === "denied") return;
        const r = await navigator.serviceWorker.getRegistration();
        if (!r) return;
        if (await r.pushManager?.getSubscription()) return;
        setGoster(true);
      } catch {
        // Tarayıcı saklama alanı kapalı: davet gösterilmez.
      }
    }, 1500);
    return () => clearTimeout(t);
  }, []);
  if (!goster) return null;
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-sari-acik p-3">
      <Bell className="size-7 shrink-0 text-kahve" />
      <Link href="/bildirimler" className="min-w-0 flex-1 font-bold">
        Bildirimleri açın: hatalı iş, karar ve talepler telefonunuza düşsün.
      </Link>
      <button
        type="button"
        aria-label="Kapat"
        onClick={() => {
          try {
            localStorage.setItem("bildirim-davet-kapali", "1");
          } catch {}
          setGoster(false);
        }}
        className="grid size-10 shrink-0 place-items-center"
      >
        <X className="size-6" />
      </button>
    </div>
  );
}
