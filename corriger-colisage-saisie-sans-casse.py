from pathlib import Path
import sys, shutil

p = Path(sys.argv[1] if len(sys.argv) > 1 else 'colisage-saisie.html')
if not p.exists():
    raise SystemExit(f'Fichier introuvable : {p}')

s = p.read_text(encoding='utf-8')
bak = p.with_suffix(p.suffix + '.bak')
if not bak.exists():
    shutil.copy2(p, bak)
changes = []

# IMPORTANT : ce script ne modifie JAMAIS le nom caisses.json.

old = '''        /* Catalogue pour l'autocompletion des ajouts */
        CATALOGUE = C.catalogue(COLISAGE, sap);

        const vues = {};'''
new = '''        /* Catalogue pour l'autocompletion des ajouts.
           Le module actuel expose catalogueEquipements(), qui est asynchrone. */
        CATALOGUE = [];

        const vues = {};'''
if old in s:
    s = s.replace(old, new, 1)
    changes.append('appel C.catalogue() invalide supprime')

needle = '''        listeBrute.forEach(function (nom) {
          const k = cleKey(nom);
          if (!vues[k]) {
            vues[k] = true;
            CAISSES.push({ nom: nom, conteneur: "", nbItems: null });
          }
        });

        const params = new URLSearchParams(location.search);'''
insert = '''        listeBrute.forEach(function (nom) {
          const k = cleKey(nom);
          if (!vues[k]) {
            vues[k] = true;
            CAISSES.push({ nom: nom, conteneur: "", nbItems: null });
          }
        });

        /* Charge le catalogue sans bloquer la recherche de caisses. */
        if (typeof C.catalogueEquipements === "function") {
          C.catalogueEquipements(COLISAGE)
            .then(function (liste) {
              CATALOGUE = Array.isArray(liste) ? liste : [];
              console.log("PIGVS :", CAISSES.length, "caisses ;", CATALOGUE.length, "equipements");
            })
            .catch(function (err) {
              console.warn("Catalogue equipements indisponible :", err);
              CATALOGUE = catalogueDepuisColisageEtSap(COLISAGE, sap);
            });
        } else {
          CATALOGUE = catalogueDepuisColisageEtSap(COLISAGE, sap);
        }

        const params = new URLSearchParams(location.search);'''
if needle in s:
    s = s.replace(needle, insert, 1)
    changes.append('catalogueEquipements() charge correctement')

marker = '''      /* =========================================================
         OUTILS
         ========================================================= */'''
fallback = '''      /* =========================================================
         CATALOGUE LOCAL DE SECOURS
         ========================================================= */
      function catalogueDepuisColisageEtSap(colisage, sap) {
        const vus = {};
        const liste = [];
        function ajouter(nom) {
          const texte = (nom || "").toString().trim();
          const k = cleKey(texte);
          if (!k || vus[k]) return;
          vus[k] = true;
          liste.push(texte);
        }
        (colisage && colisage.conteneurs || []).forEach(function (conteneur) {
          (conteneur.caisses || []).forEach(function (caisse) {
            (caisse.items || []).forEach(ajouter);
          });
        });
        const codes = (sap && sap.codes) || {};
        Object.keys(codes).forEach(function (code) {
          const entree = codes[code];
          if (entree && entree.type === "equipement" && entree.cible) ajouter(entree.cible);
        });
        return liste.sort(function (a, b) {
          return a.localeCompare(b, "fr", { sensitivity: "base" });
        });
      }

'''
if marker in s and 'function catalogueDepuisColisageEtSap' not in s:
    s = s.replace(marker, fallback + marker, 1)
    changes.append('fallback catalogue ajoute')

# Compatibilite avec le format de tracabilite du module actuel.
old = 'const v = caisseActive.caisse.derniereValidation;'
new = 'const v = caisseActive.caisse.derniereValidation || caisseActive.caisse.verif;'
if old in s:
    s = s.replace(old, new, 1)
    changes.append('compatibilite verif/derniereValidation ajoutee')

p.write_text(s, encoding='utf-8')
print('Fichier corrige :', p)
print('Sauvegarde       :', bak)
for c in changes: print(' -', c)
if not changes:
    print('ATTENTION : aucun motif reconnu ; fichier possiblement deja corrige.')
