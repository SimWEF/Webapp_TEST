/* ==========================================================
   PIGVS Service Worker
   Version : 4.0

   PRINCIPE
   Les fichiers de DONNEES ne sont jamais servis depuis le
   cache quand le reseau est disponible. Plus besoin de
   changer APP_CACHE pour voir un colisage mis a jour.
   ========================================================== */

   const APP_CACHE = "pigvs-app-v40";
   const DATA_CACHE = "pigvs-data-v14";
   
   /* ==========================================================
      Fichiers de DONNEES
      Toujours rafraichis depuis le reseau (Network First strict).
      Le cache ne sert que de secours hors ligne.
      ========================================================== */
   const FICHIERS_DONNEES = [
     "colisage-data.json",
     "chantiers.json",
     "centrales.json",
     "codes-sap.json",
     "caisses.json",
     "conteneurs.json",
     "sites.json",
     "equipements.json",
     "depannage-data.json",
     "depannage-navigation.json",
     "sousEnsemble.json",
     "etatEquipements.json",
   ];
   
   function estFichierDonnees(pathname) {
     if (pathname.includes("/Data-colisage-chantiers/")) return true;
     if (/\/info-[^/]+\.json$/i.test(pathname)) return true;
     if (/\/colisage-reel-[^/]+\.json$/i.test(pathname)) return true;
     return FICHIERS_DONNEES.some((nom) => pathname.endsWith("/" + nom));
   }
   
   /* ==========================================================
      Fichiers d'APPLICATION
      Mis en cache a l'installation.
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
     "colisage-consultation.html",
     "colisage-saisie.html",
     "scan.html",
     "rex.html",
     "info.html",
     "quizz.html",
     "depannage.html",
     "login.html",
     "admin-colisage-validation.html",
     "colisage-conteneur-saisie.html",
   
     /* --- Styles et manifeste --- */
     "style.css",
     "manifest.json",
   
     /* --- Scripts --- */
     "pigvs-chantier.js",
     "pigvs-envoi.js",
     "pigvs-auth.js",
     "pigvs-scan.js",
     "pigvs-colisage.js",
   
     /* --- Images --- */
     "icon-192.png",
     "icon-512.png",
   ];
   
   /* ==========================================================
      Installation
      ========================================================== */
   self.addEventListener("install", (event) => {
     event.waitUntil(
       caches
         .open(APP_CACHE)
         /* allSettled : un fichier manquant ne bloque pas l'installation */
         .then((cache) => Promise.allSettled(APP_FILES.map((url) => cache.add(url))))
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
     if (event.request.method !== "GET") return;
   
     const url = new URL(event.request.url);
   
     /* ======================================================
        CAS 1 : fichiers de DONNEES
        Reseau prioritaire, en contournant le cache HTTP.
        Le cache local n'est utilise qu'en cas de coupure.
        ====================================================== */
     if (estFichierDonnees(url.pathname)) {
       event.respondWith(
         fetch(event.request, { cache: "no-store" })
           .then((response) => {
             if (response && response.ok) {
               const copie = response.clone();
               caches
                 .open(DATA_CACHE)
                 .then((cache) => cache.put(event.request, copie));
             }
             return response;
           })
           .catch(() =>
             caches.match(event.request).then(
               (cached) =>
                 cached ||
                 new Response("{}", {
                   headers: { "Content-Type": "application/json" },
                 })
             )
           )
       );
       return;
     }
   
     /* ======================================================
        CAS 2 : fichiers Data-quizz
        ====================================================== */
     if (url.pathname.includes("/Data-quizz/")) {
       event.respondWith(
         fetch(event.request)
           .then((response) => {
             const copie = response.clone();
             caches
               .open(DATA_CACHE)
               .then((cache) => cache.put(event.request, copie));
             return response;
           })
           .catch(() => caches.match(event.request))
       );
       return;
     }
   
     /* ======================================================
        CAS 3 : application
        Network First, cache en secours.
        ====================================================== */
     event.respondWith(
       fetch(event.request)
         .then((response) => {
           const copie = response.clone();
           caches.open(APP_CACHE).then((cache) => cache.put(event.request, copie));
           return response;
         })
         .catch(() => caches.match(event.request))
     );
   });
   
   /* ==========================================================
      Purge manuelle du cache de donnees
      Depuis une page :
          navigator.serviceWorker.controller
            .postMessage({ action: "purger-donnees" });
      ========================================================== */
   self.addEventListener("message", (event) => {
     if (event.data && event.data.action === "purger-donnees") {
       caches.delete(DATA_CACHE).then(() => {
         if (event.source) {
           event.source.postMessage({ action: "donnees-purgees" });
         }
       });
     }
   });
   