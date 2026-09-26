import Link from "next/link";
import { HardHat } from "lucide-react";
import { supabaseHazir } from "@/lib/supabase/env";
import { supabaseYonetici } from "@/lib/supabase/server";
import { GirisFormu } from "./form";

export const metadata = { title: "Giriş — İnşaat Günlükleri" };

async function kurulumGerekli() {
  const { count } = await supabaseYonetici().from("firmalar").select("id", { count: "exact", head: true });
  return count === 0;
}

export default async function GirisSayfasi({ searchParams }: PageProps<"/giris">) {
  const { hata } = await searchParams;
  if (!supabaseHazir) {
    return (
      <main className="mx-auto w-full max-w-md p-6">
        <h1 className="text-2xl font-bold">Kurulum bekleniyor</h1>
        <p className="mt-2 text-soluk">Supabase bağlantı bilgileri tanımlanmamış.</p>
      </main>
    );
  }
  const kurulum = await kurulumGerekli();

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 p-5">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="grid size-20 place-items-center rounded-3xl bg-vurgu">
          <HardHat className="size-12 text-black" strokeWidth={2.2} />
        </div>
        <h1 className="text-3xl font-extrabold">İnşaat Günlükleri</h1>
        <p className="text-soluk">Şantiye ve taşeron takibi</p>
      </div>

      {hata === "pasif" && (
        <p className="rounded-xl bg-kirmizi px-4 py-3 font-semibold text-white">Hesabınız kapatılmış. Merkezle görüşün.</p>
      )}

      {kurulum ? (
        <Link
          href="/kurulum"
          className="flex min-h-16 items-center justify-center rounded-2xl bg-vurgu text-xl font-bold text-black"
        >
          İlk Kurulumu Başlat
        </Link>
      ) : (
        <GirisFormu />
      )}

      <p className="text-center text-sm text-soluk">Hesabınızı merkez oluşturur. Şifrenizi unuttuysanız merkezle görüşün.</p>
    </main>
  );
}
