"use client";

import { useEffect } from "react";

/**
 * Sesli gecikme uyarısı. Tarayıcılar kullanıcı dokunmadan ses çaldırmaz;
 * bu yüzden ekrana ilk dokunuşta bir kez çalar. Aynı gün tekrar çalmaz.
 */
export function GecikmeSesi({ adet }: { adet: number }) {
  useEffect(() => {
    if (adet <= 0) return;
    const anahtar = "gecikme-sesi-" + new Date().toDateString();
    try {
      if (sessionStorage.getItem(anahtar)) return;
    } catch {}

    function cal() {
      window.removeEventListener("pointerdown", cal);
      try {
        sessionStorage.setItem(anahtar, "1");
      } catch {}
      try {
        const ctx = new AudioContext();
        [0, 0.35, 0.7].forEach((t) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = "square";
          o.frequency.value = 880;
          g.gain.setValueAtTime(0.25, ctx.currentTime + t);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.25);
          o.connect(g).connect(ctx.destination);
          o.start(ctx.currentTime + t);
          o.stop(ctx.currentTime + t + 0.25);
        });
        navigator.vibrate?.([200, 100, 200]);
      } catch {}
    }
    window.addEventListener("pointerdown", cal, { once: true });
    return () => window.removeEventListener("pointerdown", cal);
  }, [adet]);
  return null;
}
