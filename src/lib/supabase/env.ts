// Supabase'in Vercel entegrasyonu eski adlarla (ANON / SERVICE_ROLE) da
// değişken tanımlayabilir; hangisi varsa o kullanılır.
export const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabaseHazir = Boolean(SUPABASE_URL && SUPABASE_KEY);
