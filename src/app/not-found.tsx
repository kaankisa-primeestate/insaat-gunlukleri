import Link from "next/link";

export default function Bulunamadi() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 p-6 text-center">
      <h1 className="text-3xl font-extrabold">Sayfa bulunamadı</h1>
      <p className="text-soluk">Aradığınız kayıt yok ya da görme yetkiniz bulunmuyor.</p>
      <Link href="/" className="flex min-h-16 items-center justify-center rounded-2xl bg-vurgu text-xl font-bold text-black">
        Ana sayfaya dön
      </Link>
    </main>
  );
}
