from pathlib import Path
import json, re, unicodedata, sys
from difflib import SequenceMatcher

ROOT = Path(sys.argv[1] if len(sys.argv) > 1 else '.')
E = json.loads((ROOT / 'equipements.json').read_text(encoding='utf-8'))
C = json.loads((ROOT / 'colisage-data.json').read_text(encoding='utf-8'))

def norm(s):
    s = unicodedata.normalize('NFD', str(s).lower())
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z0-9]+', ' ', s).strip()

def quantite(s):
    m = re.search(r'\bx\s*(\d+)\b', s, re.I)
    return int(m.group(1)) if m else 1

def code(s):
    m = re.search(r'(?<![A-Za-z0-9])#?([A-Za-z]{1,2}\d{1,3})(?![A-Za-z0-9])', s)
    if not m:
        return None
    x = m.group(1).upper()
    mm = re.fullmatch(r'([A-Z]{1,2})(\d+)', x)
    if mm and len(mm.group(2)) == 1:
        x = mm.group(1) + '0' + mm.group(2)
    return x

par_code = {}
for e in E:
    c = code(e)
    if c:
        par_code.setdefault(c, []).append(e)

def eclater(raw):
    cs = re.findall(r'(?<![A-Za-z0-9])([A-Za-z]{1,2}\d{1,3})(?![A-Za-z0-9])', raw)
    if len(cs) > 1 and '/' in raw:
        famille = re.split(r'\b[A-Za-z]{1,2}\d{1,3}\b', raw, maxsplit=1)[0].strip(' -/#')
        return [famille + ' #' + c for c in cs]
    return [raw]

def meilleure_correspondance(raw, caisse):
    nr = norm(raw)
    c = code(raw)
    if 'mini lance' in nr and c and c.startswith('L'):
        x = int(c[1:])
        cible = (f'Mini-Lance - 1300 #L{x}' if 19 <= x <= 28 else
                 f'Mini-Lance - 900 #L{x:02d}' if 1 <= x <= 6 else
                 f'Mini-Lance - LH #L{x:02d}' if 7 <= x <= 12 else None)
        if cible in E:
            return cible, 1.0
    exact = [e for e in E if norm(e) == nr]
    if exact:
        return exact[0], 1.0
    candidats = par_code.get(c, []) if c else []
    if candidats:
        b = max(candidats, key=lambda e: SequenceMatcher(None, nr, norm(e)).ratio())
        sc = SequenceMatcher(None, nr, norm(b)).ratio()
        if sc >= 0.45:
            return b, round(0.8 + 0.2 * sc, 3)
    b = max(E, key=lambda e: SequenceMatcher(None, nr, norm(e)).ratio())
    sc = SequenceMatcher(None, nr, norm(b)).ratio()
    return (b, round(sc, 3)) if sc >= 0.72 else (raw, round(sc, 3))

rapport = []
mapped = unresolved = 0
for cont in C.get('conteneurs', []):
    for caisse in cont.get('caisses', []):
        nouveaux = []
        for raw in caisse.get('items', []):
            morceaux = eclater(raw)
            for morceau in morceaux:
                nom, confiance = meilleure_correspondance(morceau, caisse.get('nom', ''))
                qte = 1 if len(morceaux) > 1 else quantite(raw)
                statut = 'mapped' if nom != raw or confiance >= 0.99 else 'unresolved'
                mapped += statut == 'mapped'
                unresolved += statut == 'unresolved'
                nouveaux.append({'equipement': nom, 'quantite': qte})
                rapport.append({
                    'conteneur': cont.get('nom', ''),
                    'caisse': caisse.get('nom', ''),
                    'origine': raw,
                    'equipement': nom,
                    'quantite': qte,
                    'confiance': confiance,
                    'statut': statut
                })
        caisse['items'] = nouveaux

C['_schemaItems'] = 'Chaque item est un objet {equipement, quantite}. Source : equipements.json.'
C['_normalisation'] = {
    'source': 'equipements.json',
    'elements_mappes': mapped,
    'elements_a_verifier': unresolved,
    'rapport': 'rapport-normalisation-colisage.json'
}

(ROOT / 'colisage-data-quantites.json').write_text(json.dumps(C, ensure_ascii=False, indent=2), encoding='utf-8')
(ROOT / 'rapport-normalisation-colisage.json').write_text(json.dumps(rapport, ensure_ascii=False, indent=2), encoding='utf-8')
print(f'OK : {mapped} correspondances, {unresolved} éléments à vérifier')
