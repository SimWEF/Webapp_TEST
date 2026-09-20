import json

CONTENEURS = """
30042923|WEEU 112003-3|Equipement 4 Palette
30042921|WEEU 112001-2|Equipement 4 Tuyaux
30041536|WEEU 061601-3|ETV1
30029966|WEFU 031801-2|2G3
30026110|WEEU 051702-6|ETV2
30026109|WEEU 051701-0|ETV4
30023321|WEEU 091601-0|1G2
30011262|WEEU 081301-2|1G1
1610976|WEEU 120821-1|Equipement 1
1610971|WEEU 120816-6|2G5
1607347|WEEU 090606-0|2G2
224039|TPSU 210107-2|2G1
30026111|WEEU 051703-1|ETV3
30085181|LGTN 017127-3|1G3
30000130|WEEU 151010-8|2G4
30026489|WEEU 061704-6|1G4
1610970|WEEU 120815-0|1G5
30083797|LGTN 017003-0|Equipement 2
224034|TPSU 210109-3|Equipement 3
314180|MGBU 220786-6|BOM1
30003985|WEFU 071001-8|BOM2
30042924|WEEU 112004|
"""

BOX = """
30049203|Servante #Serv_4
30049202|Servante #Serv_3
30049201|Servante #Serv_2
30049200|Servante #Serv_1
30050366|Enclosure #58
30049154|Enclosure #55
30032079|Enclosure #54
30049153|Enclosure #53
30049152|Enclosure #52
30032097|Enclosure #51
30050368|demi Enclosure #57
30050367|demi Enclosure #56
30049164|Caisse Raccord #Rac_4
30049163|Caisse Raccord #Rac_3
30049162|Caisse Raccord #Rac_2
30049161|Caisse Raccord #Rac_1
30049177|Caisse à pomme #CaP_9
30049176|Caisse à pomme #CaP_8
30049175|Caisse à pomme #CaP_7
30049174|Caisse à pomme #CaP_6
30049173|Caisse à pomme #CaP_5
30049172|Caisse à pomme #CaP_4
30049171|Caisse à pomme #CaP_3
30049170|Caisse à pomme #CaP_2
30049187|Caisse à pomme #CaP_16
30049183|Caisse à pomme #CaP_15
30049182|Caisse à pomme #CaP_14
30049181|Caisse à pomme #CaP_13
30049180|Caisse à pomme #CaP_12
30049179|Caisse à pomme #CaP_11
30049178|Caisse à pomme #CaP_10
30049169|Caisse à pomme #CaP_1
30049142|BOX #DAV 4
30049141|BOX #DAV 3
30049140|BOX #DAV 2
30049139|BOX #DAV 1
30049159|BOX #83
30032073|BOX #82
30032100|BOX #81
30032022|BOX #80
30049157|BOX #75
30049156|BOX #74
30032072|BOX #43
30032071|BOX #42
30032030|BOX #41
30032029|BOX #40
30049149|BOX #39
30049148|BOX #38
30032028|BOX #37
30032078|BOX #36
30050398|BOX #33
30032069|BOX #32
30032027|BOX #31
30032026|BOX #30
30032077|BOX #24
30032076|BOX #23
30053602|BOX #227-3/3
30053601|BOX #226-2/3
30053600|BOX #225-1/3
30049749|BOX #222-4/6
30049748|BOX #221-3/6
30049747|BOX #220-2/6
30032095|BOX #22
30049746|BOX #219-1/6
30049745|BOX #218-5/5
30049744|BOX #217-4/5
30049743|BOX #216-3/5
30049742|BOX #215-2/5
30049741|BOX #214-1/5
30049740|BOX #213-4/4
30049739|BOX #212-3/4
30049738|BOX #211-2/4
30049737|BOX #210-1/4
30032094|BOX #21
30049735|BOX #208-3/3
30049734|BOX #207-2/3
30049733|BOX #206-1/3
30049730|BOX #203-4/4
30049729|BOX #202-3/4
30049728|BOX #201-2/4
30049727|BOX #200-1/4
30050276|BOX #153
30050275|BOX #152
30050274|BOX #151
30049542|BOX #150
30032037|BOX #15
3031991|BOX #14
30032017|BOX #129
30032025|BOX #128
30032101|BOX #127
30032109|BOX #124
30032081|BOX #123
30052007|BOX #111
30052006|BOX #110
30049160|BOX #109
30032032|BOX #108
30032075|BOX #107
30032023|BOX #106
30032074|BOX #105
30032099|BOX #104
30032080|BOX #103
30032098|BOX #102
30032031|BOX #100
30049167|Aspirateur #Venturi 3
30049166|Aspirateur #Venturi 2
30049165|Aspirateur #Venturi 1
30033447|CART #01
30033343|CART #02
30033359|CART #03
30033326|CART #04
30033352|CART #05
30033369|CART #06
30033333|CART #07
30033332|TPO #01
30033368|TPO #02
30033351|TPO #03
30033325|TPO #04
30033358|TPO #05
30033342|TPO #06
30033315|TPO #07
30033317|SPICE #01
30033344|SPICE #02
30033360|SPICE #03
30033327|SPICE #04
30033353|SPICE #05
30033370|SPICE #06
30033334|SPICE #07
30033320|CAVALRI #01
30033347|CAVALRI #02
30033363|CAVALRI #03
30033330|CAVALRI #04
30033355|CAVALRI #05
30033337|CAVALRI #06
30033321|Sac de câble #01
30033348|Sac de câble #02
30033364|Sac de câble #03
30033331|Sac de câble #04
30033356|Sac de câble #05
30033375|Sac de câble #06
30033338|Sac de câble #07
30033318|SPICE-TP-T1 #001
30033329|SPICE-TP-T1 #002
30033345|SPICE-TP-T1 #003
30033378|SPICE-TP-T1 #004
30033319|SPICE-TP-T2 #001
30033336|SPICE-TP-T2 #002
30033346|SPICE-TP-T2 #003
30033379|SPICE-TP-T2 #004
30033361|SPICE-TP-T3 #001
30033372|SPICE-TP-T3 #002
30033362|SPICE-TP-T4 #001
30033373|SPICE-TP-T4 #002
30033382|Spice Guide #01
30033385|Spice Guide #02
30033397|Spice Guide #03
30033398|Spice Guide #04
30033340|PERCHE #F16315
30033357|PERCHE #F16307
30033376|PERCHE #F16313
30033323|PERCHE #F16311
30033349|PERCHE #F16145
30033365|PERCHE #F16312
30033339|PERCHE #F16314
30033322|Extraction Corps #01
30033350|Extraction Corps #02
30033366|Extraction Corps #03
30033341|Extraction Corps #04
30033391|Extraction Corps #05
30049786|Extraction Corps #06
30050337|Vrac Roll #01
30050338|Vrac Roll #02
30050339|Vrac Roll #03
30050340|Vrac Roll #04
30050341|Vrac Roll #05
30050342|Vrac Roll #06
30050343|Vrac Roll #07
30050344|Vrac Roll #08
30050345|Vrac Roll #09
30050346|Vrac Roll #10
30124645|Vrac Roll #11
30033324|Extraction CART #01
30033396|Extraction CART #02
30033367|Extraction CART #03
30033328|SPICE-SAX #001
30033354|SPICE-SAX #002
30033371|SPICE-SAX #003
30042223|SPICE-SAX #004
30050310|Sonde 6mm #01
30050311|Sonde 6mm #02
30050312|Sonde 6mm #03
30049792|SPICE-PE5 #003
30050508|Altimétrie #001
30049209|SKID BES #G1
30049211|SKID BEP #G1
30049212|SKID Pompe HP #1G1
30049213|SKID Pompe HP #2G1
30049214|SKID Régul HP #G1
30049324|Pallette de câble #G1
30049261|SKID BES #G2
30049269|SKID BEP #G2
30049273|SKID Pompe HP #1G2
30049277|SKID Pompe HP #2G2
30049281|SKID Régul HP #G2
30049325|Pallette de câble #G2
30049262|SKID BES #G3
30049270|SKID BEP #G3
30049274|SKID Pompe HP #1G3
30049278|SKID Pompe HP #2G3
30049282|SKID Régul HP #G3
30049326|Pallette de câble #G3
30049271|SKID BEP #G4
30049275|SKID Pompe HP #1G4
30049279|SKID Pompe HP #2G4
30049283|SKID Régul HP #G4
30049327|Pallette de câble #G4
30052063|Baie Lançage #06
30052064|Armoire de puissance lançage #01
30049264|SKID BES #G5
30049272|SKID BEP #G5
30049276|SKID Pompe HP #1G5
30049280|SKID Pompe HP #2G5
30049284|SKID Régul HP #G5
30049328|Pallette de câble #G5
30049634|SKID Pompe HP #3G5
30033173|Pompe Wilden #03
30033178|Pompe Wilden #08
30033181|Pompe Wilden #11
30049204|SKID Préfiltration #G1
30049210|SKID Filtration #G1
30049215|Pupitre #G1
30049216|Groupe froid #G1
30033175|Pompe Wilden #09
30033176|Pompe Wilden #01
30049205|SKID Préfiltration #G2
30049265|SKID Filtration #G2
30049285|Pupitre #G2
30049289|Groupe froid #G2
30033177|Pompe Wilden #05
30033174|Pompe Wilden #07
30033179|Pompe Wilden #06
30049206|SKID Préfiltration #G3
30049266|SKID Filtration #G3
30049291|Groupe froid #G3
30049219|Pompe Wilden #15
30049217|Pompe Wilden #13
30049221|Pompe Wilden #17
30049207|SKID Préfiltration #G4
30049267|SKID Filtration #G4
30049287|Pupitre #G4
30049290|Groupe froid #G4
30033170|Pompe Wilden #04
30033171|Pompe Wilden #02
30049208|SKID Préfiltration #G5
30049222|Pompe Wilden #18
30049268|SKID Filtration #G5
30049288|Pupitre #G5
30049292|Groupe froid #G5
30127709|BOX #XX
30049750|BOX #223 - 5/6
30049751|BOX #224 - 6/6
30032033|BOX #120
30032034|BOX #121
30032035|BOX #122
"""

