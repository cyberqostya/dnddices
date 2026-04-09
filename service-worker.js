const CACHE_NAME = "dnd-game-cache-v2";
const urlsToCache = [
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

  "./sounds/roll1.mp3",
  "./sounds/roll2.mp3",
  "./sounds/roll3.mp3",
  "./sounds/roll4.mp3",
  "./sounds/coin.mp3",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME) // оставляем только актуальный кэш
          .map((name) => caches.delete(name)) // удаляем всё старое
      );
    })
  );
});
