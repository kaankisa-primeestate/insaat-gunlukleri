import { redirect } from "next/navigation";
import { LogOut, MapPin } from "lucide-react";
import { oturumTemel } from "@/lib/oturum";
import { cikisYap } from "@/app/giris/eylem";
import { santiyeSec } from "./eylem";

export const metadata = { title: "Şantiye Seçin — İnşaat Günlükleri" };

/**
 * Girişten hemen sonra, bir kez: hangi şantiyeye girileceği. Seçim yapılmışsa
 * bu ekran gösterilmez; başka şantiyeye geçmek için çıkış yapılır.
 */
export default async function SantiyeSec() {
  const o = await oturumTemel();
  if (o.santiye || o.santiyeler.length <= 1) redirect("/");

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 p-5">
      <div>
        <p className="text-soluk">Hoş geldiniz, {o.profil.ad_soyad}</p>
        <h1 className="text-3xl font-extrabold">Hangi şantiyeye giriyorsunuz?</h1>
      </div>
      <form action={santiyeSec} className="flex flex-col gap-3">
        {o.santiyeler.map((s) => (
          <button
            key={s.id}
            name="santiye"
            value={s.id}
            className="flex min-h-20 items-center gap-3 rounded-2xl border-2 border-yazi bg-yuzey px-5 text-left text-xl font-extrabold active:scale-[0.98]"
          >
            <MapPin className="size-7 shrink-0" />
            {s.ad}
          </button>
        ))}
      </form>
      <form action={cikisYap}>
        <button className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl text-soluk">
          <LogOut className="size-5" /> Çıkış
        </button>
      </form>
    </main>
  );
}