# Equipements serialises avec N°SAP (onglet Parametres_Equipements)
EQUIP = """
30032370|Adaptateur droit - 1300 #B31
30032452|Adaptateur droit - 1300 #B33
30032453|Adaptateur droit - 1300 #B35
30032373|Adaptateur droit - 1300 #B37
30032450|Adaptateur gauche - 1300 #B30
30032451|Adaptateur gauche - 1300 #B32
30032371|Adaptateur gauche - 1300 #B34
30032372|Adaptateur gauche - 1300 #B36
30032440|Aspi TO - 1300 #A24
30032362|Aspi TO - 1300 #A25
30032363|Aspi TO - 1300 #A26
30032441|Aspi TO - 1300 #A27
30042110|Aspi TO - 1300 #A49
30042111|Aspi TO - 1300 #A50
30032768|Aspi TO - 51B/BR #A07
30032769|Aspi TO - 51B/BR #A08
30032770|Aspi TO - 51B/BR #A09
30032885|Aspi TO - 51B/BR #A11
30032886|Aspi TO - 51B/BR #A12
30042109|Aspi TP - 1300 #A19
30032360|Aspi TP - 1300 #A20
30032361|Aspi TP - 1300 #A21
30032438|Aspi TP - 1300 #A22
30032439|Aspi TP - 1300 #A23
30042107|Aspi TP - 1300 #A24
30042108|Aspi TP - 1300 #A26
30032765|Aspi TP - 51B/BR #A01
30032766|Aspi TP - 51B/BR #A02
30032767|Aspi TP - 51B/BR #A03
30032882|Aspi TP - 51B/BR #A04
30032883|Aspi TP - 51B/BR #A05
30032884|Aspi TP - 51B/BR #A06
30032934|Aspi TP - 5X19/4722 #A17
30032935|Aspi TP - 5X19/4722 #A18
30032936|Aspi TP - 5X19/4722 #A19
30032937|Aspi TP - 5X19/4722 #A28
30032510|Aspi TP - 5X19/4722 #A33
30032511|Aspi TP - 5X19/4722 #A34
30032506|Aspi TP - 5XF #A29
30032507|Aspi TP - 5XF #A30
30032508|Aspi TP - 5XF #A31
30032509|Aspi TP - 5XF #A32
40004375|Balance #40004375
40004377|Balance #40004377
40004928|Balance #40004928
30032591|Cable Enclosure - 100_1
30032592|Cable Enclosure - 100_2
30032600|Cable Enclosure - 100_3
30032601|Cable Enclosure - 100_4
30032593|Cable Enclosure - 50_1
30032602|Cable Enclosure - 50_2
30032963|Cable Enclosure - 50_3
30032964|Cable Enclosure - 50_4
30032092|Caisse PDR - 92
30032061|Caisse PDR - 93
30032004|Caisse PDR - 94
30041461|Caméra - DAV1_1
30041462|Caméra - DAV1_2
30041473|Caméra - DAV3_1
30041474|Caméra - DAV3_2
30041479|Caméra - DAV4_1
30041480|Caméra - DAV4_2
30041464|Casques - DAV1 x4
30041470|Casques - DAV2 x4
30041476|Casques - DAV3 x4
30041482|Casques - DAV4 x4
30050367|demi Enclosure - 56
30050368|demi Enclosure - 57
30032565|Drive Unit - 1300 #D16
30032566|Drive Unit - 1300 #D17
30033167|Drive Unit - 1300 #D18
30032572|Drive Unit - 1300 #D19
30032573|Drive Unit - 1300 #D20
30032097|Enclosure - 51
30049152|Enclosure - 52
30049153|Enclosure - 53
30032079|Enclosure - 54
30049154|Enclosure - 55
30050366|Enclosure - 58
30032006|Fasteners - 1300 #135
30032012|Fasteners - 1300 #136
30032050|Fasteners - 51B/BR #130
30032051|Fasteners - 51B/BR #131
30032062|Fasteners - 51B/BR #132
30032093|Fasteners - 900 #133
30032068|Fasteners - 900 #134
30032018|Fasteners - 900 #137
30032603|Fixture S1 #100
30033151|Fixture S1 #102
30033011|Fixture S1 #103
30033154|Fixture S1 #104
30032976|Fixture S1 #105
30032979|Fixture S1 #107
30032610|Fixture S1 #108
30032381|JP TO - 1300 #J29
30032382|JP TO - 1300 #J30
30032459|JP TO - 1300 #J31
30032460|JP TO - 1300 #J32
30032461|JP TO - 1300 #J33
30032462|JP TO - 1300 #J34
30032383|JP TO - 1300 #J35
30032384|JP TO - 1300 #J39
30032897|JP TO - 51B/BR #J07
30032790|JP TO - 51B/BR #J08
30032792|JP TO - 51B/BR #J10
30032898|JP TO - 51B/BR #J11
30032900|JP TO - 51B/BR #J12
30033112|JP TO - 51B/BR #J13
30033113|JP TO - 51B/BR #J14
30032456|JP TP - 1300 #J23
30032379|JP TP - 1300 #J25
30032380|JP TP - 1300 #J26
30032457|JP TP - 1300 #J27
30032458|JP TP - 1300 #J28
30032785|JP TP - 51B/BR #J01
30032786|JP TP - 51B/BR #J02
30032787|JP TP - 51B/BR #J03
30032788|JP TP - 51B/BR #J04
30032896|JP TP - 51B/BR #J05
30032515|JP TP - 5X19/4722 #J19
30032516|JP TP - 5X19/4722 #J20
30032521|JP TP - 5X19/4722 #J37
30032522|JP TP - 5X19/4722 #J38
30032454|Kit anti-éclaboussure - 1300 #B40
30032455|Kit anti-éclaboussure - 1300 #B41
30032374|Kit anti-éclaboussure - 1300 #B42
30032375|Kit anti-éclaboussure - 1300 #B43
30032781|Kit anti-éclaboussure - 900 #B45
30032782|Kit anti-éclaboussure - 900 #B46
30032783|Kit anti-éclaboussure - 900 #B47
30032784|Kit anti-éclaboussure - 900 #B48
30032893|Kit anti-éclaboussure - 900 #B49
30032894|Kit anti-éclaboussure - 900 #B50
30032047|Lance S1 - 900 #L50
30032048|Lance S1 - 900 #L51
30032009|Lance S1 - 900 #L52
30032055|Lance S1 - 900 #L53
30032056|Lance S1 - 900 #L54
30032057|Lance S1 - 900 #L55
30031999|Lance S1 -1300 #L56
30032000|Lance S1 -1300 #L57
30032010|Lance S1 -1300 #L58
30032011|Lance S1 -1300 #L59
30042085|Lance S1 -1300 #L60
30042086|Lance S1 -1300 #L61
30032007|Mini-Lance - 1300 #L19
30032015|Mini-Lance - 1300 #L20
30031997|Mini-Lance - 1300 #L21
30031998|Mini-Lance - 1300 #L22
30032008|Mini-Lance - 1300 #L23
30032016|Mini-Lance - 1300 #L24
30042045|Mini-Lance - 1300 #L25
30042046|Mini-Lance - 1300 #L26
30042047|Mini-Lance - 1300 #L27
30042048|Mini-Lance - 1300 #L28
30032063|Mini-Lance - 900 #L01
30032013|Mini-Lance - 900 #L02
30032014|Mini-Lance - 900 #L03
30032064|Mini-Lance - 900 #L04
30032091|Mini-Lance - 900 #L05
30032065|Mini-Lance - 900 #L06
30032052|Mini-Lance - LH #L07
30032053|Mini-Lance - LH #L08
30032044|Mini-Lance - LH #L09
30032045|Mini-Lance - LH #L10
30032046|Mini-Lance - LH #L11
30032054|Mini-Lance - LH #L12
30032949|Obturateur TO - 900 #C01
30032950|Obturateur TO - 900 #C02
30032951|Obturateur TO - 900 #C03
30032512|Obturateur TO - 900 #C12
30032513|Obturateur TO - 900 #C13
30032514|Obturateur TO - 900 #C15
30032795|Pige TO - 900 #P02
30032796|Pige TO - 900 #P03
30032945|Pige TO - 900 #P12
30032946|Pige TO - 900 #P13
30032523|Pige TO - 900 #P20
30032524|Pige TO - 900 #P21
30032525|Pige TO - 900 #P22
30033120|Pige TO - 51B/BR #P09
30004192|Splitter Codeur_1
30004199|Splitter Codeur_2
30004209|Splitter Codeur_3
30004229|Splitter Codeur_4
30004239|Splitter Codeur_5
30004193|Splitter Power_1
30004200|Splitter Power_2
30004210|Splitter Power_3
30004230|Splitter Power_4
30004240|Splitter Power_5
30041459|Switch - DAV1_1
30041460|Switch - DAV1_2
30041465|Switch - DAV2_1
30041466|Switch - DAV2_2
30041471|Switch - DAV3_1
30041472|Switch - DAV3_2
30041477|Switch - DAV4_1
30041478|Switch - DAV4_2
30041467|Switch Caméra - DAV2_1
30041468|Switch Caméra - DAV2_2
"""


