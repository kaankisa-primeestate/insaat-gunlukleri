"use client";

import { useActionState } from "react";
import { Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { Form, Mesaj } from "@/components/form";
import { taseronDurum, taseronSil } from "../eylemler";

/**
 * Mükerrer ya da yanlış açılmış taşeron silinir; kaydı olan taşeron silinmez,
 * pasife alınır (seçim listelerinden çıkar, geçmişi korunur). Hangisinin
 * mümkün olduğuna veritabanı karar verir ve nedenini söyler.
 */
export function TaseronKaldir({ id, aktif }: { id: string; aktif: boolean }) {
  const [silSonuc, sil, silBekliyor] = useActionState(taseronSil, undefined);
  const [durumSonuc, durumDegistir, durumBekliyor] = useActionState(taseronDurum, undefined);
  return (
    <section className="mt-4 flex flex-col gap-3 border-t-2 border-cizgi pt-6">
      <h2 className="text-xl font-bold">Taşeronu kaldır</h2>
      <p className="text-soluk">
        Mükerrer ya da yanlış açılmış, hiç kaydı olmayan taşeron silinebilir. Günlüğü, hatalı işi ya da talebi olan
        taşeron silinmez; pasife alınır ve seçim listelerinden çıkar, geçmişi korunur.
      </p>
      <Form eylem={durumDegistir} bekliyor={durumBekliyor} className="flex flex-col gap-2">
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="aktif" value={aktif ? "0" : "1"} />
        <button className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 border-yazi text-lg font-bold">
          {aktif ? <Archive className="size-6" /> : <ArchiveRestore className="size-6" />}
          {aktif ? "Pasife Al" : "Yeniden Aktif Et"}
        </button>
        <Mesaj durum={durumSonuc} />
      </Form>
      <Form
        eylem={sil}
        bekliyor={silBekliyor}
        onayla="Bu taşeron ve sözleşmeleri kalıcı olarak silinsin mi?"
        className="flex flex-col gap-2"
      >
        <input type="hidden" name="id" value={id} />
        <button className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 border-kirmizi text-lg font-bold text-kirmizi">
          <Trash2 className="size-6" /> Taşeronu Sil
        </button>
        <Mesaj durum={silSonuc} />
      </Form>
    </section>
  );
}
