"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { oturumTemel } from "@/lib/oturum";
import { CEREZ_AYARI, SANTIYE_CEREZI } from "@/lib/santiye-cerezi";

export async function santiyeSec(form: FormData) {
  const o = await oturumTemel();
  const id = String(form.get("santiye") ?? "");
  // Yalnızca kullanıcının erişebildiği bir şantiye seçilebilir. İlk seçim
  // tek dokunuşla olur; şantiye zaten seçiliyse buraya ancak amblemden,
  // "Evet, X şantiyesine geç" onayından sonra gelinir (bkz. santiye-sec/page.tsx).
  if (o.santiyeler.some((s) => s.id === id)) {
    (await cookies()).set(SANTIYE_CEREZI, id, CEREZ_AYARI);
  }
  redirect("/");
}
