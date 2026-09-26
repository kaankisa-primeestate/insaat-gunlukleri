import Link from "next/link";
import { Pencil } from "lucide-react";
import { GunlukSilDugmesi } from "./sil";

/** Günlük kartında / tablosunda Düzenle ve Sil. */
export function GunlukIslemleri({ id }: { id: string }) {
  return (
    <>
      <Link href={`/gunluk/${id}/duzenle`} className="flex min-h-11 items-center gap-1.5 rounded-xl bg-vurgu px-3 font-bold text-black">
        <Pencil className="size-5" /> Düzenle
      </Link>
      <GunlukSilDugmesi id={id} />
    </>
  );
}