def parse(bloc, n):
    out = []
    for ligne in bloc.strip().splitlines():
        parts = [p.strip() for p in ligne.split("|")]
        while len(parts) < n:
            parts.append("")
        out.append(parts[:n])
    return out


codes = {}
doublons = []

for sap, ref, aff in parse(CONTENEURS, 3):
    if not sap:
        continue
    cible = f"{aff} ({ref})" if aff else ref
    codes[sap] = {
        "type": "conteneur",
        "cible": cible,
        "libelle": aff or ref,
        "reference": ref,
    }

for sap, nom in parse(BOX, 2):
    if not sap:
        continue
    if sap in codes:
        doublons.append((sap, codes[sap]["cible"], nom))
        continue
    codes[sap] = {"type": "caisse", "cible": nom, "libelle": nom}

for sap, nom in parse(EQUIP, 2):
    if not sap:
        continue
    if sap in codes:
        doublons.append((sap, codes[sap]["cible"], nom))
        continue
    codes[sap] = {"type": "equipement", "cible": nom, "libelle": nom}

data = {
    "_note": "Table de correspondance code scanne -> element PIGVS. Genere depuis PIGVS - BD_Materiel.xlsx (onglets Parametres_Conteneurs, Parametres_Box, Parametres_Equipements).",
    "_aide": {
        "conteneur": "cible = nom utilise dans conteneurs.json / colisage-data.json",
        "caisse": "cible = nom exact de la caisse dans colisage-data.json (le # est conserve)",
        "equipement": "cible = designation de l'equipement (module Etat materiel a venir)",
    },
    "_statistiques": {
        "conteneurs": sum(1 for v in codes.values() if v["type"] == "conteneur"),
        "caisses": sum(1 for v in codes.values() if v["type"] == "caisse"),
        "equipements": sum(1 for v in codes.values() if v["type"] == "equipement"),
        "total": len(codes),
    },
    "codes": dict(sorted(codes.items())),
}

with open("/mnt/user-data/outputs/codes-sap.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(json.dumps(data["_statistiques"], indent=2))
print("\nDoublons SAP ignores (le 1er gagne) :", len(doublons))
for d in doublons:
    print("  ", d[0], "->", d[1], " // ignore:", d[2])
