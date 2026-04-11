const CACHE_NAME = "dnd-game-cache-v6";

const APP_SHELL = [
  "./",
  "./index.html",
  "./index.css",
  "./index.js",
  "./service-worker.js",

  "./js/audio.js",
  "./js/dice.js",
  "./js/helpers.js",
  "./js/settingsButton.js",
  "./js/telegram.js",
  "./js/total.js",

  "./styles/button.css",
  "./styles/buttons-container.css",
  "./styles/cross.css",
  "./styles/dice.css",

  "./fonts/JainiPurva-Regular.woff2",
  "./fonts/OpenSans-Regular.woff2",
  "./fonts/OpenSans-Medium.woff2",

  "./images/coin.png",
  "./images/d2.svg",
  "./images/d4.svg",
  "./images/d6.svg",
  "./images/d8.svg",
  "./images/d10.svg",
  "./images/d12.svg",
  "./images/d20.svg",
  "./images/d100.svg",
  "./images/favicon.png",

  "./sounds/coin.mp3",
  "./sounds/karmaon.mp3",
  "./sounds/karmaoff.mp3",
  "./sounds/roll1.mp3",
  "./sounds/roll2.mp3",
  "./sounds/roll3.mp3",
  "./sounds/roll4.mp3",
];

async function addAssetsSafely(cache, urls) {
  await Promise.all(
    urls.map(async (url) => {
      try {
        await cache.add(url);
      } catch (error) {
        console.warn("[SW] Failed to precache", url, error);
      }
    }),
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await addAssetsSafely(cache, APP_SHELL);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const requestUrl = new URL(request.url);

  // For any app navigation (including Telegram WebApp URLs with query params), serve app shell.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedIndex = await cache.match("./index.html");
        if (cachedIndex) return cachedIndex;

        try {
          const networkResponse = await fetch(request);
          await cache.put("./index.html", networkResponse.clone());
          return networkResponse;
        } catch {
          return new Response("Offline", { status: 503, statusText: "Offline" });
        }
      })(),
    );
    return;
  }

  // Do not intercept cross-origin requests.
  if (requestUrl.origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      const cached = await caches.match(request, { ignoreSearch: true });
      if (cached) return cached;

      try {
        const networkResponse = await fetch(request);
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, networkResponse.clone());
        return networkResponse;
      } catch {
        return new Response("Offline", { status: 503, statusText: "Offline" });
      }
    })(),
  );
});
