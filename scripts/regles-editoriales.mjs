/**
 * Respi.info : règles éditoriales partagées par le générateur (scripts/build.mjs) et par les robots.
 * Toute modification ici s'applique à tous les contrôles bloquants.
 */

export const TYPES = {
  fond: { label: "Article de fond", minMots: 700, maxMots: 1400, minSources: 3, minDomaines: 2, heureDefaut: "07:00", maxParJour: 2 },
  pratique: { label: "Conseil pratique", minMots: 300, maxMots: 650, minSources: 2, minDomaines: 1, heureDefaut: "14:00", maxParJour: 3 },
};
// Plafond de sécurité : le volume suit l'actualité (moins les jours calmes, plus les jours chargés), sans dépasser ce total.
export const MAX_ARTICLES_PAR_JOUR = 4;

export const THEMATIQUES = {
  bpco: "BPCO",
  asthme: "Asthme",
  allergies: "Allergies",
  pollens: "Pollens",
  "qualite-air": "Qualité de l'air",
  fibrose: "Fibrose pulmonaire",
  mucoviscidose: "Mucoviscidose",
  htap: "HTAP",
  bronchectasies: "Bronchectasies",
  etp: "Éducation thérapeutique",
  traitements: "Traitements",
  aidants: "Aidants",
  recherche: "Recherche",
  "activite-physique": "Activité physique",
  "vie-quotidienne": "Vie quotidienne",
};

// Pathologies reconnues par schema.org (champ « about » du JSON-LD)
export const CONDITIONS = {
  asthme: "Asthme",
  bpco: "Bronchopneumopathie chronique obstructive",
  fibrose: "Fibrose pulmonaire",
  mucoviscidose: "Mucoviscidose",
  htap: "Hypertension artérielle pulmonaire",
  bronchectasies: "Bronchectasies",
};

// Liste blanche OFFICIELLE : au moins une source de chaque article doit venir de cette liste.
// Le domaine de la source doit être égal à l'une de ces entrées ou en être un sous-domaine.
export const DOMAINES_OFFICIELS = [
  // Autorités sanitaires françaises
  "has-sante.fr", "santepubliquefrance.fr", "ansm.sante.fr", "sante.gouv.fr", "solidarites-sante.gouv.fr",
  "ameli.fr", "sante.fr", "vaccination-info-service.fr", "tabac-info-service.fr", "pour-les-personnes-agees.gouv.fr",
  "service-public.fr", "legifrance.gouv.fr", "ecologie.gouv.fr", "anses.fr", "inserm.fr", "ars.sante.fr",
  "drees.solidarites-sante.gouv.fr", "academie-medecine.fr", "meteofrance.com", "meteofrance.fr",
  // Tous les sites de l'État (ministères, préfectures, ARS) : alertes pollution, feux de forêt, canicule, grand froid
  "gouv.fr",
  // Qualité de l'air et pollens (fédération et associations agréées)
  "atmo-france.org", "airparif.fr", "atmo-occitanie.org", "atmosud.org", "atmo-auvergnerhonealpes.fr",
  "atmo-nouvelleaquitaine.org", "airpl.org", "atmo-hdf.fr", "atmo-grandest.eu", "ligair.fr", "airbreizh.asso.fr",
  "atmo-bfc.org", "atmo-normandie.fr", "qualitair-corse.org", "ambroisie-risque.info", "pollens.fr",
  // Institutions internationales et européennes
  "who.int", "ecdc.europa.eu", "eea.europa.eu", "ema.europa.eu", "atmosphere.copernicus.eu",
  // Sociétés savantes et recommandations
  "goldcopd.org", "ginasthma.org", "splf.fr", "ersnet.org", "thoracic.org",
  // Bases scientifiques
  "pubmed.ncbi.nlm.nih.gov", "ncbi.nlm.nih.gov", "cochranelibrary.com", "cochrane.org",
  // Associations et fondations de référence
  "lesouffle.org", "fondation-du-souffle.fr", "vaincrelamuco.org", "respifil.fr",
];

