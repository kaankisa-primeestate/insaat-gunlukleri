import { redirect } from "next/navigation";
import { connection } from "next/server";
import { supabaseYonetici } from "@/lib/supabase/server";
import { KurulumFormu } from "./form";

export const metadata = { title: "İlk Kurulum — İnşaat Günlükleri" };

export default async function KurulumSayfasi() {
  // Kurulum yapılıp yapılmadığı her istekte okunur; derlemede sabitlenmemeli.
  await connection();
  const { count } = await supabaseYonetici().from("firmalar").select("id", { count: "exact", head: true });
  if (count !== 0) redirect("/giris");

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 p-5">
      <div>
        <h1 className="text-3xl font-extrabold">İlk Kurulum</h1>
        <p className="mt-2 text-soluk">
          Firmanızı ve merkez yönetici hesabını oluşturun. Merkez her şeyin hakimidir: şantiyeleri, taşeronları,
          kullanıcıları ve kimin neyi göreceğini o belirler.
        </p>
      </div>
      <KurulumFormu />
    </main>
  );
}
