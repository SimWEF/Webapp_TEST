/* =========================================================
   PIGVS — Module de scan code-barres / QR code
   ---------------------------------------------------------
   Utilise l'API native BarcodeDetector (Chrome Android, HTTPS).
   Si elle n'est pas disponible, le module le signale et la page
   bascule automatiquement sur la saisie manuelle.

   À inclure :
     <script src="pigvs-scan.js"></script>

   Usage :
     if (PIGVS_SCAN.disponible()) {
       PIGVS_SCAN.ouvrir(function (code) {
         console.log("Code lu :", code);
       });
     }
   ========================================================= */
window.PIGVS_SCAN = (function () {

  /* Formats reconnus : codes-barres industriels + QR */
  const FORMATS = [
    "qr_code",
    "code_128",
    "code_39",
    "code_93",
    "ean_13",
    "ean_8",
    "itf",
    "data_matrix"
  ];

  let overlay = null;
  let flux = null;
  let boucle = null;
  let detecteur = null;

  /* --- L'API est-elle utilisable ? --- */
  function disponible() {
    return (
      "BarcodeDetector" in window &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === "function"
    );
  }

  /* --- Construction de l'overlay caméra --- */
  function creerOverlay() {
    const el = document.createElement("div");
    el.id = "pigvs-scan-overlay";
    el.innerHTML = `
      <div class="scan-cadre">
        <video id="pigvs-scan-video" playsinline muted></video>
        <div class="scan-viseur"></div>
      </div>
      <p class="scan-aide">Placez le code dans le cadre</p>
      <button type="button" class="scan-annuler">Annuler</button>
    `;

    const style = document.createElement("style");
    style.textContent = `
      #pigvs-scan-overlay {
        position: fixed;
        inset: 0;
        z-index: 9999;
        background: #000;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 18px;
      }

      #pigvs-scan-overlay .scan-cadre {
        position: relative;
        width: 100%;
        max-width: 520px;
        aspect-ratio: 3 / 4;
        overflow: hidden;
      }

      #pigvs-scan-overlay video {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      #pigvs-scan-overlay .scan-viseur {
        position: absolute;
        left: 8%;
        right: 8%;
        top: 32%;
        height: 36%;
        border: 3px solid #0078d7;
        border-radius: 14px;
        box-shadow: 0 0 0 100vmax rgba(0, 0, 0, 0.45);
      }

      #pigvs-scan-overlay .scan-aide {
        color: #fff;
        font-size: 15px;
        margin: 0;
      }

      #pigvs-scan-overlay .scan-annuler {
        background: rgba(255, 255, 255, 0.16);
        border: 1px solid rgba(255, 255, 255, 0.3);
        color: #fff;
        font-size: 16px;
        font-weight: 700;
        padding: 13px 28px;
        border-radius: 12px;
        cursor: pointer;
      }
    `;

    el.appendChild(style);
    return el;
  }

  /* --- Ouverture du scanner --- */
  async function ouvrir(onCode, onErreur) {
    if (!disponible()) {
      if (onErreur) onErreur("Scanner non disponible sur cet appareil.");
      return;
    }

    overlay = creerOverlay();
    document.body.appendChild(overlay);
    overlay.querySelector(".scan-annuler").addEventListener("click", fermer);

    const video = overlay.querySelector("#pigvs-scan-video");

    try {
      flux = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      video.srcObject = flux;
      await video.play();
    } catch (err) {
      console.error(err);
      fermer();
      if (onErreur) onErreur("Accès à la caméra refusé.");
      return;
    }

    try {
      detecteur = new BarcodeDetector({ formats: FORMATS });
    } catch (err) {
      /* Certains appareils ne supportent qu'une partie des formats */
      detecteur = new BarcodeDetector();
    }

    boucle = setInterval(async function () {
      if (!video.videoWidth) return;
      try {
        const resultats = await detecteur.detect(video);
        if (resultats && resultats.length) {
          const code = (resultats[0].rawValue || "").trim();
          if (code) {
            if (navigator.vibrate) navigator.vibrate(120);
            fermer();
            onCode(code);
          }
        }
      } catch (err) {
        /* Erreur ponctuelle de lecture : on continue */
      }
    }, 300);
  }

  /* --- Fermeture et libération de la caméra --- */
  function fermer() {
    if (boucle) {
      clearInterval(boucle);
      boucle = null;
    }
    if (flux) {
      flux.getTracks().forEach(function (piste) {
        piste.stop();
      });
      flux = null;
    }
    if (overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
    overlay = null;
    detecteur = null;
  }

  return { disponible, ouvrir, fermer, FORMATS };
})();
