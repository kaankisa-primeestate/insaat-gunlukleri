"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { oturum, SANTIYE_CEREZI } from "@/lib/oturum";

export async function santiyeSec(id: string) {
  const o = await oturum();
  if (!o.santiyeler.some((s) => s.id === id)) return;
  (await cookies()).set(SANTIYE_CEREZI, id, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  revalidatePath("/", "layout");
}
