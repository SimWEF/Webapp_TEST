window.PIGVS_AUTH = (function () {

    /* ==========================================
       Configuration
       ========================================== */
    const URL_VERIF = "https://default516ec17ab92f438b8594e11b6f6bec.79.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/22/workflows/a1f9cc6711c64d44916c7f64f9d8671d/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=DfYjV_9q9LNYDi8WeTYeJvfQq-b9R9iHY6oo94keDfM";
  
    const KEY_OK   = "pigvs_auth_ok";
    const KEY_CODE = "pigvs_auth_code";
    const KEY_EXP  = "pigvs_auth_exp";
    const KEY_DEVICE = "pigvs_device_id";

    function identifiantAppareil(){
        let id = localStorage.getItem(KEY_DEVICE);
        if(!id){
            id = (window.crypto && crypto.randomUUID)
                ? crypto.randomUUID()
                : String(Date.now()) + "-" + Math.random().toString(36).slice(2);
            localStorage.setItem(KEY_DEVICE, id);
        }
        return id;
    }
  
    const DUREE_JOURS = 3650;
  
    const MAX_ERREURS_LOCAL = 5;
    const BLOCAGE_MINUTES   = 30;
    const DELAI_TENTATIVE   = 2000;
  
    const KEY_FAIL = "pigvs_auth_fail";
    const KEY_LOCK = "pigvs_auth_lock";
  
    /* ==========================================
       Utilitaires
       ========================================== */

    function attendre(ms){
        return new Promise(resolve => setTimeout(resolve, ms));
    }
  
    function estBloqueLocalement(){
        const lock = parseInt(localStorage.getItem(KEY_LOCK) || "0", 10);
        return Date.now() < lock;
    }
  
    function tempsRestantBlocage(){
        const lock = parseInt(localStorage.getItem(KEY_LOCK) || "0", 10);
        if (Date.now() >= lock){
            return 0;
        }
        return Math.ceil((lock - Date.now()) / 60000);
    }
  
    /* ==========================================
       Session
       ========================================== */
    function estAuthentifie(){
        const ok = localStorage.getItem(KEY_OK);
        const exp = parseInt(localStorage.getItem(KEY_EXP) || "0", 10);
  
        if (ok !== "1"){
            return false;
        }
        if (Date.now() > exp){
            deconnecter();
            return false;
        }
        return true;
    }
  
    function getCode(){
        return localStorage.getItem(KEY_CODE) || "";
    }
  
    function deconnecter(){
        localStorage.removeItem(KEY_OK);
        localStorage.removeItem(KEY_CODE);
        localStorage.removeItem(KEY_EXP);
        localStorage.removeItem(KEY_FAIL);
        localStorage.removeItem(KEY_LOCK);
    }
  
    /* ==========================================
       Vérification du code
       ========================================== */
    async function verifierCode(code){
  
        if(estBloqueLocalement()){
            return {
                ok:false,
                msg: "Connexion bloquée " + tempsRestantBlocage() + " min."
            };
        }
  
        await attendre(DELAI_TENTATIVE);
  
        try{
            const rep = await fetch(URL_VERIF, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code: code.trim(),
                    device: identifiantAppareil()
                    })
            });
            if(rep.status === 429){
                return {
                ok: false,
                msg: "Trop de tentatives. Accès bloqué 24 h."
                };
                }
  
            if(rep.ok){
                localStorage.setItem(KEY_OK, "1");
                localStorage.setItem(KEY_CODE, code.trim());
                localStorage.setItem(
                    KEY_EXP,
                    String(Date.now() + DUREE_JOURS * 86400000)
                );
                localStorage.removeItem(KEY_FAIL);
                localStorage.removeItem(KEY_LOCK);
                return { ok:true };
            }
  
            let nbEchecs = parseInt(localStorage.getItem(KEY_FAIL) || "0", 10);
            nbEchecs++;
            localStorage.setItem(KEY_FAIL, nbEchecs);
  
            if(nbEchecs >= MAX_ERREURS_LOCAL){
                localStorage.setItem(
                    KEY_LOCK,
                    String(Date.now() + (BLOCAGE_MINUTES * 60 * 1000))
                );
                return {
                    ok:false,
                    msg: "Trop d'erreurs. Connexion bloquée " + BLOCAGE_MINUTES + " min."
                };
            }
  
            return {
                ok:false,
                msg: "Code incorrect. " + (MAX_ERREURS_LOCAL - nbEchecs) + " tentative(s) restante(s)."
            };
        }
        catch(err){
            console.error(err);
            return { ok:false, msg:"Erreur réseau." };
        }
    }
  
    /* ==========================================
       Protection des pages
       ========================================== */
    function protegerPage(){
        if(!estAuthentifie()){
            const cible = encodeURIComponent(
                location.pathname.split("/").pop() + location.search
            );
            location.replace("login.html?next=" + cible);
        }
    }
  
    /* ==========================================
       Bouton Accueil automatique
       ------------------------------------------
       Injecte un bouton 🏠 dans l'en-tete de CHAQUE page
       possedant un <header class="app-header">.
       Aucune modification page par page n'est donc necessaire :
       il suffit que la page charge pigvs-auth.js, ce qui est
       deja le cas partout (colisage, saisie, consultation,
       conteneur, FDM, REX, photos, depannage, materiel...).
  
       index.html (topbar differente) et admin.html (qui possede
       deja son propre bouton Accueil) ne sont pas impactes.
       ========================================== */
    function injecterBoutonAccueil(){
        const entete = document.querySelector(".app-header");
  
        if(!entete){ return; }                                   /* pas d'en-tete standard */
        if(entete.querySelector(".btn-accueil")){ return; }       /* deja injecte */
  
        const page = location.pathname.split("/").pop().toLowerCase();
        if(page === "index.html" || page === ""){ return; }       /* deja sur l'accueil */
  
        const lien = document.createElement("a");
        lien.className = "btn-accueil";
        lien.href = "index.html";
        lien.title = "Retour à l'accueil";
        lien.setAttribute("aria-label", "Retour à l'accueil");
        lien.textContent = "🏠";
  
        lien.style.cssText =
            "margin-left:auto;" +
            "flex:0 0 auto;" +
            "width:38px;" +
            "height:38px;" +
            "display:flex;" +
            "align-items:center;" +
            "justify-content:center;" +
            "background:rgba(255,255,255,.16);" +
            "border:1px solid rgba(255,255,255,.20);" +
            "border-radius:10px;" +
            "text-decoration:none;" +
            "font-size:18px;" +
            "line-height:1;";
  
        entete.appendChild(lien);
    }
  
    if(document.readyState === "loading"){
        document.addEventListener("DOMContentLoaded", injecterBoutonAccueil);
    } else {
        injecterBoutonAccueil();
    }
  
    return {
        estAuthentifie,
        verifierCode,
        protegerPage,
        getCode,
        deconnecter,
        identifiantAppareil,
        URL_VERIF
    };
  
  })();
  