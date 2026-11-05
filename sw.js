// DOCULAB service worker.
// Estrategia: red primero para los archivos propios (así los cambios publicados
// llegan sin tener que borrar la caché) y caché como respaldo sin conexión.
const CACHE = "doculab-v17";
const FILES = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./js/model-builder.js",
  "./js/document-editor.js",
  "./manifest.webmanifest",
  "./assets/icon.svg",
  "./models/index.json",
  "./models/guia-academica-modular/model.json"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // Fuentes y otros orígenes externos: sin intervención.
  if (url.origin !== self.location.origin) return;
  // El puente local de IA nunca se cachea.
  if (url.pathname.startsWith("/api/")) return;

  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request).then(cached => cached || caches.match("./index.html")))
  );
});
