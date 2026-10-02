import { oturum } from "@/lib/oturum";
import { BILDIRIM_TURLERI, vapid } from "@/lib/bildirim";
import { Sayfa } from "@/components/kabuk";
import { TelefonBildirimi } from "./telefon";
import { Tercihler } from "./tercihler";

/**
 * Bildirim ayarları: bu telefonda aç/kapat, hangi türler gelsin, sessiz
 * saatler. Merkez varsayılan olarak her bildirimi alır; istediğini kapatır.
 */
export default async function Bildirimler() {
  const o = await oturum();
  const [{ publicKey }, { data: t }] = await Promise.all([
    vapid(),
    o.supabase.from("bildirim_tercihleri").select("kapali, sessiz, sessiz_bas, sessiz_bit").eq("kullanici_id", o.profil.id).maybeSingle(),
  ]);
  return (
    <Sayfa baslik="Bildirimler">
      <p className="text-soluk">
        Bildirimler telefonun kilit ekranına düşer; uygulama kapalıyken de gelir. Her telefonda ayrı açılır. Kendi yaptığınız
        işlemin bildirimi size gelmez.
      </p>
      <TelefonBildirimi publicKey={publicKey} />
      <Tercihler
        turler={Object.entries(BILDIRIM_TURLERI)}
        kapali={(t?.kapali as string[] | undefined) ?? []}
        sessiz={t?.sessiz ?? true}
        bas={t?.sessiz_bas ?? 20}
        bit={t?.sessiz_bit ?? 7}
      />
    </Sayfa>
  );
}
