"use client";

import { useActionState, useEffect, useState } from "react";
import { Bell, BellOff, Send } from "lucide-react";
import { Form, Mesaj } from "@/components/form";
import { abonelikKaydet, abonelikSil, denemeGonder } from "./eylemler";

function anahtar(base64: string) {
  const dolgu = "=".repeat((4 - (base64.length % 4)) % 4);
  const ham = atob((base64 + dolgu).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...ham].map((c) => c.charCodeAt(0)));
}

type Durum = "yukleniyor" | "desteksiz" | "iphone-ekle" | "reddedildi" | "kapali" | "acik";

/**
 * Bu telefonda bildirim aç / kapat. iPhone'da bildirim yalnız ana ekrana
 * eklenmiş uygulamada çalışır; tarayıcıdan açılmışsa önce bu söylenir.
 */
export function TelefonBildirimi({ publicKey }: { publicKey: string }) {
  const [durum, setDurum] = useState<Durum>("yukleniyor");
  const [mesgul, setMesgul] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [deneme, denemeEylem, denemeBekliyor] = useActionState(denemeGonder, undefined);

  useEffect(() => {
    const iphone = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const ekranda = window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
    const t = setTimeout(async () => {
      if (iphone && !ekranda) return setDurum("iphone-ekle");
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return setDurum("desteksiz");
      if (Notification.permission === "denied") return setDurum("reddedildi");
      const r = await navigator.serviceWorker.getRegistration();
      const a = await r?.pushManager.getSubscription();
      setDurum(a ? "acik" : "kapali");
    }, 0);
    return () => clearTimeout(t);
  }, []);

  async function ac() {
    setMesgul(true);
    setHata(null);
    try {
      const izin = await Notification.requestPermission();
      if (izin !== "granted") {
        setDurum(izin === "denied" ? "reddedildi" : "kapali");
        return;
      }
      const r = await navigator.serviceWorker.ready;
      const a = await r.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: anahtar(publicKey) });
      const s = await abonelikKaydet(a.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } }, navigator.userAgent);
      if ("hata" in s && s.hata) throw new Error(s.hata);
      setDurum("acik");
    } catch (e) {
      setHata("Açılamadı: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setMesgul(false);
    }
  }

  async function kapat() {
    setMesgul(true);
    const r = await navigator.serviceWorker.getRegistration();
    const a = await r?.pushManager.getSubscription();
    if (a) {
      await abonelikSil(a.endpoint);
      await a.unsubscribe();
    }
    setDurum("kapali");
    setMesgul(false);
  }

  const kutu = "flex flex-col gap-3 rounded-2xl border-2 p-4";
  if (durum === "yukleniyor") return <p className="text-soluk">Yükleniyor…</p>;
  if (durum === "iphone-ekle")
    return (
      <div className={`${kutu} border-sari`}>
        <p className="text-lg font-bold">iPhone&apos;da önce ana ekrana ekleyin</p>
        <p>
          Safari&apos;de alttaki <b>Paylaş</b> düğmesine, sonra <b>Ana Ekrana Ekle</b>&apos;ye dokunun. Uygulamayı ana ekrandaki simgeden
          açıp bu sayfaya yeniden gelin; bildirim düğmesi burada olacak.
        </p>
      </div>
    );
  if (durum === "desteksiz")
    return <p className={`${kutu} border-cizgi`}>Bu tarayıcı bildirimi desteklemiyor. Telefonda Chrome (Android) ya da ana ekrana eklenmiş uygulama (iPhone) kullanın.</p>;
  if (durum === "reddedildi")
    return (
      <p className={`${kutu} border-kirmizi`}>
        Bildirim izni bu telefonda kapatılmış. Telefonun Ayarlar → Bildirimler (ya da tarayıcının site ayarları) bölümünden İnşaat
        Günlükleri için izni açın, sonra bu sayfayı yenileyin.
      </p>
    );

  return (
    <div className={`${kutu} ${durum === "acik" ? "border-yesil" : "border-cizgi"}`}>
      <p className="flex items-center gap-2 text-lg font-bold">
        {durum === "acik" ? <Bell className="size-6 text-yesil" /> : <BellOff className="size-6 text-soluk" />}
        {durum === "acik" ? "Bu telefonda bildirimler açık" : "Bu telefonda bildirimler kapalı"}
      </p>
      {hata && <p className="rounded-xl bg-kirmizi px-3 py-2 font-semibold text-white">{hata}</p>}
      {durum === "acik" ? (
        <div className="flex flex-wrap gap-2">
          <Form eylem={denemeEylem} bekliyor={denemeBekliyor}>
            <button disabled={denemeBekliyor} className="flex min-h-12 items-center gap-2 rounded-xl bg-koyu px-4 font-bold text-white">
              <Send className="size-5" /> Deneme bildirimi gönder
            </button>
            <div className="mt-2">
              <Mesaj durum={deneme} />
            </div>
          </Form>
          <button type="button" disabled={mesgul} onClick={() => void kapat()} className="min-h-12 rounded-xl border-2 border-cizgi px-4 font-bold">
            Bu telefonda kapat
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={mesgul}
          onClick={() => void ac()}
          className="flex min-h-16 items-center justify-center gap-2 rounded-2xl bg-vurgu text-xl font-bold text-black disabled:opacity-60"
        >
          <Bell className="size-6" /> {mesgul ? "Açılıyor…" : "Bildirimleri aç"}
        </button>
      )}
    </div>
  );
}
