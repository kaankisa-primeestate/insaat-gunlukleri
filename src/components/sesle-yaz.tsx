"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { Mic, MicOff } from "lucide-react";

/* Tarayıcının konuşma tanıma arayüzü; TypeScript kütüphanesinde tanımlı değil. */
type Tanima = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};
type TanimaSinifi = new () => Tanima;

function tanimaSinifi(): TanimaSinifi | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: TanimaSinifi; webkitSpeechRecognition?: TanimaSinifi };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/**
 * Yazı kutusunun köşesindeki mikrofon. Telefonun kendi Türkçe tanımasını
 * kullanır (Android'de Google, iPhone'da Siri); ücretsizdir, anahtar gerekmez.
 * Söylenen, kutudaki yazının sonuna eklenir; karakter sınırı aşılmaz.
 * Bir dokunuş başlatır, ikinci dokunuş durdurur; arada duraklamak kapatmaz.
 * Tarayıcı desteklemiyorsa düğme hiç görünmez.
 */
export function SesleYaz({ hedef }: { hedef: RefObject<HTMLTextAreaElement | null> }) {
  const [destek, setDestek] = useState(false);
  const [dinliyor, setDinliyor] = useState(false);
  const [ara, setAra] = useState("");
  const [hata, setHata] = useState("");
  const tanima = useRef<Tanima | null>(null);
  /** Kullanıcı dinlemeyi açık istiyor mu (motor arada kendini kapatsa da). */
  const istek = useRef(false);

  // Destek yalnızca tarayıcıda bilinir; sunucu çiziminde düğme yok.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setDestek(tanimaSinifi() != null), []);
  useEffect(
    () => () => {
      istek.current = false;
      tanima.current?.stop();
    },
    [],
  );

  function ekle(yazi: string) {
    const el = hedef.current;
    if (!el) return;
    const temiz = yazi.trim();
    if (!temiz) return;
    const once = el.value.trimEnd();
    let yeni = once ? `${once} ${temiz}` : temiz.charAt(0).toLocaleUpperCase("tr-TR") + temiz.slice(1);
    if (el.maxLength > 0) yeni = yeni.slice(0, el.maxLength);
    // Değer React dışında değişir; formun görmesi için giriş olayı da atılır.
    const ayarla = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
    ayarla?.call(el, yeni);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }

  // Kullanıcı durdurana kadar dinlenir. Tanıma motoru sessizlikte kendini
  // kapatır (özellikle iPhone ve Android'de); kullanıcı durdurmadıysa hemen
  // yeniden başlatılır. Sürekli kip Android Chrome'da sonuçları tekrarladığı
  // için orada her cümle ayrı oturumdur, yeniden başlatma aynı işi görür.
  function baslat() {
    const Sinif = tanimaSinifi();
    if (!Sinif) return;
    const t = new Sinif();
    t.lang = "tr-TR";
    t.interimResults = true;
    t.continuous = !/Android/i.test(navigator.userAgent);
    t.onresult = (e) => {
      let gecici = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) ekle(r[0].transcript);
        else gecici += r[0].transcript;
      }
      setAra(gecici);
    };
    t.onerror = (e) => {
      // Sessizlik ve kesinti hata değildir; dinleme sürer.
      if (e.error === "no-speech" || e.error === "aborted") return;
      istek.current = false;
      setHata(
        e.error === "not-allowed" || e.error === "service-not-allowed"
          ? "Mikrofon izni verilmedi. Tarayıcı ayarlarından izin verin."
          : e.error === "network"
            ? "Sesle yazma için internet gerekiyor."
            : "Dinleme durdu, mikrofona tekrar dokunun.",
      );
    };
    t.onend = () => {
      setAra("");
      tanima.current = null;
      if (istek.current) {
        baslat();
        return;
      }
      setDinliyor(false);
    };
    tanima.current = t;
    try {
      t.start();
    } catch {
      istek.current = false;
      setDinliyor(false);
    }
  }

  function bas() {
    if (istek.current) {
      istek.current = false;
      tanima.current?.stop();
      setDinliyor(false);
      return;
    }
    setHata("");
    istek.current = true;
    setDinliyor(true);
    baslat();
  }

  if (!destek) return null;
  return (
    <>
      <button
        type="button"
        onClick={bas}
        aria-label={dinliyor ? "Dinlemeyi durdur" : "Sesle yaz"}
        aria-pressed={dinliyor}
        className={`absolute top-2 right-2 grid size-12 place-items-center rounded-full ${
          dinliyor ? "animate-pulse bg-kirmizi text-white" : "bg-koyu text-white"
        }`}
      >
        {dinliyor ? <MicOff className="size-6" /> : <Mic className="size-6" />}
      </button>
      {(dinliyor || hata) && (
        <p aria-live="polite" className={`mt-1 text-sm font-semibold ${hata || !ara ? "text-kirmizi" : "text-soluk"}`}>
          {hata || (ara ? `“${ara}”` : "● Dinleniyor… Konuşmaya devam edin. Bitince mikrofona tekrar dokunun.")}
        </p>
      )}
    </>
  );
}
