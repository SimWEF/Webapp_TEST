/* =========================================================
   PIGVS — Module colisage
   Version 2
   ---------------------------------------------------------
   Quatre flux Power Automate sont utilises :

     URL_LECTURE_COLISAGE   lit   colisage-data.json
     URL_ECRITURE_COLISAGE  ecrit colisage-data.json
     URL_LECTURE_RELEVE     lit   colisage-reel-<site>.json
     URL_ECRITURE_RELEVE    ecrit colisage-reel-<site>.json   <-- NOUVEAU

   Le 4e flux permet d'enregistrer les decisions de validation.
   Sans lui, une caisse validee reapparait a chaque
   rafraichissement car le statut n'existe que dans le
   navigateur.

   Si une URL n'est pas renseignee, le module bascule
   automatiquement sur le fichier local du depot GitHub.
   ========================================================= */
   window.PIGVS_COLISAGE = (function () {

    /* ===== 1. URL des flux ================================= */
    const URL_LECTURE_COLISAGE  = "https://default516ec17ab92f438b8594e11b6f6bec.79.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/17/workflows/c27505f048a54a24987594f26fbe942f/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=mRoLxGiwrMtFKVELGEv5zQDFDRd7hd3vWfLN3jAA4Pc";
    const URL_ECRITURE_COLISAGE = "https://default516ec17ab92f438b8594e11b6f6bec.79.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/29/workflows/f008674e402b48f2ab7e9949db4666b0/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=8zkf8OV8-XbUMgQjXL8f9-2V49zjv-W_bdEKnx76cMU";
    const URL_LECTURE_RELEVE    = "https://default516ec17ab92f438b8594e11b6f6bec.79.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/23/workflows/ef014ab35c864b658f5c591b188816a6/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=cKYN8kIqKRSN3c8KMDEWNjJnRZKXymMu44qE8BN_Kyk";
    const URL_ECRITURE_RELEVE   = "https://default516ec17ab92f438b8594e11b6f6bec.79.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/27/workflows/0d99cf1ffb3e43bb9b26c85f41f9df1e/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=WfBFcEck4pnSJaOBYCK9vjc9VjaJtBxaGevproNw68I";
  
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
  
    /* Date lisible : 20/09/2026 */
    function dateCourte(iso) {
      if (!iso) return "";
      const d = new Date(iso);
      if (isNaN(d.getTime())) return String(iso).substring(0, 10);
      return d.toLocaleDateString("fr-FR");
    }
  
    /* Anciennete en jours */
    function joursDepuis(iso) {
      if (!iso) return null;
      const d = new Date(iso);
      if (isNaN(d.getTime())) return null;
      return Math.floor((Date.now() - d.getTime()) / 86400000);
    }
  
    function poster(url, corps) {
      var controleur = new AbortController();
      var minuteur = setTimeout(function () {
        controleur.abort();
      }, TIMEOUT_MS);
  
      return fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corps),
        cache: "no-store",
        signal: controleur.signal
      }).then(
        function (r) { clearTimeout(minuteur); return r; },
        function (e) { clearTimeout(minuteur); throw e; }
      );
    }
  
    /* ===== 3. Lecture du colisage de reference ============= */
    function lireColisage() {
      if (configure(URL_LECTURE_COLISAGE)) {
        return poster(URL_LECTURE_COLISAGE, {})
          .then(function (r) {
            if (!r.ok) throw new Error("Flux lecture " + r.status);
            return r.json();
          })
          .then(function (d) { d._source = "flux"; return d; })
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
          return { ok: false, msg: "Erreur serveur (" + r.status + ")." };
        })
        .catch(function (err) {
          console.error(err);
          if (err && err.name === "AbortError") {
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
  
    /* ===== 6. Ecriture d'un releve  (NOUVEAU) ==============
       Permet d'enregistrer durablement les statuts
       valide / rejete / publie.
       ====================================================== */
    function ecrireReleve(site, releve, auteur) {
      if (!configure(URL_ECRITURE_RELEVE)) {
        return Promise.resolve({
          ok: false,
          msg: "Flux d'ecriture du releve non configure.",
          nonConfigure: true
        });
      }
  
      const charge = {
        site: site,
        auteur: auteur || "",
        horodatage: new Date().toISOString(),
        releve: releve
      };
  
      return poster(URL_ECRITURE_RELEVE, charge)
        .then(function (r) {
          if (r.status === 200) return { ok: true };
          return { ok: false, msg: "Erreur serveur (" + r.status + ")." };
        })
        .catch(function (err) {
          console.error(err);
          return { ok: false, msg: "Enregistrement impossible : connexion ou CORS." };
        });
    }
  
    /* ===== 7. Injection des saisies validees ===============
       Remplace le contenu des caisses validees et ajoute
       la tracabilite de la derniere verification.
       ====================================================== */
       function injecter(colisage, saisiesValidees, valideur) {
        const resultat = JSON.parse(JSON.stringify(colisage));
        let remplacees = 0;
        let ajoutees = 0;
      
        /* Convertit les elements d'une saisie (chaine simple, ou objet
           {equipement, quantite} / {equipement, quantitePresente/quantitePrevue})
           vers le format standard {equipement, quantite} utilise dans
           colisage-data.json. */
        function normaliserElement(x) {
          if (x && typeof x === "object") {
            const nom = x.equipement || x.nom || "";
            const q = Math.max(
              1,
              parseInt(x.quantitePresente ?? x.quantite ?? x.quantitePrevue ?? 1, 10)
            );
            return { equipement: nom, quantite: q };
          }
          /* Chaine simple (ancien format, ou nom de caisse pour un conteneur) */
          return x;
        }
      
        function normaliserListe(liste) {
          return (liste || []).map(normaliserElement).filter(function (x) {
            return typeof x === "string" ? x.trim() !== "" : !!x.equipement;
          });
        }
      
        (saisiesValidees || []).forEach(function (s) {
          const estSaisieConteneur =
            s &&
            (
              s.niveauColisage === "conteneur" ||
              s.NiveauColisage === "conteneur" ||
              (
                cleKey(s.caisse) === cleKey(s.conteneur) &&
                cleKey(s.conteneur) !== ""
              )
            );

            if (estSaisieConteneur) {
              injecterConteneur(resultat, s, valideur);
              remplacees++;
              return;
            }
      
          const contenu = [].concat(normaliserListe(s.presents), normaliserListe(s.ajoutes));
          const recherche = cleKey(s.caisse);
      
          const verif = {
            date: new Date().toISOString(),
            site: s.site || "",
            operateur: s.operateur || "",
            valideur: valideur || "",
            nbManquants: s.nbManquants || 0,
            nbAjoutes: s.nbAjoutes || 0
          };
      
          let trouve = false;
      
          (resultat.conteneurs || []).forEach(function (c) {
            (c.caisses || []).forEach(function (k) {
              if (cleKey(k.nom) === recherche) {
                k.items = contenu;
                k.verif = verif;
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
            cible.caisses.push({ nom: s.caisse, items: contenu, verif: verif });
            ajoutees++;
          }
        });
      
        return { colisage: resultat, remplacees: remplacees, ajoutees: ajoutees };
      }
  
    /* ===== 8. Catalogue des equipements ====================
       Fusionne :
         - les equipements de codes-sap.json
         - tous les items deja presents dans le colisage
       Sert a proposer une liste lors de l'ajout d'un element.
       ====================================================== */
    let _catalogue = null;
  
    function catalogueEquipements(colisage) {
      if (_catalogue) return Promise.resolve(_catalogue);
  
      const depuisColisage = [];
      (colisage && colisage.conteneurs ? colisage.conteneurs : []).forEach(function (c) {
        (c.caisses || []).forEach(function (k) {
          (k.items || []).forEach(function (i) {
            if (i) depuisColisage.push(i);
          });
        });
      });
  
      return fetch("codes-sap.json", { cache: "no-store" })
        .then(function (r) { return r.json(); })
        .catch(function () { return { codes: {} }; })
        .then(function (d) {
          const codes = (d && d.codes) || {};
          const depuisSap = [];
  
          Object.keys(codes).forEach(function (sap) {
            const e = codes[sap];
            if (e && e.type === "equipement" && e.cible) {
              depuisSap.push(e.cible);
            }
          });
  
          /* Dedoublonnage sur la cle normalisee */
          const vues = {};
          const liste = [];
  
          depuisSap.concat(depuisColisage).forEach(function (nom) {
            const k = cleKey(nom);
            if (k && !vues[k]) {
              vues[k] = true;
              liste.push(nom);
            }
          });
  
          liste.sort(function (a, b) {
            return a.localeCompare(b, "fr", { sensitivity: "base" });
          });
  
          _catalogue = liste;
          return liste;
        });
    }

  /* ===== Colisage conteneur =============================== */
  /* Une saisie "conteneur" contient une liste de CAISSES presentes,
     manquantes et ajoutees (champs Presents/Manquants/Ajoutes,
     identiques au format des saisies de caisse mais avec des NOMS
     DE CAISSES au lieu de noms d'equipements).
     Cette fonction reconstruit la liste caisses[] du conteneur
     concerne, en reutilisant les objets caisse existants (avec
     leurs equipements) quand ils sont deja connus. */
     function injecterConteneur(colisage, saisie, valideur) {
      const cible = (colisage.conteneurs || []).find(function (c) {
        return cleKey(c.nom) === cleKey(saisie.conteneur || saisie.caisse);
      });
    
      if (!cible) {
        console.warn("Conteneur introuvable pour l'injection :", saisie.conteneur || saisie.caisse);
        return;
      }
    
      const cleConteneur = cleKey(cible.nom);
    
      /* Empeche un conteneur de contenir une "caisse" portant son propre nom */
      const nomsPresents = []
        .concat(saisie.presents || [], saisie.ajoutes || [])
        .map(function (nom) {
          return typeof nom === "string"
            ? nom.trim()
            : String(nom || "").trim();
        })
        .filter(function (nom) {
          if (!nom) return false;

          if (cleKey(nom) === cleConteneur) {
            console.warn(
              "Ignoré : une caisse ne peut pas porter le nom du conteneur (" +
              nom +
              ")"
            );
            return false;
          }

          return true;
        });
    
      const anciennes = cible.caisses || [];
      const nouvelles = [];
    
      nomsPresents.forEach(function (nom) {
        let objet = anciennes.find(function (caisse) {
          return cleKey(caisse.nom) === cleKey(nom);
        });
        if (!objet) {
          objet = trouverCaisseDansColisage(colisage, nom);
        }
        if (!objet) {
          objet = { nom: nom, items: [] };
        }
        nouvelles.push(JSON.parse(JSON.stringify(objet)));
      });
    
      colisage.caissesNonAffectees = colisage.caissesNonAffectees || [];
      const clesPresentes = {};
      nomsPresents.forEach(function (nom) { clesPresentes[cleKey(nom)] = true; });
    
      anciennes.forEach(function (caisse) {
        if (!clesPresentes[cleKey(caisse.nom)]) {
          const dejaArchivee = colisage.caissesNonAffectees.some(function (c) {
            return cleKey(c.nom) === cleKey(caisse.nom);
          });
          if (!dejaArchivee) colisage.caissesNonAffectees.push(caisse);
        }
      });
    
      cible.caisses = nouvelles;
      cible.verif = {
        date: new Date().toISOString(),
        site: saisie.site || "",
        operateur: saisie.operateur || "",
        valideur: valideur || "",
        nbManquants: Number(saisie.nbManquants || 0),
        nbAjoutes: Number(saisie.nbAjoutes || 0)
      };
    }

  /* Cherche une caisse (avec ses equipements) n'importe ou dans le
     colisage : dans un conteneur, ou dans les caisses archivees
     precedemment desaffectees. */
  function trouverCaisseDansColisage(colisage, nom) {
    const recherche = cleKey(nom);

    for (const conteneur of colisage.conteneurs || []) {
      const trouve = (conteneur.caisses || []).find(function (caisse) {
        return cleKey(caisse.nom) === recherche;
      });
      if (trouve) return trouve;
    }

    return (colisage.caissesNonAffectees || []).find(function (caisse) {
      return cleKey(caisse.nom) === recherche;
    }) || null;
  }


  
    return {
      lireColisage: lireColisage,
      ecrireColisage: ecrireColisage,
      lireReleve: lireReleve,
      ecrireReleve: ecrireReleve,
      injecter: injecter,
      catalogueEquipements: catalogueEquipements,
      cleKey: cleKey,
      norm: norm,
      codeSite: codeSite,
      dateCourte: dateCourte,
      joursDepuis: joursDepuis,
      ecritureDisponible: function () { return configure(URL_ECRITURE_COLISAGE); },
      lectureDisponible: function () { return configure(URL_LECTURE_COLISAGE); },
      releveDisponible: function () { return configure(URL_LECTURE_RELEVE); },
      ecritureReleveDisponible: function () { return configure(URL_ECRITURE_RELEVE); }
    };
  })();
  