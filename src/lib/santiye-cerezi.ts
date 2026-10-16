/** Girişte seçilen şantiye. Çıkışta silinir; amblemden bilerek (onaylayarak) değiştirilebilir. */
export const SANTIYE_CEREZI = "santiye";

export const CEREZ_AYARI = {
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
  sameSite: "lax" as const,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
};
