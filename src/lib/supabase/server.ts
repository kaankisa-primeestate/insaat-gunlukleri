import { createServerClient } from "@supabase/ssr";
import { createClient as createPlainClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { SUPABASE_URL, SUPABASE_KEY } from "./env";

/** Oturumdaki kullanıcı adına çalışan istemci. RLS kuralları geçerlidir. */
export async function supabaseSunucu() {
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(list) {
        try {
          for (const { name, value, options } of list) cookieStore.set(name, value, options);
        } catch {
          // Sunucu bileşeninden çağrıldığında çerez yazılamaz; oturumu proxy tazeler.
        }
      },
    },
  });
}

/**
 * Yönetici istemcisi: RLS'yi atlar. Yalnızca sunucuda, çağıranın yetkisi
 * doğrulandıktan sonra kullanılır (kullanıcı oluşturma, imzalı dosya adresi).
 */
export function supabaseYonetici() {
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SECRET_KEY tanımlı değil");
  return createPlainClient(SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
