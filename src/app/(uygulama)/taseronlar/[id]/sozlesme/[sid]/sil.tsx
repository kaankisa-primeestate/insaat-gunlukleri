"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";
import { Form, Mesaj } from "@/components/form";
import { sozlesmeSil } from "../../../eylemler";

export function SozlesmeSilDugmesi({ id, taseronId }: { id: string; taseronId: string }) {
  const [durum, eylem, bekliyor] = useActionState(sozlesmeSil, undefined);
  return (
    <Form
      eylem={eylem}
      bekliyor={bekliyor}
      onayla="Bu sözleşme silinsin mi? Taşeron bu şantiyenin listelerinden çıkar; günlük ve diğer kayıtları silinmez."
      className="mt-6 flex flex-col gap-2 border-t-2 border-cizgi pt-6"
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="taseron_id" value={taseronId} />
      <p className="text-soluk">Sözleşme yanlış taşerona ya da yanlış şantiyeye açıldıysa silebilirsiniz.</p>
      <button disabled={bekliyor} className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 border-kirmizi text-lg font-bold text-kirmizi">
        <Trash2 className="size-6" /> Sözleşmeyi Sil
      </button>
      <Mesaj durum={durum} />
    </Form>
  );
}
