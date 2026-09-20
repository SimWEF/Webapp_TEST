/* =========================================================
   PIGVS — Module colisage
   ---------------------------------------------------------
   Centralise la lecture et l'ecriture de colisage-data.json.

   Trois flux Power Automate sont utilises :
     URL_LECTURE_COLISAGE   lit  colisage-data.json  (SharePoint)
     URL_ECRITURE_COLISAGE  ecrit colisage-data.json (SharePoint)
     URL_LECTURE_RELEVE     lit  colisage-reel-<site>.json

   Si une URL n'est pas renseignee, le module bascule
   automatiquement sur le fichier local du depot GitHub.
   L'application continue donc de fonctionner sans flux.

   A inclure :
     <script src="pigvs-colisage.js"></script>
   ========================================================= */
window.PIGVS_COLISAGE = (function () {

  /* ===== 1. URL des flux ================================= */
  const URL_LECTURE_COLISAGE  = "COLLER_ICI_URL_FLUX_LIRE_COLISAGE";
  const URL_ECRITURE_COLISAGE = "https://default516ec17ab92f438b8594e11b6f6bec.79.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/29/workflows/f008674e402b48f2ab7e9949db4666b0/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=8zkf8OV8-XbUMgQjXL8f9-2V49zjv-W_bdEKnx76cMU";
  const URL_LECTURE_RELEVE    = "https://default516ec17ab92f438b8594e11b6f6bec.79.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/23/workflows/ef014ab35c864b658f5c591b188816a6/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=cKYN8kIqKRSN3c8KMDEWNjJnRZKXymMu44qE8BN_Kyk";

  const TIMEOUT_MS = 30000;

  function configure(url) {
    return typeof url === "string" && url.indexOf("COLLER_ICI") !== 0;
  }

  /* ===== 2. Outils ======================================= */
  function norm(s) {
    return (s || "").toString().toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  }

  function cleKey(s) {
    return norm(s).replace(/[^a-z0-9]/g, "");
  }

  function codeSite(site) {
    return norm(site).replace(/\s+/g, "");
  }

  function poster(url, corps) {
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corps),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });
  }

  /* ===== 3. Lecture du colisage de reference ============= */
  function lireColisage() {
    if (configure(URL_LECTURE_COLISAGE)) {
      return poster(URL_LECTURE_COLISAGE, {})
        .then(function (r) {
          if (!r.ok) throw new Error("Flux lecture " + r.status);
          return r.json();
        })
        .then(function (d) {
          d._source = "flux";
          return d;
        })
        .catch(function (err) {
          console.warn("Flux colisage indisponible, lecture locale :", err);
          return lireColisageLocal();
        });
    }
    return lireColisageLocal();
  }

  function lireColisageLocal() {
    return fetch("colisage-data.json", { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (d) { d._source = "local"; return d; });
  }

  /* ===== 4. Ecriture du colisage de reference ============ */
  function ecrireColisage(colisage, auteur) {
    if (!configure(URL_ECRITURE_COLISAGE)) {
      return Promise.resolve({
        ok: false,
        msg: "Flux d'ecriture non configure. Utilisez le telechargement manuel."
      });
    }

    const charge = {
      auteur: auteur || "",
      horodatage: new Date().toISOString(),
      colisage: colisage
    };

    return poster(URL_ECRITURE_COLISAGE, charge)
      .then(function (r) {
        if (r.status === 200) return { ok: true };
        if (r.status === 202) {
          return { ok: false, msg: "Envoi rejete : code d'acces non reconnu." };
        }
        return { ok: false, msg: "Erreur serveur (" + r.status + ")." };
      })
      .catch(function (err) {
        console.error(err);
        if (err && err.name === "TimeoutError") {
          return { ok: false, msg: "Delai depasse : le serveur n'a pas repondu." };
        }
        return { ok: false, msg: "Envoi impossible : connexion ou CORS." };
      });
  }

  /* ===== 5. Lecture d'un releve de site ================== */
  function lireReleve(site) {
    if (configure(URL_LECTURE_RELEVE)) {
      return poster(URL_LECTURE_RELEVE, { site: site })
        .then(function (r) {
          if (!r.ok) throw new Error("Flux releve " + r.status);
          return r.json();
        });
    }
    const nom = "Data-colisage-chantiers/colisage-reel-" + codeSite(site) + ".json";
    return fetch(nom, { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error("Fichier absent");
      return r.json();
    });
  }

  /* ===== 6. Injection des saisies validees =============== */
  /* Remplace le contenu des caisses validees, conserve le reste. */
  function injecter(colisage, saisiesValidees) {
    const resultat = JSON.parse(JSON.stringify(colisage));
    let remplacees = 0;
    let ajoutees = 0;

    (saisiesValidees || []).forEach(function (s) {
      const contenu = [].concat(s.presents || [], s.ajoutes || []);
      const recherche = cleKey(s.caisse);
      let trouve = false;

      (resultat.conteneurs || []).forEach(function (c) {
        (c.caisses || []).forEach(function (k) {
          if (cleKey(k.nom) === recherche) {
            k.items = contenu;
            trouve = true;
            remplacees++;
          }
        });
      });

      if (!trouve) {
        let cible = (resultat.conteneurs || []).find(function (c) {
          return cleKey(c.nom) === cleKey(s.conteneur);
        });
        if (!cible) {
          cible = { nom: s.conteneur || "Non affecte", caisses: [] };
          resultat.conteneurs.push(cible);
        }
        cible.caisses.push({ nom: s.caisse, items: contenu });
        ajoutees++;
      }
    });

    return { colisage: resultat, remplacees: remplacees, ajoutees: ajoutees };
  }

  return {
    lireColisage: lireColisage,
    ecrireColisage: ecrireColisage,
    lireReleve: lireReleve,
    injecter: injecter,
    cleKey: cleKey,
    norm: norm,
    codeSite: codeSite,
    ecritureDisponible: function () { return configure(URL_ECRITURE_COLISAGE); },
    lectureDisponible: function () { return configure(URL_LECTURE_COLISAGE); },
    releveDisponible: function () { return configure(URL_LECTURE_RELEVE); }
  };
})();
