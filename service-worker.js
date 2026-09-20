/* ==========================================================
   PIGVS Service Worker
   Version : 3.1
   ========================================================== */

   const APP_CACHE = "pigvs-app-v22";
   const DATA_CACHE = "pigvs-data-v12";
   
   /* ==========================================================
      Fichiers statiques
      ⚠️ Ne PAS ajouter les fichiers colisage-reel-*.json :
         ils changent en permanence, le cache les figerait.
      ========================================================== */
   const APP_FILES = [
     /* --- Pages --- */
     "index.html",
     "fdm.html",
     "photos.html",
     "photo.html",
     "materiel.html",
     "detailSousEnsemble.html",
     "colisage.html",
     "colisage-saisie.html",
     "scan.html",
     "rex.html",
     "info.html",
     "quizz.html",
     "depannage.html",
     "login.html",
     "admin-colisage-validation.html",
     "colisage-consultation.html",
   
     /* --- Styles et manifeste --- */
     "style.css",
     "manifest.json",
   
     /* --- Scripts --- */
     "pigvs-chantier.js",
     "pigvs-envoi.js",
     "pigvs-auth.js",
     "pigvs-scan.js",
   
     /* --- Données de référence --- */
     "colisage-data.json",
     "chantiers.json",
     "centrales.json",
     "codes-sap.json",
     "depannage-data.json",
     "depannage-navigation.json",
     "info-paluel4.json",
     "info-cattenom3.json",
   
     /* --- Images --- */
     "icon-192.png",
     "icon-512.png",
     "logo-wetinghouse.svg",
   ];
   
   
   
   /* ==========================================================
      Installation
      ========================================================== */
   self.addEventListener("install", (event) => {
     event.waitUntil(
       caches.open(APP_CACHE).then((cache) =>
         /* allSettled : un fichier manquant ne bloque pas l'installation */
         Promise.allSettled(APP_FILES.map((url) => cache.add(url)))
       )
     );
     self.skipWaiting();
   });
   
   /* ==========================================================
      Activation
      ========================================================== */
   self.addEventListener("activate", (event) => {
     event.waitUntil(
       caches.keys().then((keys) =>
         Promise.all(
           keys.map((key) => {
             if (key !== APP_CACHE && key !== DATA_CACHE) {
               return caches.delete(key);
             }
           })
         )
       )
     );
     self.clients.claim();
   });
   
   /* ==========================================================
      Fetch
      ========================================================== */
   self.addEventListener("fetch", (event) => {
     if (event.request.method !== "GET") {
       return;
     }
   
     const url = new URL(event.request.url);
   
     /* ======================================================
        CAS 1 : relevés de colisage
        Toujours le réseau, jamais de cache.
        Ces fichiers sont réécrits par Power Automate.
        ====================================================== */
     if (url.pathname.includes("/Data-colisage-chantiers/")) {
       event.respondWith(
         fetch(event.request).catch(
           () =>
             new Response(
               JSON.stringify({ site: "", derniereMaj: "", saisies: [] }),
               { headers: { "Content-Type": "application/json" } }
             )
         )
       );
       return;
     }
   
     /* ======================================================
        CAS 2 : index.json des quizz
        Toujours prioriser le réseau
        ====================================================== */
     if (
       url.pathname.endsWith("/Data-quizz/index.json") ||
       url.pathname.endsWith("Data-quizz/index.json")
     ) {
       event.respondWith(
         fetch(event.request)
           .then((response) => {
             const copy = response.clone();
             caches.open(DATA_CACHE).then((cache) => cache.put(event.request, copy));
             return response;
           })
           .catch(() => caches.match(event.request))
       );
       return;
     }
   
     /* ======================================================
        CAS 3 : fichiers Data-quizz
        Cache dynamique
        ====================================================== */
     if (url.pathname.includes("/Data-quizz/")) {
       event.respondWith(
         caches.open(DATA_CACHE).then(async (cache) => {
           try {
             const response = await fetch(event.request);
             cache.put(event.request, response.clone());
             return response;
           } catch {
             const cached = await cache.match(event.request);
             if (cached) {
               return cached;
             }
             throw new Error("Fichier non disponible hors ligne");
           }
         })
       );
       return;
     }
   
     /* ======================================================
        CAS 4 : application
        Network First
        ====================================================== */
     event.respondWith(
       fetch(event.request)
         .then((response) => {
           const copy = response.clone();
           caches.open(APP_CACHE).then((cache) => cache.put(event.request, copy));
           return response;
         })
         .catch(() => caches.match(event.request))
     );
   });
   