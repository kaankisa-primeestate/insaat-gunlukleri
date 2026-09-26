import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_KEY } from "./env";

let istemci: ReturnType<typeof createBrowserClient> | undefined;

export function supabaseTarayici() {
  istemci ??= createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
  return istemci;
}
