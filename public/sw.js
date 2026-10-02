/*
 * İnşaat Günlükleri service worker (Y1, çevrimdışı çalışma).
 *
 * - Uygulama dosyaları (/_next/static) ilk açılışta telefona kaydedilir.
 * - Kayıt formları (günlük, hatalı iş, karar), ana sayfa ve Bekleyenler,
 *   internet varken her açılışta tazelenir; internet yokken telefondaki
 *   kopyadan açılır.
 * - Kayıtların kendisi burada değil, sayfadaki kuyrukta (IndexedDB) bekler.
 * Sürüm değişince eski kopyalar silinir.
 */
const SURUM = "v1";
const STATIK = "statik-" + SURUM;
const SAYFA = "sayfa-" + SURUM;
const HAZIR = ["/", "/gunluk/yeni", "/hatali/yeni", "/karar/yeni", "/bekleyenler"];

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (e) => {
  e.waitUntil(
    (async () => {
      for (const ad of await caches.keys()) if (ad !== STATIK && ad !== SAYFA) await caches.delete(ad);
      await self.clients.claim();
    })(),
  );
});

const statikMi = (url) => url.pathname.startsWith("/_next/static/") || /\.(png|ico|svg|webmanifest|woff2?)$/.test(url.pathname);

/** Sayfanın kullandığı uygulama dosyalarını da kaydeder (sayfa ilk kez internetsiz açılırsa eksik kalmasın). */
async function dosyalariniKaydet(html) {
  const c = await caches.open(STATIK);
  const yollar = [...new Set([...html.matchAll(/["'(](\/_next\/static\/[^"'()\s\\]+)/g)].map((m) => m[1]))];
  await Promise.all(
    yollar.map(async (y) => {
      if (await c.match(y)) return;
      try {
        const r = await fetch(y);
        if (r.ok) await c.put(y, r);
      } catch {
        /* sonra yeniden denenir */
      }
    }),
  );
}

/** İnternet varken hazır sayfaları tazeler. Yönlendirilen (giriş, şantiye seçimi) sayfa kaydedilmez. */
async function isit(sayfalar) {
  const c = await caches.open(SAYFA);
  for (const yol of sayfalar) {
    try {
      const r = await fetch(yol, { credentials: "same-origin", cache: "no-store" });
      if (!r.ok || r.redirected) continue;
      const html = await r.clone().text();
      await c.put(yol, r);
      await dosyalariniKaydet(html);
    } catch {
      return;
    }
  }
}

self.addEventListener("message", (e) => {
  const v = e.data || {};
  if (v.tip === "isit") e.waitUntil(isit((v.sayfalar || HAZIR).filter((y) => HAZIR.includes(y))));
  // Çıkışta / başka kullanıcı girişinde önceki kullanıcının sayfaları silinir.
  if (v.tip === "temizle") e.waitUntil(caches.delete(SAYFA));
});

const INTERNETSIZ = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>İnternet yok</title><style>body{font-family:system-ui,sans-serif;margin:0;padding:24px;background:#fff;color:#1c1c1c}
a{display:block;margin:12px 0;padding:18px;border-radius:16px;background:#ffb627;color:#000;font-weight:700;font-size:20px;text-decoration:none;text-align:center}
a.ikinci{background:#eee}</style></head><body><h1>İnternet yok</h1>
<p>Bu sayfa internet olmadan açılamıyor. Kayıt girmek için:</p>
<a href="/gunluk/yeni">Yeni Günlük</a><a href="/hatali/yeni">Hatalı İş Bildir</a><a href="/karar/yeni">Yeni Karar</a>
<a class="ikinci" href="/bekleyenler">Bekleyen kayıtlar</a><a class="ikinci" href="/">Ana sayfa</a></body></html>`;

self.addEventListener("fetch", (e) => {
  const istek = e.request;
  if (istek.method !== "GET") return;
  const url = new URL(istek.url);
  if (url.origin !== self.location.origin) return;

  if (statikMi(url)) {
    e.respondWith(
      (async () => {
        const c = await caches.open(STATIK);
        const var_ = await c.match(istek);
        if (var_) return var_;
        const r = await fetch(istek);
        if (r.ok) c.put(istek, r.clone());
        return r;
      })(),
    );
    return;
  }

  if (istek.mode === "navigate") {
    e.respondWith(
      (async () => {
        try {
          const r = await fetch(istek);
          if (r.ok && !r.redirected && HAZIR.includes(url.pathname)) {
            const kopya = r.clone();
            caches.open(SAYFA).then((c) => c.put(url.pathname, kopya));
          }
          return r;
        } catch {
          const c = await caches.open(SAYFA);
          return (
            (await c.match(url.pathname)) ||
            new Response(INTERNETSIZ, { headers: { "Content-Type": "text/html; charset=utf-8" } })
          );
        }
      })(),
    );
  }
});

/*
 * Bildirim (push): sunucudan gelen bildirim kilit ekranına düşer; sessiz
 * saatte ses ve titreşim olmaz. Dokununca ilgili kayıt açılır.
 */
self.addEventListener("push", (e) => {
  let v = {};
  try {
    v = e.data ? e.data.json() : {};
  } catch {
    v = { govde: e.data ? e.data.text() : "" };
  }
  e.waitUntil(
    self.registration.showNotification(v.baslik || "İnşaat Günlükleri", {
      body: v.govde || "",
      icon: "/ikon-192.png",
      badge: "/ikon-192.png",
      tag: v.etiket || undefined,
      silent: Boolean(v.sessiz),
      vibrate: v.sessiz ? undefined : [200, 100, 200],
      data: { url: v.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const hedef = new URL((e.notification.data && e.notification.data.url) || "/", self.location.origin).href;
  e.waitUntil(
    (async () => {
      const pencereler = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const p of pencereler) {
        if ("focus" in p) {
          await p.focus();
          if ("navigate" in p) await p.navigate(hedef);
          return;
        }
      }
      await self.clients.openWindow(hedef);
    })(),
  );
});
