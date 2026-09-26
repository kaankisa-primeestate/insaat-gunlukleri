"use client";

import { useEffect } from "react";

/**
 * Bilgisayar tarayıcılarında tarih kutusunun yazı kısmına tıklamak takvimi
 * açmaz, yalnızca küçük takvim simgesi açar (teslimat ekranındaki büyük
 * kutuda o simge de görünmüyordu). Sayfadaki her tarih kutusuna tıklanınca
 * takvim açılır; telefonda zaten açılıyor, orada da zararı yok.
 */
export function TarihAcici() {
  useEffect(() => {
    function tikla(e: MouseEvent) {
      const hedef = e.target;
      if (hedef instanceof HTMLInputElement && hedef.type === "date" && !hedef.disabled && !hedef.readOnly) {
        try {
          hedef.showPicker();
        } catch {
          // Desteklenmeyen tarayıcı ya da takvim zaten açık: varsayılan davranış kalır.
        }
      }
    }
    document.addEventListener("click", tikla);
    return () => document.removeEventListener("click", tikla);
  }, []);
  return null;
}
