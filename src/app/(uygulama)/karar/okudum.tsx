"use client";

import { useActionState } from "react";
import { CheckCheck } from "lucide-react";
import { Form, Mesaj } from "@/components/form";
import { kararOkudum } from "./eylemler";

/** Muhatabın "Okudum" onayı; geri alınamaz, kimin ne zaman okuduğu tutulur. */
export function OkudumDugmesi({ id }: { id: string }) {
  const [durum, eylem, bekliyor] = useActionState(kararOkudum, undefined);
  return (
    <Form eylem={eylem} bekliyor={bekliyor} onayla="Bu kararı okuduğunuz ve bildiğiniz kayda geçecek. Onaylıyor musunuz?">
      <input type="hidden" name="id" value={id} />
      <button disabled={bekliyor} className="flex min-h-11 items-center gap-1.5 rounded-xl bg-yesil px-4 font-bold text-white">
        <CheckCheck className="size-5" /> Okudum
      </button>
      <Mesaj durum={durum} />
    </Form>
  );
}
