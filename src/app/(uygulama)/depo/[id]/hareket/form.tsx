"use client";

import { useActionState, useState } from "react";
import { Alan, Form, Girdi, KaydetButonu, Mesaj, Metin, Secim } from "@/components/form";
import { YazSec, ilerle, type YazSecSecenek } from "@/components/hizli";
import { miktarYaz, type HareketKodu } from "@/lib/depo";
import { YerSecimi } from "../../yeni/form";
import { hareketKaydet } from "../../eylemler";

/** Bir depo hareketi; sorulanlar türe göre değişir, kalan miktar sunucuda hesaplanır. */
export function HareketFormu({
  kalem,
  tur,
  baslik,
  santiyeler,
  seciliSantiye,
  kisiler,
  kimde,
  depolar,
  oncekiYerler,
}: {
  kalem: { id: string; ad: string; birim: string; depoda: number; disarida: number };
  tur: HareketKodu;
  baslik: string;
  santiyeler: { id: string; ad: string }[];
  /** Giriş yapılan şantiye; "Ver" ve "Kullanıldı"da seçili gelir. */
  seciliSantiye?: string;
  kisiler: { taseronlar: string[]; kisiler: string[]; oncekiAdlar: string[] };
  kimde: { kime: string; miktar: number }[];
  depolar: { id: string; ad: string }[];
  oncekiYerler: string[];
}) {
  const [durum, eylem, bekliyor] = useActionState(hareketKaydet, undefined);
  const [kaynak, setKaynak] = useState<"depo" | "disari">("depo");
  const b = kalem.birim;
  const miktarli = tur === "ver" || tur === "geri" || tur === "kullanildi" || tur === "giris" || tur === "sayim";
  const enFazla = tur === "ver" ? kalem.depoda : tur === "geri" ? kalem.disarida : tur === "kullanildi" ? (kaynak === "disari" ? kalem.disarida : kalem.depoda) : undefined;
  const kisiSecenekleri: YazSecSecenek[] = [
    ...(tur === "geri" ? kimde.map((x) => ({ deger: "e:" + x.kime, ad: x.kime, alt: `Elinde ${miktarYaz(x.miktar, b)}`, grup: "Elinde olanlar" })) : []),
    ...kisiler.taseronlar.map((t) => ({ deger: "t:" + t, ad: t, grup: "Taşeronlar" })),
    ...kisiler.kisiler.map((k) => ({ deger: "k:" + k, ad: k, grup: "Çalışanlar" })),
    ...kisiler.oncekiAdlar.map((a) => ({ deger: "a:" + a, ad: a, grup: "Daha önce yazılanlar" })),
  ].filter((s, i, l) => l.findIndex((x) => x.ad === s.ad) === i);

  return (
    <Form
      eylem={eylem}
      bekliyor={bekliyor}
      onayla={tur === "kapat" ? "Kayıt kapanacak (elden çıktı). Geçmişi kalır, istenirse yeniden açılır. Onaylıyor musunuz?" : undefined}
      className="flex flex-col gap-6"
    >
      <input type="hidden" name="kalem" value={kalem.id} />
      <input type="hidden" name="tur" value={tur} />

      <p className="rounded-2xl bg-yuzey px-4 py-3 font-semibold">
        Depoda <b>{miktarYaz(kalem.depoda, b)}</b>
        {kalem.disarida > 0 && <> · dışarıda <b>{miktarYaz(kalem.disarida, b)}</b></>}
      </p>

      {tur === "kullanildi" && kalem.disarida > 0 && (
        <Alan etiket="Nereden kullanıldı?">
          <Secim
            ad="kaynak"
            sutun={2}
            varsayilan="depo"
            onChange={(d) => setKaynak(d as "depo" | "disari")}
            secenekler={[
              { deger: "depo", ad: "Depodan" },
              { deger: "disari", ad: "Verilenden" },
            ]}
          />
        </Alan>
      )}

      {miktarli && (
        <div id="h-miktar">
          <Alan
            etiket={tur === "sayim" ? `Depoda gerçekte ne kadar var? (${b})` : `Ne kadar? (${b})`}
            zorunlu
            ipucu={enFazla != null ? `En fazla ${miktarYaz(enFazla, b)}.` : tur === "sayim" ? "Eski miktar ve yenisi revizyonda görünür." : undefined}
          >
            <Girdi
              name="miktar"
              type="number"
              inputMode="decimal"
              step="any"
              min={tur === "sayim" ? "0" : "0.01"}
              max={enFazla}
              required
              autoFocus
              className="text-2xl font-bold"
              defaultValue={tur === "sayim" ? String(kalem.depoda) : undefined}
            />
          </Alan>
        </div>
      )}

      {(tur === "ver" || tur === "geri") && (
        <div id="h-kime">
          <Alan etiket={tur === "ver" ? "Kime verildi?" : "Kim getirdi?"} zorunlu>
            <YazSec yaziAd="kime" secenekler={kisiSecenekleri} placeholder="Yazın ya da listeden seçin" zorunlu sonra={() => ilerle("h-santiye", false)} />
          </Alan>
        </div>
      )}

      {tur === "geri" && (
        <Alan etiket="Ne durumda?">
          <Secim ad="durum" sutun={3} varsayilan="Sağlam" secenekler={["Sağlam", "Arızalı", "Eksik"].map((d) => ({ deger: d, ad: d }))} />
        </Alan>
      )}

      {(tur === "ver" || tur === "kullanildi") && santiyeler.length > 0 && (
        <div id="h-santiye">
          <Alan etiket={tur === "ver" ? "Hangi şantiyeye?" : "Hangi şantiyede?"}>
            <Secim
              ad="santiye"
              sutun={santiyeler.length > 1 ? 2 : 1}
              varsayilan={seciliSantiye ?? ""}
              secenekler={[...santiyeler.map((s) => ({ deger: s.id, ad: s.ad })), { deger: "", ad: "Şantiye dışı" }]}
            />
          </Alan>
        </div>
      )}

      {tur === "yer" && (
        <Alan etiket="Yeni yeri" zorunlu>
          <YerSecimi depolar={depolar} oncekiYerler={oncekiYerler} />
        </Alan>
      )}

      <Alan etiket={tur === "kapat" ? "Neden?" : "Not"}>
        <Metin
          name="notu"
          maxLength={300}
          required={tur === "kapat"}
          placeholder={tur === "kapat" ? "Örn. Satıldı, hurdaya çıktı, kayboldu" : "İsteğe bağlı"}
        />
      </Alan>

      <Mesaj durum={durum} />
      <div className="sticky bottom-3">
        <KaydetButonu renk={tur === "kapat" ? "kirmizi" : "vurgu"}>{baslik}</KaydetButonu>
      </div>
    </Form>
  );
}
