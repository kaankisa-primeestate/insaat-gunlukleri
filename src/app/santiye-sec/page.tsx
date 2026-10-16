import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, LogOut, MapPin } from "lucide-react";
import { oturumTemel } from "@/lib/oturum";
import { cikisYap } from "@/app/giris/eylem";
import { santiyeSec } from "./eylem";

export const metadata = { title: "Şantiye Seçin — İnşaat Günlükleri" };

/**
 * Girişten hemen sonra, seçim yapılmamışsa: hangi şantiyeye girileceği
 * (tek dokunuş, geri dönüş yok — ilk seçim zorunlu).
 *
 * Zaten bir şantiye seçiliyken bu ekrana amblemden bilerek gelinir: başka
 * şantiyeye geçmek iki adımlı — önce şantiye seçilir, sonra ayrı bir ekranda
 * "Evet, X şantiyesine geç" ile onaylanır. Tek dokunuşla yanlışlıkla şantiye
 * değiştirip farkında olmadan kayıt girmeyi önlemek için (bkz. KARARLAR.md, D8).
 */
export default async function SantiyeSec({ searchParams }: PageProps<"/santiye-sec">) {
  const o = await oturumTemel();
  if (o.santiyeler.length <= 1) redirect("/");

  const { hedef } = await searchParams;
  const hedefSantiye = o.santiye && typeof hedef === "string" ? o.santiyeler.find((s) => s.id === hedef) : undefined;

  if (hedefSantiye) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 p-5">
        <div>
          <p className="text-soluk">Şu an {o.santiye!.ad} şantiyesindesiniz</p>
          <h1 className="text-3xl font-extrabold">{hedefSantiye.ad} şantiyesine geçilsin mi?</h1>
          <p className="mt-2 text-soluk">Bundan sonra gireceğiniz kayıtlar {hedefSantiye.ad} şantiyesine düşer.</p>
        </div>
        <form action={santiyeSec} className="flex flex-col gap-3">
          <input type="hidden" name="santiye" value={hedefSantiye.id} />
          <button className="flex min-h-16 items-center justify-center rounded-2xl bg-yazi text-xl font-extrabold text-white active:scale-[0.98]">
            Evet, {hedefSantiye.ad} şantiyesine geç
          </button>
        </form>
        <Link href="/santiye-sec" className="flex min-h-12 items-center justify-center gap-2 font-semibold text-soluk">
          <ArrowLeft className="size-5" /> Vazgeç
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 p-5">
      <div>
        {o.santiye ? (
          <>
            <p className="text-soluk">Şu an {o.santiye.ad} şantiyesindesiniz</p>
            <h1 className="text-3xl font-extrabold">Başka hangi şantiyeye geçmek istersiniz?</h1>
          </>
        ) : (
          <>
            <p className="text-soluk">Hoş geldiniz, {o.profil.ad_soyad}</p>
            <h1 className="text-3xl font-extrabold">Hangi şantiyeye giriyorsunuz?</h1>
          </>
        )}
      </div>
      {o.santiye ? (
        <div className="flex flex-col gap-3">
          {o.santiyeler
            .filter((s) => s.id !== o.santiye!.id)
            .map((s) => (
              <Link
                key={s.id}
                href={`/santiye-sec?hedef=${s.id}`}
                className="flex min-h-20 items-center gap-3 rounded-2xl border-2 border-yazi bg-yuzey px-5 text-left text-xl font-extrabold active:scale-[0.98]"
              >
                <MapPin className="size-7 shrink-0" />
                {s.ad}
              </Link>
            ))}
        </div>
      ) : (
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
      )}
      {o.santiye ? (
        <Link href="/" className="flex min-h-14 w-full items-center justify-center font-semibold text-soluk">
          Vazgeç
        </Link>
      ) : (
        <form action={cikisYap}>
          <button className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl text-soluk">
            <LogOut className="size-5" /> Çıkış
          </button>
        </form>
      )}
    </main>
  );
}
