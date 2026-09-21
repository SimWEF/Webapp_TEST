#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PIGVS — Patch automatique : Colisage conteneur
=================================================

Ce script modifie 2 fichiers automatiquement :

  1. colisage.html
     Ajoute la tuile "Renseigner un conteneur" entre les deux
     tuiles existantes (Renseigner le colisage / Consulter).

  2. pigvs-colisage.js
     Ajoute la logique injecterConteneur() : quand une saisie
     porte niveauColisage === "conteneur", la fonction injecter()
     met à jour la LISTE DES CAISSES d'un conteneur au lieu du
     contenu d'une caisse.

Il NE touche PAS à :
  - admin-colisage-validation.html  (aucune modification requise,
    le relevé conteneur réutilise exactement le même schéma que
    le relevé caisse : Caisse/Conteneur/NbPrevus/Presents/...)
  - colisage-consultation.html      (facultatif, non modifié ici)
  - service-worker.js               (voir INSTRUCTIONS-manuelles.txt)
  - le flux Power Automate          (voir INSTRUCTIONS-manuelles.txt)

Chaque fichier modifié est sauvegardé dans Archives/ avant modification.
Si un anchor de recherche ne correspond pas exactement à ton fichier,
le script NE MODIFIE RIEN pour ce point précis et affiche un message
clair — il ne devine jamais et ne casse donc jamais un fichier.

Usage, depuis la racine de la WebApp (Webapp_TEST) :

    python patch_colisage_conteneur.py .