// Autres sources RECONNUES (revues scientifiques, associations de patients, presse médicale de référence).
// Toute source doit appartenir à DOMAINES_OFFICIELS ou à DOMAINES_RECONNUS.
export const DOMAINES_RECONNUS = [
  "nejm.org", "thelancet.com", "bmj.com", "jamanetwork.com", "nature.com", "atsjournals.org", "ersjournals.com",
  "em-consulte.com", "sciencedirect.com", "frontiersin.org", "plos.org", "biomedcentral.com",
  "ffaair.org", "asthme-allergies.org", "sante-respiratoire.com", "bpco-asso.com", "aphp.fr",
  "vidal.fr", "pasteur.fr", "insee.fr", "copernicus.eu", "europa.eu",
];

export const ELEMENTS_SOURCE = "Titre, Média | https://...";

// Typographie maison et confidentialité (vérifiés sur le titre, la description, le texte alternatif et le corps)
export const INTERDITS_TYPO = [
  { re: /[–—]/, msg: "tiret cadratin ou demi-cadratin interdit (utiliser une virgule, deux-points ou des parenthèses)" },
  { re: /\bqu['’]on\b/i, msg: "« qu'on » interdit (reformuler)" },
  { re: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i, msg: "adresse e-mail interdite" },
  { re: /mailto\s*:/i, msg: "lien de messagerie interdit" },
  { re: /\p{Extended_Pictographic}/u, msg: "emoji interdit" },
  { re: /\b(?:0|\+33\s?)[1-9](?:[\s.-]?\d{2}){4}\b/, msg: "numéro de téléphone interdit (seuls 15, 112, 114, 3114 et 39 89 sont admis)" },
];

// Garde-fous santé : aucun conseil médical individuel
export const INTERDITS_SANTE = [
  { re: /\b\d+(?:[.,]\d+)?\s?(?:mg|µg|μg|mcg|microgrammes?|milligrammes?|ml|mL|UI)\b(?!\s?(?:\/|par)\s?m(?:3|³|ètre))/iu, msg: "dosage chiffré (mg, µg, ml, UI) ; seules les concentrations dans l'air en µg/m³ sont permises" },
  { re: /\bbouff[ée]es?\b/i, msg: "« bouffées » : aucune indication de prise d'un inhalateur" },
  { re: /\b\d+\s?(?:inhalations?|comprim[ée]s?|g[ée]lules?|pulv[ée]risations?|prises?)\b/i, msg: "nombre de prises ou de doses" },
  { re: /\b\d+(?:[.,]\d+)?\s?(?:l|litres?)\s?(?:\/|par)\s?min/i, msg: "débit d'oxygène en L/min" },
  { re: /\baugmente[rz]?\s+(?:ton|ta|votre|son|le|l['’]|leur)\s*(?:débit\s+d['’])?oxyg[èe]ne/i, msg: "« augmente ton oxygène » : conseil de traitement individuel" },
  { re: /\b(?:arr[êe]te[rsz]?|stoppe[rsz]?|suspend(?:s|re|ez)?|diminue[rsz]?|r[ée]dui[st]|r[ée]duire|r[ée]duisez|espace[rsz]?|saute[rsz]?)\s+(?:ton|ta|tes|votre|vos|son|sa|ses|le|la|les|leur)\s+(?:traitement|m[ée]dicament|inhalateur|cortico[iï]de|oxyg[èe]ne|dose|prise)s?/i, msg: "incitation à modifier ou arrêter un traitement" },
  { re: /\bdouble[rsz]?\s+(?:la|ta|votre|sa|les|tes|vos)\s+doses?/i, msg: "« double la dose » interdit" },
  { re: /\bremplace[rsz]?\s+(?:ton|ta|votre|son|sa|le|la)\s+(?:m[ée]dicament|traitement|inhalateur|m[ée]decin)/i, msg: "« remplace ton médicament » interdit" },
  { re: /\bgu[ée]ri(?:r|t|s|ssez|ssent|son)\s+(?:d[ée]finitive(?:ment)?|garantie?|assur[ée]e?|totale(?:ment)?|naturelle(?:ment)?|rapide(?:ment)?|enfin|compl[èe]te(?:ment)?)|\bmiracle|\bmiraculeu|100\s?%\s?(?:efficace|naturel|garanti)|sans aucun risque|\bfait dispara[iî]tre (?:la|ta|votre) (?:BPCO|maladie|asthme|fibrose)/iu, msg: "promesse de guérison ou d'efficacité absolue" },
  { re: /\b(?:je (?:te|vous) (?:conseille|recommande|prescris)|dans ton cas|dans votre cas|ta dose|votre dose)\b/i, msg: "conseil individuel" },
  { re: /\b(?:d[ée]tox|hom[ée]opathi\w*|anti-?vax\w*)\b/i, msg: "thème non validé scientifiquement" },
];

// Aucun médecin, soignant ou expert nommé ou cité (règle de Vincent Daffourd)
export const INTERDITS_PERSONNES = [
  { re: /\b(?:Dr|Dre|Pr|Pre)\.?\s+[A-ZÀ-Ý][\p{L}'-]+/u, msg: "médecin ou professeur nommé (aucun soignant ni expert nommé dans les articles)" },
  { re: /\b(?:docteure?|professeure?)\s+[A-ZÀ-Ý][\p{L}'-]+/u, msg: "médecin ou professeur nommé (aucun soignant ni expert nommé dans les articles)" },
  { re: /\b(?:pneumologue|m[ée]decin|allergologue|infirmi[eè]re?|kin[ée]sith[ée]rapeute|chercheuse?|chercheur|expert|experte|sp[ée]cialiste|professeur)\s+[A-ZÀ-Ý][\p{L}'-]+\s+[A-ZÀ-Ý][\p{L}'-]+/u, msg: "soignant ou expert nommé (aucune personne nommée dans les articles)" },
];

// Noms commerciaux de médicaments : interdits (publicité pour un médicament, art. L5122-1 et suivants du CSP).
// Parler de la classe thérapeutique ou de la DCI, sans jamais de conseil de prise.
export const MARQUES = [
  "Ventoline", "Airomir", "Bricanyl", "Symbicort", "Seretide", "Flixotide", "Pulmicort", "Becotide", "Qvar",
  "Foster", "Innovair", "Relvar", "Trelegy", "Trimbow", "Enerzair", "Atectura", "Spiriva", "Incruse",
  "Anoro", "Ultibro", "Spiolto", "Bevespi", "Elebrato", "Riarify", "Breztri", "Trixeo", "Onbrez", "Seebri",
  "Eklira", "Duaklir", "Brimica", "Formodual", "Gibiter", "Inuxair", "Serevent", "Foradil", "Asmanex",
  "Alvesco", "Singulair", "Xolair", "Nucala", "Fasenra", "Dupixent", "Tezspire", "Cinqaero", "Kaftrio",
  "Trikafta", "Kalydeco", "Orkambi", "Symkevi", "Alyftrek", "Pulmozyme", "Bronchitol", "Tobi", "Cayston",
  "Colobreathe", "Esbriet", "Ofev", "Uptravi", "Opsumit", "Tracleer", "Volibris", "Adempas", "Revatio",
  "Remodulin", "Winrevair", "Daxas", "Aerius", "Zyrtec", "Xyzall", "Clarityne", "Kestin", "Telfast",
  "Nasonex", "Avamys", "Rhinocort", "Ohtuvayre", "Celestene", "Solupred", "Cortancyl", "Medrol", "Oslif",
  "Efluelda", "Fluad", "Flucelvax", "Influvac", "Vaxigrip", "Comirnaty", "Spikevax", "Nuvaxovid", "Abrysvo",
  "Arexvy", "mResvia", "Beyfortus", "Prevenar", "Vaxneuvance", "Pneumovax", "Doliprane", "Efferalgan", "Dafalgan",
];
export const RE_MARQUES = new RegExp(`\\b(?:${MARQUES.join("|")})\\b`, "i");

// Signalés sans bloquer (avertissements)
export const A_EVITER = [
  { re: /(?:^|[\s(«"'])[Oo]n\s+(?!line\b)/, msg: "pronom « on » à éviter (préférer une tournure directe)" },
];