"""

import re
import sys
from pathlib import Path

ROOT = Path(sys.argv[1] if len(sys.argv) > 1 else ".")


def charger(nom):
    p = ROOT / nom
    if not p.exists():
        print(f"❌ IGNORÉ : {nom} introuvable dans {ROOT.resolve()}")
        return None, None
    return p, p.read_text(encoding="utf-8")


def sauver(p, contenu, modifs):
    if not modifs:
        print(f"ℹ️  {p.name} : aucune modification appliquée (voir détails ci-dessus).")
        return
    archives = ROOT / "Archives"
    archives.mkdir(exist_ok=True)
    bak = archives / (p.name + ".bak")
    if not bak.exists():
        bak.write_text(p.read_text(encoding="utf-8"), encoding="utf-8")
    p.write_text(contenu, encoding="utf-8")
    print(f"✅ {p.name} mis à jour :")
    for m in modifs:
        print("   -", m)
    print(f"   (sauvegarde : Archives/{bak.name})")


# =====================================================================
#  1. colisage.html — ajouter la tuile "Renseigner un conteneur"
# =====================================================================
def patch_colisage_html():
    p, s = charger("colisage.html")
    if not p:
        return
    modifs = []

    if "colisage-conteneur-saisie.html" in s:
        print("ℹ️  colisage.html : la tuile existe déjà, rien à faire.")
        return

    # Nouvelle tuile, insérée juste après la tuile "Renseigner le colisage"
    nouvelle_tuile = '''        <a class="module violet" href="colisage-conteneur-saisie.html">
          <div class="module-head">
            <span class="module-ico">🚛</span>
            <div>
              <h2>Renseigner un conteneur</h2>
              <p>Vérifier les caisses réellement chargées</p>
            </div>
          </div>
          <div class="module-foot">
            <span class="tags">Caisses · Écarts · Scan</span>
            <span class="fleche">→</span>
          </div>
        </a>
'''

    # Ancre : fin de la tuile "Renseigner le colisage" (juste avant la
    # tuile "Consulter le colisage"). On cherche la fermeture </a> qui
    # précède la carte bleue de consultation.
    motif = re.compile(
        r'(</a>\s*)(<a class="module bleu" href="colisage-consultation\.html">)'
    )

    nouveau_s, n = motif.subn(r"\1" + nouvelle_tuile + r"\2", s, count=1)

    if n == 1:
        s = nouveau_s
        modifs.append("Ajout de la tuile « Renseigner un conteneur »")
    else:
        print(
            "⚠️  colisage.html : ancre non trouvée (structure différente de "
            "celle attendue). Aucune modification appliquée sur ce fichier.\n"
            "    Ajoute manuellement ce bloc juste avant la carte "
            "\"Consulter le colisage\" :\n"
        )
        print(nouvelle_tuile)

    sauver(p, s, modifs)


# =====================================================================
#  2. pigvs-colisage.js — logique de colisage conteneur
# =====================================================================
def patch_pigvs_colisage_js():
    p, s = charger("pigvs-colisage.js")
    if not p:
        return
    modifs = []

    if "injecterConteneur" in s:
        print("ℹ️  pigvs-colisage.js : la logique conteneur existe déjà, rien à faire.")
        return

    # ------------------------------------------------------------
    # 2a. Insérer un aiguillage en tête de la boucle forEach de injecter()
    # ------------------------------------------------------------
    motif_boucle = re.compile(
        r"(\(saisiesValidees \|\| \[\]\)\.forEach\(function \(s\) \{\s*\n)"
    )

    aiguillage = (
        r"\1"
        "      /* Colisage de conteneur : la saisie contient une liste\n"
        "         de CAISSES (pas d'équipements). On la traite à part. */\n"
        "      if (s && s.niveauColisage === \"conteneur\") {\n"
        "        injecterConteneur(resultat, s, auteur);\n"
        "        return;\n"
        "      }\n\n"
    )

    nouveau_s, n1 = motif_boucle.subn(aiguillage, s, count=1)

    if n1 == 1:
        s = nouveau_s
        modifs.append("Ajout de l'aiguillage conteneur dans injecter()")
    else:
        print(
            "⚠️  pigvs-colisage.js : impossible de localiser le début de la "
            "boucle dans injecter(saisiesValidees). Correction manuelle requise "
            "(voir INSTRUCTIONS-manuelles.txt, section A)."
        )

    # ------------------------------------------------------------
    # 2b. Ajouter les fonctions injecterConteneur() et
    #     trouverCaisseDansColisage() juste avant le "return {" final
    #     qui expose l'API publique du module.
    # ------------------------------------------------------------
    nouvelles_fonctions = '''
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
      console.warn(
        "Conteneur introuvable pour l'injection :",
        saisie.conteneur || saisie.caisse
      );
      return;
    }

    const nomsPresents = [].concat(saisie.presents || [], saisie.ajoutes || []);
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

      /* Copie profonde : evite de partager le meme objet si une
         caisse existait deja ailleurs dans le colisage. */
      nouvelles.push(JSON.parse(JSON.stringify(objet)));
    });

    /* Les caisses retirees du conteneur ne sont pas perdues : on
       les archive dans colisage.caissesNonAffectees pour ne pas
       effacer leur contenu (equipements) au cas ou elles seraient
       simplement deplacees vers un autre conteneur plus tard. */
    colisage.caissesNonAffectees = colisage.caissesNonAffectees || [];

    const clesPresentes = {};
    nomsPresents.forEach(function (nom) {
      clesPresentes[cleKey(nom)] = true;
    });

    anciennes.forEach(function (caisse) {
      if (!clesPresentes[cleKey(caisse.nom)]) {
        const dejaArchivee = colisage.caissesNonAffectees.some(function (c) {
          return cleKey(c.nom) === cleKey(caisse.nom);
        });
        if (!dejaArchivee) {
          colisage.caissesNonAffectees.push(caisse);
        }
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

'''

    motif_return = re.compile(r"\n(\s*)return \{\s*\n\s*lireColisage:")
    m = motif_return.search(s)

    if m:
        pos = m.start()
        s = s[:pos] + "\n" + nouvelles_fonctions + s[pos:]
        modifs.append("Ajout de injecterConteneur() et trouverCaisseDansColisage()")
    else:
        print(
            "⚠️  pigvs-colisage.js : impossible de localiser le \"return { "
            "lireColisage: ...\" final. Correction manuelle requise "
            "(voir INSTRUCTIONS-manuelles.txt, section B)."
        )

    sauver(p, s, modifs)


# =====================================================================
if __name__ == "__main__":
    print(f"PIGVS — Patch colisage conteneur\nDossier : {ROOT.resolve()}\n")
    patch_colisage_html()
    print()
    patch_pigvs_colisage_js()
    print(
        "\nTerminé.\n"
        "Étapes restantes (non automatisables, voir INSTRUCTIONS-manuelles.txt) :\n"
        "  1. Ajouter colisage-conteneur-saisie.html au service worker\n"
        "  2. Ajouter 1 ligne dans le flux Power Automate de réception\n"
        "  3. Incrémenter APP_CACHE\n"
    )
