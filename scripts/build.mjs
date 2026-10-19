#!/usr/bin/env node
/**
 * Respi.info : générateur statique du site fr.respi.info (rubrique Actualités, en-tête et pied de page communs).
 * Node 18 ou plus, AUCUNE dépendance npm. À lancer depuis la racine du dépôt.
 *
 *   node scripts/build.mjs              contrôle tout, puis écrit les fichiers générés
 *   node scripts/build.mjs --check      contrôle tout (y compris que les fichiers générés sont à jour), n'écrit rien
 *   node scripts/build.mjs --brouillon  contrôle les articles sans exiger le fichier de relecture, n'écrit rien
 *
 * Entrées :
 *   content/actualites/AAAA-MM-JJ-slug.md          un article (en-tête clé: valeur puis corps Markdown)
 *   content/actualites/relectures/<nom>.json       rapport du relecteur indépendant (verdict, empreinte sha256)
 *   content/actualites/PAUSE                       présence = aucune NOUVELLE publication (retraits possibles)
 *   content/evenements.json                        calendrier éditorial lu par les robots
 *   scripts/gabarits.mjs                           en-tête et pied de page communs
 * Sorties (à committer) :
 *   actualites.html, actualites/page-N.html, actualites/<nom>.html, actualites/type/<type>.html,
 *   actualites/theme/<thème>.html, actualites/index.json, rss.xml, sitemap.xml (entrées /actualites seulement),
 *   en-tête et pied de page recopiés dans chaque page HTML de la racine.
 *
 * Tout problème bloquant arrête le build avec un message clair et un code de sortie non nul :
 *   1 = contenu non conforme, 3 = PAUSE active et nouvel article détecté.
 * Aucun fichier n'est écrit tant qu'une erreur subsiste.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {
  TYPES, THEMATIQUES, CONDITIONS, DOMAINES_OFFICIELS, DOMAINES_RECONNUS,
  INTERDITS_TYPO, INTERDITS_SANTE, INTERDITS_PERSONNES, RE_MARQUES, A_EVITER,
} from "./regles-editoriales.mjs";
import { ENTETE, PIED, MARQUEURS, VERSION_ASSETS } from "./gabarits.mjs";

const ROOT = process.cwd();
const SITE = "https://fr.respi.info";
const SRC = path.join(ROOT, "content/actualites");
const RELECTURES = path.join(SRC, "relectures");
const EVENEMENTS = path.join(ROOT, "content/evenements.json");
const ARGS = new Set(process.argv.slice(2));
const BROUILLON = ARGS.has("--brouillon");
const CHECK = ARGS.has("--check") || BROUILLON;
const PAR_PAGE = 12;

if (!fs.existsSync(path.join(ROOT, "index.html")) || !fs.existsSync(path.join(ROOT, "scripts/build.mjs"))) {
  console.error("Lance ce script depuis la racine du dépôt respi-fr-site : node scripts/build.mjs");
  process.exit(1);
}

const erreurs = [];
const avertissements = [];
const err = (ou, msg) => erreurs.push(`${ou} : ${msg}`);
const warn = (ou, msg) => avertissements.push(`${ou} : ${msg}`);

/* ------------------------------------------------------------------ */
/* Outils                                                              */
/* ------------------------------------------------------------------ */
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const sha256 = (s) => crypto.createHash("sha256").update(s, "utf8").digest("hex");
const aujourdhuiParis = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date());
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const dateFr = (iso) => { const [a, m, j] = iso.split("-").map(Number); return `${j === 1 ? "1er" : j} ${MOIS[m - 1]} ${a}`; };
function dateValide(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s || "")) return false;
  const d = new Date(s + "T12:00:00Z");
  return !isNaN(d) && d.toISOString().slice(0, 10) === s;
}
const heureValide = (s) => /^([01]\d|2[0-3]):[0-5]\d$/.test(s || "");
// Date et heure de Paris vers ISO 8601 avec décalage (gère l'heure d'été)
function isoParis(jour, heure) {
  const [h, mi] = heure.split(":").map(Number);
  const essai = new Date(`${jour}T${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}:00Z`);
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(essai).map((p) => [p.type, p.value]));
  const vuParis = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute);
  const decalageMin = Math.round((vuParis - essai.getTime()) / 60000);
  const signe = decalageMin >= 0 ? "+" : "-";
  const abs = Math.abs(decalageMin);
  return `${jour}T${heure}:00${signe}${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`;
}
const domaine = (url) => { try { return new URL(url).hostname.toLowerCase().replace(/^www\./, ""); } catch { return null; } };
const dansListe = (d, liste) => !!d && liste.some((x) => d === x || d.endsWith("." + x));
const compterMots = (t) => (t.replace(/\]\([^)]*\)/g, "]").replace(/[#*_>\[\]()`|]/g, " ").match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu) || []).length;
const lire = (p) => fs.readFileSync(p, "utf8");
const rel = (p) => path.relative(ROOT, p);

/* ------------------------------------------------------------------ */
/* 1. Lecture et validation des articles                               */
/* ------------------------------------------------------------------ */
const CLES = new Set(["title", "description", "date", "heure", "type", "thematiques", "image_alt", "source", "mis_a_jour"]);

function lireArticle(fichier, brut) {
  const m = brut.replace(/^﻿/, "").match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) { err(fichier, "en-tête manquant : le fichier doit commencer par --- puis les lignes clé: valeur, puis ---"); return null; }
  const meta = { sources: [] };
  m[1].split(/\r?\n/).forEach((ligne, i) => {
    if (!ligne.trim() || ligne.trim().startsWith("#")) return;
    const mm = ligne.match(/^([a-z_]+)\s*:\s*(.*)$/);
    if (!mm) { err(fichier, `ligne ${i + 2} de l'en-tête illisible : « ${ligne} » (attendu clé: valeur)`); return; }
    const [, k, brutVal] = mm;
    const v = brutVal.trim().replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
    if (!CLES.has(k)) { err(fichier, `clé d'en-tête inconnue « ${k} » (clés admises : ${[...CLES].join(", ")})`); return; }
    if (k === "source") {
      const i2 = v.lastIndexOf("|");
      if (i2 < 0) { err(fichier, `source mal formée « ${v} » (attendu : source: Titre, Média | https://...)`); return; }
      const gauche = v.slice(0, i2).trim(); const url = v.slice(i2 + 1).trim();
      const iv = gauche.lastIndexOf(",");
      if (iv < 0) { err(fichier, `source sans média « ${v} » (attendu : source: Titre, Média | https://...)`); return; }
      meta.sources.push({ titre: gauche.slice(0, iv).trim(), media: gauche.slice(iv + 1).trim(), url });
    } else if (k === "thematiques") {
      meta.thematiques = v.replace(/^\[|\]$/g, "").split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
    } else {
      if (meta[k] !== undefined) err(fichier, `clé « ${k} » présente deux fois`);
      meta[k] = v;
    }
  });
  return { meta, corps: m[2].replace(/\s+$/, "") + "\n" };
}

function verifierTexte(fichier, champ, texte) {
  for (const r of [...INTERDITS_TYPO, ...INTERDITS_SANTE, ...INTERDITS_PERSONNES]) {
    const m = texte.match(r.re);
    if (m) err(fichier, `${champ} : ${r.msg} (« ${m[0].trim()} »)`);
  }
  const mq = texte.match(RE_MARQUES);
  if (mq) err(fichier, `${champ} : nom commercial de médicament ou de vaccin interdit, utiliser la classe ou la DCI (« ${mq[0]} »)`);
  for (const r of A_EVITER) { const m = texte.match(r.re); if (m) warn(fichier, `${champ} : ${r.msg}`); }
}

function validerArticle(fichier, brut, meta, corps) {
  const base = path.basename(fichier, ".md");
  const fm = base.match(/^(\d{4}-\d{2}-\d{2})-([a-z0-9]+(?:-[a-z0-9]+)*)$/);
  if (!fm) err(fichier, "nom de fichier attendu : AAAA-MM-JJ-slug-en-minuscules-sans-accents.md");
  for (const k of ["title", "description", "date", "heure", "type", "thematiques"]) if (!meta[k] || (Array.isArray(meta[k]) && !meta[k].length)) err(fichier, `champ « ${k} » manquant ou vide`);
  // Dates
  if (meta.date && !dateValide(meta.date)) err(fichier, `date invalide « ${meta.date} » (format AAAA-MM-JJ, date réelle)`);
  else if (meta.date) {
    if (fm && meta.date !== fm[1]) err(fichier, `la date de l'en-tête (${meta.date}) diffère de celle du nom de fichier (${fm[1]})`);
    if (meta.date > aujourdhuiParis) err(fichier, `date future (${meta.date}, aujourd'hui à Paris : ${aujourdhuiParis}) : publier le jour même seulement`);
  }
  if (meta.heure && !heureValide(meta.heure)) err(fichier, `heure invalide « ${meta.heure} » (format HH:MM, heure de Paris)`);
  if (meta.mis_a_jour !== undefined) {
    if (!dateValide(meta.mis_a_jour)) err(fichier, `mis_a_jour invalide « ${meta.mis_a_jour} »`);
    else if (meta.date && meta.mis_a_jour < meta.date) err(fichier, "mis_a_jour antérieur à la date de publication");
    else if (meta.mis_a_jour > aujourdhuiParis) err(fichier, "mis_a_jour dans le futur");
  }
  // Type et thématiques
  const T = TYPES[meta.type];
  if (meta.type && !T) err(fichier, `type inconnu « ${meta.type} » (fond ou pratique)`);
  for (const t of meta.thematiques || []) if (!THEMATIQUES[t]) err(fichier, `thématique inconnue « ${t} » (admises : ${Object.keys(THEMATIQUES).join(", ")})`);
  if ((meta.thematiques || []).length > 4) err(fichier, "4 thématiques au maximum");
  if (new Set(meta.thematiques || []).size !== (meta.thematiques || []).length) err(fichier, "thématique en double");
  // Titre et description
  if (meta.title) {
    if (meta.title.length < 20 || meta.title.length > 70) err(fichier, `titre de ${meta.title.length} caractères (bornes 20 à 70, 60 conseillés)`);
    else if (meta.title.length > 60) warn(fichier, `titre de ${meta.title.length} caractères (60 conseillés pour Google)`);
  }
  if (meta.description && (meta.description.length < 150 || meta.description.length > 160)) err(fichier, `description de ${meta.description.length} caractères (attendu 150 à 160)`);
  if (meta.image_alt !== undefined && (meta.image_alt.length < 15 || meta.image_alt.length > 200)) err(fichier, "image_alt entre 15 et 200 caractères");
  // Sources
  const domaines = new Set();
  let officielles = 0;
  meta.sources.forEach((s, i) => {
    const n = `source ${i + 1}`;
    if (!s.titre || s.titre.length < 5) err(fichier, `${n} : titre manquant ou trop court`);
    if (!s.media) err(fichier, `${n} : média manquant (attendu : Titre, Média | https://...)`);
    if (!/^https:\/\/[^\s]+$/.test(s.url)) { err(fichier, `${n} : URL non https ou mal formée « ${s.url} »`); return; }
    if (/google\.[a-z.]+\/url|bit\.ly|tinyurl|t\.co\//i.test(s.url)) err(fichier, `${n} : lien de redirection interdit « ${s.url} »`);
    const d = domaine(s.url);
    if (!d) { err(fichier, `${n} : URL illisible`); return; }
    domaines.add(d);
    if (dansListe(d, DOMAINES_OFFICIELS)) officielles++;
    else if (!dansListe(d, DOMAINES_RECONNUS)) err(fichier, `${n} : domaine « ${d} » hors liste blanche (voir scripts/regles-editoriales.mjs)`);
    verifierTexte(fichier, n, `${s.titre} ${s.media}`);
  });
  if (new Set(meta.sources.map((s) => s.url)).size !== meta.sources.length) err(fichier, "source en double");
  if (T) {
    if (meta.sources.length < T.minSources) err(fichier, `${meta.sources.length} source(s) : il en faut au moins ${T.minSources} pour un article « ${meta.type} »`);
    if (domaines.size < T.minDomaines) err(fichier, `sources issues de ${domaines.size} site(s) : au moins ${T.minDomaines} sites différents attendus`);
    if (officielles < 1) err(fichier, "aucune source sur un domaine officiel de la liste blanche (HAS, Santé publique France, ameli, OMS, Inserm, Atmo, GOLD, GINA, SPLF...)");
    const n = compterMots(corps);
    if (n < T.minMots || n > T.maxMots) err(fichier, `${n} mots : attendu ${T.minMots} à ${T.maxMots} pour un article « ${meta.type} »`);
  }
  // Corps
  if (/^#\s/m.test(corps)) err(fichier, "pas de titre de niveau 1 (#) dans le corps : le titre vient de l'en-tête");
  if (/^#{4,}\s/m.test(corps)) err(fichier, "seuls les intertitres ## et ### sont admis");
  if (/<[a-z!/][^>]*>/i.test(corps)) err(fichier, "HTML brut interdit dans le corps (Markdown simple uniquement)");
  if (meta.type === "fond" && (corps.match(/^##\s/gm) || []).length < 2) err(fichier, "un article de fond doit avoir au moins 2 intertitres ##");
  for (const [, url] of corps.matchAll(/\]\(([^)\s]*)\)/g)) {
    if (url.startsWith("/")) continue;
    if (!/^https:\/\//.test(url)) { err(fichier, `lien non https dans le texte « ${url} »`); continue; }
    const d = domaine(url);
    if (!(d && (d === "respi.info" || d.endsWith(".respi.info") || dansListe(d, DOMAINES_OFFICIELS) || dansListe(d, DOMAINES_RECONNUS)))) err(fichier, `lien du texte vers un domaine hors liste blanche « ${d} »`);
  }
  verifierTexte(fichier, "titre", meta.title || "");
  verifierTexte(fichier, "description", meta.description || "");
  verifierTexte(fichier, "image_alt", meta.image_alt || "");
  verifierTexte(fichier, "corps", corps);

  // Relecture indépendante liée au contenu exact (empreinte sha256 du fichier .md)
  if (BROUILLON) return;
  const fr = path.join(RELECTURES, base + ".json");
  if (!fs.existsSync(fr)) { err(fichier, `relecture absente (${rel(fr)}) : faire relire l'article par le relecteur indépendant`); return; }
  let rv;
  try { rv = JSON.parse(lire(fr)); } catch { err(fichier, `relecture illisible (${rel(fr)} n'est pas un JSON valide)`); return; }
  if (rv.verdict !== "PUBLIER") err(fichier, `verdict du relecteur : ${rv.verdict || "absent"} (PUBLIER attendu)`);
  if (rv.sha256 !== sha256(brut)) err(fichier, "l'article a changé depuis la relecture (empreinte sha256 différente) : refaire relire");
  if (!Array.isArray(rv.sources_verifiees)) err(fichier, "relecture : champ sources_verifiees manquant");
  else for (const s of meta.sources) {
    const v = rv.sources_verifiees.find((x) => x.url === s.url);
    if (!v) err(fichier, `relecture : la source ${s.url} n'a pas été vérifiée`);
    else if (v.ok !== true) err(fichier, `relecture : source ${s.url} non confirmée`);
  }
}

/* ------------------------------------------------------------------ */
/* 2. Markdown simple et sûr vers HTML (tout HTML brut est échappé)    */
/* ------------------------------------------------------------------ */
function inline(s) {
  let h = esc(s);
  const liens = [];
  h = h.replace(/\[([^\]]+)\]\(((?:https:\/\/|\/)[^)\s]*)\)/g, (_, t, u) => {
    const externe = u.startsWith("https://") && !/^https:\/\/([a-z0-9-]+\.)*respi\.info(\/|$)/.test(u.replace(/&amp;/g, "&"));
    liens.push(`<a href="${u}"${externe ? ' target="_blank" rel="noopener"' : ""}>${t}</a>`);
    return `\u0000${liens.length - 1}\u0000`;
  });
  h = h.replace(/\*\*(?=\S)(.+?)\*\*/g, "<strong>$1</strong>").replace(/(^|[^*\p{L}])\*(?=\S)([^*]+?)\*(?![*\p{L}])/gu, "$1<em>$2</em>");
  return h.replace(/\u0000(\d+)\u0000/g, (_, i) => liens[+i].replace(/\*\*(?=\S)(.+?)\*\*/g, "<strong>$1</strong>"));
}
function markdown(md) {
  const out = []; let liste = null; let para = []; let cit = [];
  const flushP = () => { if (para.length) { out.push(`<p>${inline(para.join(" "))}</p>`); para = []; } };
  const flushL = () => { if (liste) { out.push(`<${liste.t}>\n${liste.items.map((i) => `  <li>${inline(i)}</li>`).join("\n")}\n</${liste.t}>`); liste = null; } };
  const flushC = () => { if (cit.length) { out.push(`<blockquote><p>${inline(cit.join(" "))}</p></blockquote>`); cit = []; } };
  const tout = () => { flushP(); flushL(); flushC(); };
  for (const l of md.split(/\r?\n/)) {
    let m;
    if (!l.trim()) { tout(); continue; }
    if ((m = l.match(/^(#{2,3})\s+(.*)$/))) { tout(); const n = m[1].length; out.push(`<h${n}${n === 2 ? ' class="h-serif"' : ""}>${inline(m[2].trim())}</h${n}>`); continue; }
    if ((m = l.match(/^\s*[-*]\s+(.*)$/))) { flushP(); flushC(); if (!liste || liste.t !== "ul") { flushL(); liste = { t: "ul", items: [] }; } liste.items.push(m[1]); continue; }
    if ((m = l.match(/^\s*\d+[.)]\s+(.*)$/))) { flushP(); flushC(); if (!liste || liste.t !== "ol") { flushL(); liste = { t: "ol", items: [] }; } liste.items.push(m[1]); continue; }
    if ((m = l.match(/^>\s?(.*)$/))) { flushP(); flushL(); cit.push(m[1]); continue; }
    if (liste && /^\s{2,}\S/.test(l)) { liste.items[liste.items.length - 1] += " " + l.trim(); continue; }
    flushL(); flushC(); para.push(l.trim());
  }
  tout();
  return out.join("\n");
}

/* ------------------------------------------------------------------ */
/* 3. Calendrier éditorial (content/evenements.json)                   */
/* ------------------------------------------------------------------ */
function validerEvenements() {
  const f = "content/evenements.json";
  if (!fs.existsSync(EVENEMENTS)) { warn(f, "fichier absent : les robots choisiront un sujet d'actualité"); return; }
  let data;
  try { data = JSON.parse(lire(EVENEMENTS)); } catch (e) { err(f, `JSON invalide (${e.message})`); return; }
  if (!Array.isArray(data.evenements)) { err(f, "clé « evenements » (tableau) manquante"); return; }
  const ids = new Set();
  const creneaux = new Map();
  const reserver = (date, type, ou) => {
    const k = `${date}|${type}`;
    if (creneaux.has(k)) err(f, `${ou} : le créneau ${type} du ${date} est déjà pris par ${creneaux.get(k)} (un fond et un pratique au plus par jour)`);
    else creneaux.set(k, ou);
  };
  const decaler = (d, n) => { const x = new Date(d + "T12:00:00Z"); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
  data.evenements.forEach((e, i) => {
    const ou = `événement ${i + 1}${e && e.id ? ` (${e.id})` : ""}`;
    if (!e || typeof e !== "object") { err(f, `${ou} : objet attendu`); return; }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(e.id || "")) err(f, `${ou} : id en minuscules-avec-tirets attendu`);
    else if (ids.has(e.id)) err(f, `${ou} : id en double`); else ids.add(e.id);
    if (!e.nom || e.nom.length < 5) err(f, `${ou} : nom manquant`);
    const debut = e.date || e.date_debut;
    if (e.date && (e.date_debut || e.date_fin)) err(f, `${ou} : utiliser soit date, soit date_debut et date_fin`);
    if (!dateValide(debut)) err(f, `${ou} : date (ou date_debut) AAAA-MM-JJ attendue`);
    if (e.date_debut && !dateValide(e.date_fin)) err(f, `${ou} : date_fin AAAA-MM-JJ attendue`);
    if (e.date_debut && dateValide(e.date_fin) && e.date_fin < e.date_debut) err(f, `${ou} : date_fin antérieure à date_debut`);
    if (!["confirme", "a_confirmer"].includes(e.statut)) err(f, `${ou} : statut « confirme » ou « a_confirmer » attendu`);
    if (!/^https:\/\/\S+$/.test(e.source_url || "")) err(f, `${ou} : source_url https attendue`);
    if (!e.angle || e.angle.length < 10) err(f, `${ou} : angle manquant`);
    for (const t of e.thematiques || []) if (!THEMATIQUES[t]) err(f, `${ou} : thématique inconnue « ${t} »`);
    const s = e.sequence;
    if (!s || typeof s !== "object") { err(f, `${ou} : sequence manquante`); return; }
    for (const k of ["j_moins_7", "jour_j_fond", "jour_j_pratique", "suite_pratiques"]) if (!(k in s)) err(f, `${ou} : sequence.${k} manquant (mettre null ou [] si sans objet)`);
    const sujet = (x, k) => { if (x !== null && (typeof x !== "object" || !x.sujet || x.sujet.length < 10)) err(f, `${ou} : sequence.${k} doit être null ou {"sujet": "..."}`); };
    sujet(s.j_moins_7, "j_moins_7"); sujet(s.jour_j_fond, "jour_j_fond"); sujet(s.jour_j_pratique, "jour_j_pratique");
    if (s.j_moins_7 && !["fond", "pratique"].includes(s.j_moins_7.type)) err(f, `${ou} : sequence.j_moins_7.type doit valoir fond ou pratique`);
    if (!Array.isArray(s.suite_pratiques)) err(f, `${ou} : sequence.suite_pratiques doit être un tableau`);
    const texte = JSON.stringify(e);
    for (const r of INTERDITS_TYPO) { const m = texte.match(r.re); if (m) err(f, `${ou} : ${r.msg} (« ${m[0]} »)`); }
    if (e.statut !== "confirme" || !dateValide(debut)) return; // créneaux réservés seulement pour les dates confirmées
    if (s.jour_j_fond) reserver(debut, "fond", e.id);
    if (s.jour_j_pratique) reserver(debut, "pratique", e.id);
    if (s.j_moins_7) reserver(decaler(debut, -7), s.j_moins_7.type, e.id);
    for (const [j, p] of (s.suite_pratiques || []).entries()) {
      if (!p || !dateValide(p.date) || !p.sujet) { err(f, `${ou} : suite_pratiques[${j}] : {"date": "AAAA-MM-JJ", "sujet": "..."} attendu`); continue; }
      reserver(p.date, p.type || "pratique", e.id);
    }
  });
}

/* ------------------------------------------------------------------ */
/* 4. Gabarits de page                                                 */
/* ------------------------------------------------------------------ */
const OG = { fond: `${SITE}/assets/og/fond.png`, pratique: `${SITE}/assets/og/pratique.png`, site: `${SITE}/assets/og/site.png` };
const ALT_DEFAUT = {
  fond: "Visuel Respi.info bleu nuit, mention Article de fond et adresse fr.respi.info/actualites",
  pratique: "Visuel Respi.info vert sauge, mention Conseil pratique et adresse fr.respi.info/actualites",
};
const ORGANISATION = { "@type": "Organization", "@id": `${SITE}/#organization`, name: "JOOY, Respi.info", url: `${SITE}/`, logo: `${SITE}/assets/logo-512.png` };
const AVERTISSEMENT = `<aside class="r-avertissement" aria-label="Avertissement santé">
  <p><strong>Cet article informe et ne remplace pas l'avis de ton médecin ou de ton équipe soignante.</strong>
  En cas d'aggravation brutale (essoufflement inhabituel, douleur thoracique, lèvres bleues), appelle le <strong>15</strong>.</p>
</aside>`;

function head({ titre, description, url, image, imageAlt, ogType = "website", jsonld, extra = "" }) {
  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(titre)}</title>
  <meta name="description" content="${esc(description)}" />
  <link rel="canonical" href="${url}" />
  <meta property="og:type" content="${ogType}" />
  <meta property="og:locale" content="fr_FR" />
  <meta property="og:site_name" content="Respi.info" />
  <meta property="og:title" content="${esc(titre)}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="${esc(imageAlt)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(titre)}" />
  <meta name="twitter:description" content="${esc(description)}" />
  <meta name="twitter:image" content="${image}" />
  <meta name="twitter:image:alt" content="${esc(imageAlt)}" />
  <meta name="theme-color" content="#0D1B2A" />
${extra}  <link rel="alternate" type="application/rss+xml" title="Actualités Respi.info" href="${SITE}/rss.xml" />
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32.png" />
  <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500;1,600&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/assets/styles.css?v=${VERSION_ASSETS}" />
  <link rel="stylesheet" href="/assets/actualites.css?v=${VERSION_ASSETS}" />
  <script type="application/ld+json">
${JSON.stringify(jsonld, null, 2).replace(/</g, "\\u003c")}
  </script>
</head>
<body>
${MARQUEURS.entete[0]}
${ENTETE}
${MARQUEURS.entete[1]}
`;
}
const pied = () => `${MARQUEURS.pied[0]}
${PIED}
${MARQUEURS.pied[1]}

<script src="/assets/nav.js?v=${VERSION_ASSETS}"></script>
</body>
</html>
`;

const urlArticle = (a) => `${SITE}/actualites/${a.slug}`;
const tempsLecture = (mots) => Math.max(1, Math.ceil(mots / 200));
const badge = (type) => `<span class="r-badge${type === "pratique" ? " r-badge--pratique" : ""}">${esc(TYPES[type].label)}</span>`;
const lienTheme = (t) => `<a href="/actualites/theme/${t}">${esc(THEMATIQUES[t])}</a>`;

function carte(a, niveau = "h2") {
  return `<article class="r-card r-actu-card">
      ${badge(a.type)}
      <${niveau}><a href="/actualites/${a.slug}">${esc(a.title)}</a></${niveau}>
      <p>${esc(a.description)}</p>
      <p class="r-meta"><time datetime="${a.date}">${dateFr(a.date)}</time><span>${tempsLecture(a.mots)} min de lecture</span><span>${a.thematiques.map((t) => esc(THEMATIQUES[t])).join(", ")}</span></p>
    </article>`;
}

function articlesLies(a, tous) {
  return tous.filter((b) => b.slug !== a.slug)
    .map((b) => ({ b, score: b.thematiques.filter((t) => a.thematiques.includes(t)).length * 10 + (b.type !== a.type ? 1 : 0) }))
    .sort((x, y) => y.score - x.score || (y.b.date + y.b.heure).localeCompare(x.b.date + x.b.heure))
    .slice(0, 3).map((x) => x.b);
}

function pageArticle(a, tous) {
  const url = urlArticle(a);
  const image = OG[a.type];
  const imageAlt = a.image_alt || ALT_DEFAUT[a.type];
  const publie = isoParis(a.date, a.heure);
  const modifie = a.mis_a_jour ? isoParis(a.mis_a_jour, "12:00") : publie;
  const about = a.thematiques.filter((t) => CONDITIONS[t]).map((t) => ({ "@type": "MedicalCondition", name: CONDITIONS[t] }));
  const jsonld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "MedicalWebPage", "@id": url + "#page", url, name: a.title, description: a.description, inLanguage: "fr-FR",
        datePublished: publie, dateModified: modifie, lastReviewed: (a.mis_a_jour || a.date),
        audience: { "@type": "PeopleAudience", audienceType: "Patients, aidants, grand public" },
        ...(about.length ? { about } : {}),
        mainEntity: { "@id": url + "#article" }, breadcrumb: { "@id": url + "#fil" },
        isPartOf: { "@type": "WebSite", "@id": `${SITE}/#site`, name: "Respi.info", url: `${SITE}/` },
      },
      {
        "@type": "Article", "@id": url + "#article", headline: a.title, description: a.description,
        image: [image], datePublished: publie, dateModified: modifie, inLanguage: "fr-FR",
        articleSection: TYPES[a.type].label, keywords: a.thematiques.map((t) => THEMATIQUES[t]).join(", "),
        wordCount: a.mots, isAccessibleForFree: true, author: ORGANISATION, publisher: ORGANISATION, mainEntityOfPage: url,
        citation: a.sources.map((s) => ({ "@type": "CreativeWork", name: s.titre, publisher: s.media, url: s.url })),
      },
      {
        "@type": "BreadcrumbList", "@id": url + "#fil", itemListElement: [
          { "@type": "ListItem", position: 1, name: "Accueil", item: `${SITE}/` },
          { "@type": "ListItem", position: 2, name: "Actualités", item: `${SITE}/actualites` },
          { "@type": "ListItem", position: 3, name: a.title, item: url },
        ],
      },
    ],
  };
  const sources = a.sources.map((s) => `      <li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.titre)}</a>, ${esc(s.media)} <span class="r-src-dom">(${esc(domaine(s.url))})</span></li>`).join("\n");
  const lies = articlesLies(a, tous);
  const blocLies = lies.length ? `
<section class="section section--soft" aria-labelledby="lies-titre">
  <div class="section-inner">
    <h2 class="h-serif" id="lies-titre">À lire aussi</h2>
    <div class="r-cards-grid r-actu-grid r-lies">
    ${lies.map((b) => carte(b, "h3")).join("\n    ")}
    </div>
  </div>
</section>` : "";
  return head({
    titre: `${a.title} | Respi.info`, description: a.description, url, image, imageAlt, ogType: "article", jsonld,
    extra: `  <meta property="article:published_time" content="${publie}" />\n  <meta property="article:modified_time" content="${modifie}" />\n  <meta property="article:section" content="${esc(TYPES[a.type].label)}" />\n${a.thematiques.map((t) => `  <meta property="article:tag" content="${esc(THEMATIQUES[t])}" />\n`).join("")}`,
  }) + `
<main id="contenu" tabindex="-1">
<section class="page-head">
  <div class="page-head-inner">
    <nav class="r-fil" aria-label="Fil d'Ariane">
      <ol><li><a href="/">Accueil</a></li><li><a href="/actualites">Actualités</a></li><li aria-current="page">${esc(TYPES[a.type].label)}</li></ol>
    </nav>
    ${badge(a.type)}
    <h1>${esc(a.title)}</h1>
    <p>${esc(a.description)}</p>
    <p class="r-meta"><time datetime="${publie}">Publié le ${dateFr(a.date)} à ${a.heure.replace(":", " h ")}</time>${a.mis_a_jour ? `<span>Mis à jour le <time datetime="${a.mis_a_jour}">${dateFr(a.mis_a_jour)}</time></span>` : ""}<span>${tempsLecture(a.mots)} min de lecture</span></p>
    <ul class="r-tags" aria-label="Thématiques">${a.thematiques.map((t) => `<li>${lienTheme(t)}</li>`).join("")}</ul>
  </div>
</section>
<section class="section">
  <article class="section-inner section-inner--narrow r-article">
${AVERTISSEMENT}
${a.html}
    <h2 class="h-serif">Sources</h2>
    <ol class="r-sources">
${sources}
    </ol>
    <div class="r-cta-app">
      <p><strong>Respi.info, l'application gratuite qui croise chaque matin la qualité de l'air, les pollens, la météo et ta maladie respiratoire.</strong></p>
      <a class="btn primary" href="https://www.respi.info">Voir ma météo respiratoire du jour</a>
    </div>
    <p class="r-charte-ligne">Article rédigé avec l'aide d'une intelligence artificielle, contrôlé automatiquement puis relu par un second système indépendant avant publication. <a href="/charte-editoriale">Rédaction encadrée par notre charte éditoriale</a>. Une erreur ? <a href="/contact?sujet=correction">Signale-la</a>.</p>
  </article>
</section>${blocLies}
</main>

` + pied();
}

function pageListe({ articles, base, numero, total, titreH1, intro, titre, description, actif, themes }) {
  const url = numero === 1 ? `${SITE}${base}` : `${SITE}${base}-page-${numero}`;
  const lienPage = (n) => (n === 1 ? base : `${base}-page-${n}`);
  const jsonld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage", "@id": url + "#liste", url, name: titre, description, inLanguage: "fr-FR", publisher: ORGANISATION,
        mainEntity: { "@type": "ItemList", itemListElement: articles.map((a, i) => ({ "@type": "ListItem", position: (numero - 1) * PAR_PAGE + i + 1, url: urlArticle(a) })) },
      },
      {
        "@type": "BreadcrumbList", itemListElement: [
          { "@type": "ListItem", position: 1, name: "Accueil", item: `${SITE}/` },
          { "@type": "ListItem", position: 2, name: "Actualités", item: `${SITE}/actualites` },
          ...(base !== "/actualites" ? [{ "@type": "ListItem", position: 3, name: titreH1, item: `${SITE}${base}` }] : []),
        ],
      },
    ],
  };
  const filtre = (href, libelle) => `<li><a href="${href}"${actif === href ? ' aria-current="page"' : ""}>${esc(libelle)}</a></li>`;
  const cartes = articles.length
    ? `<div class="r-cards-grid r-actu-grid">\n    ${articles.map((a) => carte(a)).join("\n    ")}\n    </div>`
    : `<div class="r-vide"><p><strong>Les premiers articles arrivent très bientôt.</strong></p><p>Chaque jour, un article de fond le matin et un conseil pratique l'après-midi.</p></div>`;
  const pagination = total > 1 ? `
    <nav class="r-pagination" aria-label="Pages d'articles">
      ${numero > 1 ? `<a class="btn ghost" href="${lienPage(numero - 1)}" rel="prev">Articles plus récents</a>` : "<span></span>"}
      <span class="r-meta">Page ${numero} sur ${total}</span>
      ${numero < total ? `<a class="btn ghost" href="${lienPage(numero + 1)}" rel="next">Articles plus anciens</a>` : "<span></span>"}
    </nav>` : "";
  return head({
    titre: numero > 1 ? `${titre} (page ${numero})` : titre, description, url, image: OG.site,
    imageAlt: "Visuel Respi.info : Actualités respiratoires, un article de fond et un conseil pratique chaque jour", jsonld,
    extra: `${numero > 1 ? `  <link rel="prev" href="${SITE}${lienPage(numero - 1)}" />\n` : ""}${numero < total ? `  <link rel="next" href="${SITE}${lienPage(numero + 1)}" />\n` : ""}`,
  }) + `
<main id="contenu" tabindex="-1">
<section class="page-head">
  <div class="page-head-inner">
    <nav class="r-fil" aria-label="Fil d'Ariane">
      <ol><li><a href="/">Accueil</a></li>${base === "/actualites" ? `<li aria-current="page">Actualités</li>` : `<li><a href="/actualites">Actualités</a></li><li aria-current="page">${esc(titreH1)}</li>`}</ol>
    </nav>
    <span class="eyebrow">Actualités</span>
    <h1>${titreH1}</h1>
    <p>${intro}</p>
    <p class="r-meta"><a href="/charte-editoriale">Notre charte éditoriale</a><a href="/rss.xml">Flux RSS</a></p>
    <nav class="r-filtres" aria-label="Filtrer les articles">
      <p class="r-filtres-titre">Type d'article</p>
      <ul class="r-tags">${filtre("/actualites", "Tous les articles")}${filtre("/actualites/type/fond", "Articles de fond")}${filtre("/actualites/type/pratique", "Conseils pratiques")}</ul>
      ${themes.length ? `<p class="r-filtres-titre">Thématiques</p>
      <ul class="r-tags">${themes.map((t) => filtre(`/actualites/theme/${t}`, THEMATIQUES[t])).join("")}</ul>` : ""}
    </nav>
  </div>
</section>
<section class="section">
  <div class="section-inner">
    ${cartes}${pagination}
    <p class="r-charte-ligne">Ces articles informent et ne remplacent pas l'avis de ton médecin ou de ton équipe soignante. En cas d'aggravation brutale de ta respiration, appelle le <strong>15</strong>.</p>
  </div>
</section>
</main>

` + pied();
}

function rss(articles) {
  const items = articles.slice(0, 50).map((a) => `    <item>
      <title>${esc(a.title)}</title>
      <link>${urlArticle(a)}</link>
      <guid isPermaLink="true">${urlArticle(a)}</guid>
      <pubDate>${new Date(isoParis(a.date, a.heure)).toUTCString()}</pubDate>
      <category>${esc(TYPES[a.type].label)}</category>
${a.thematiques.map((t) => `      <category>${esc(THEMATIQUES[t])}</category>`).join("\n")}
      <description>${esc(a.description)}</description>
    </item>`).join("\n");
  const derniere = articles[0] ? `\n    <lastBuildDate>${new Date(isoParis(articles[0].date, articles[0].heure)).toUTCString()}</lastBuildDate>` : "";
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Actualités Respi.info</title>
    <link>${SITE}/actualites</link>
    <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml" />
    <description>Santé respiratoire : un article de fond le matin et un conseil pratique l'après-midi, sourcés.</description>
    <language>fr-FR</language>${derniere}
${items}
  </channel>
</rss>
`;
}

function sitemap(actuel, entrees) {
  const blocs = actuel.match(/<url>[\s\S]*?<\/url>/g) || [];
  const gardes = blocs.filter((b) => { const loc = (b.match(/<loc>([^<]+)<\/loc>/) || [])[1] || ""; return !(loc === `${SITE}/actualites` || loc.startsWith(`${SITE}/actualites/`) || loc.startsWith(`${SITE}/actualites-`)); });
  const nouvelles = entrees.map((e) => `  <url><loc>${e.loc}</loc>${e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ""}<changefreq>${e.freq}</changefreq><priority>${e.prio}</priority></url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${gardes.map((b) => "  " + b.trim()).join("\n")}\n${nouvelles.join("\n")}\n</urlset>\n`;
}

/* ------------------------------------------------------------------ */
/* 5. Exécution                                                        */
/* ------------------------------------------------------------------ */
const sorties = new Map(); // chemin relatif -> contenu
const pause = fs.existsSync(path.join(SRC, "PAUSE"));

validerEvenements();

const fichiers = fs.existsSync(SRC) ? fs.readdirSync(SRC).filter((f) => f.endsWith(".md")).sort() : [];
const articles = [];
for (const f of fichiers) {
  const brut = lire(path.join(SRC, f));
  const lu = lireArticle(f, brut);
  if (!lu) continue;
  validerArticle(f, brut, lu.meta, lu.corps);
  articles.push({ ...lu.meta, thematiques: lu.meta.thematiques || [], slug: path.basename(f, ".md"), fichier: f, html: markdown(lu.corps), mots: compterMots(lu.corps) });
}
const parJourType = new Map();
for (const a of articles) {
  const cle = `${a.date}|${a.type}`;
  if (parJourType.has(cle)) err(a.fichier, `deux articles « ${a.type} » le ${a.date} (avec ${parJourType.get(cle)}) : un fond et un pratique au maximum par jour`);
  else parJourType.set(cle, a.fichier);
}
// Fichiers de relecture orphelins
if (fs.existsSync(RELECTURES)) for (const r of fs.readdirSync(RELECTURES).filter((x) => x.endsWith(".json")))
  if (!fichiers.includes(r.replace(/\.json$/, ".md"))) warn(`relectures/${r}`, "relecture sans article correspondant (à supprimer)");

// PAUSE : aucune nouvelle publication ; les retraits et les régénérations restent possibles
if (pause) {
  const existants = new Set(fs.existsSync(path.join(ROOT, "actualites")) ? fs.readdirSync(path.join(ROOT, "actualites")).filter((x) => x.endsWith(".html")).map((x) => x.replace(/\.html$/, "")) : []);
  const nouveaux = articles.filter((a) => !existants.has(a.slug)).map((a) => a.fichier);
  if (nouveaux.length) {
    console.error(`\nPAUSE ACTIVE (content/actualites/PAUSE) : publication arrêtée.\nNouvel(s) article(s) refusé(s) : ${nouveaux.join(", ")}\nPour reprendre : supprimer content/actualites/PAUSE.`);
    process.exit(3);
  }
  console.log("PAUSE active : aucun nouvel article, régénération autorisée (retraits, corrections).");
}

const publies = [...articles].sort((a, b) => (b.date + b.heure + b.type).localeCompare(a.date + a.heure + a.type));
const themesUtilises = Object.keys(THEMATIQUES).filter((t) => publies.some((a) => a.thematiques.includes(t)));
const INTRO = "Le matin, un article de fond qui explique une actualité scientifique ou sanitaire et ce qu'elle change au quotidien. L'après-midi, un conseil pratique à appliquer tout de suite. Toujours sourcé, jamais un avis médical individuel.";

function paginer(liste, base, fichierBase, opts) {
  const total = Math.max(1, Math.ceil(liste.length / PAR_PAGE));
  for (let n = 1; n <= total; n++) {
    const fichier = n === 1 ? `${fichierBase}.html` : `${fichierBase}-page-${n}.html`;
    sorties.set(fichier, pageListe({ ...opts, articles: liste.slice((n - 1) * PAR_PAGE, n * PAR_PAGE), base, numero: n, total, themes: themesUtilises }));
  }
  return total;
}

if (!erreurs.length) {
  for (const a of publies) sorties.set(`actualites/${a.slug}.html`, pageArticle(a, publies));
  paginer(publies, "/actualites", "actualites", {
    titreH1: "Santé respiratoire : <em>l'essentiel, chaque jour.</em>", intro: INTRO, actif: "/actualites",
    titre: "Actualités respiratoires : BPCO, asthme, qualité de l'air | Respi.info",
    description: "Chaque jour, un article de fond et un conseil pratique sur la santé respiratoire : BPCO, asthme, allergies, pollution de l'air. Sources officielles citées.",
  });
  for (const t of Object.keys(TYPES)) {
    paginer(publies.filter((a) => a.type === t), `/actualites/type/${t}`, `actualites/type/${t}`, {
      titreH1: t === "fond" ? "Articles de fond" : "Conseils pratiques", actif: `/actualites/type/${t}`,
      intro: t === "fond" ? "Une actualité scientifique ou sanitaire expliquée simplement, et ce qu'elle change au quotidien." : "Un geste concret à appliquer aujourd'hui, souvent lié à la saison.",
      titre: `${t === "fond" ? "Articles de fond" : "Conseils pratiques"} sur la santé respiratoire | Respi.info`,
      description: t === "fond" ? "Articles de fond Respi.info : recherche, recommandations officielles et qualité de l'air expliquées simplement pour les patients respiratoires." : "Conseils pratiques Respi.info : un geste concret par jour pour mieux respirer avec une BPCO, un asthme, une allergie ou face à la pollution.",
    });
  }
  for (const t of themesUtilises) {
    paginer(publies.filter((a) => a.thematiques.includes(t)), `/actualites/theme/${t}`, `actualites/theme/${t}`, {
      titreH1: `Thématique : ${esc(THEMATIQUES[t])}`, actif: `/actualites/theme/${t}`,
      intro: `Tous les articles de fond et conseils pratiques Respi.info sur la thématique ${esc(THEMATIQUES[t])}.`,
      titre: `${THEMATIQUES[t]} : actualités et conseils | Respi.info`,
      description: `Articles de fond et conseils pratiques Respi.info sur la thématique ${THEMATIQUES[t]}, rédigés à partir de sources officielles et sans conseil médical individuel.`.slice(0, 160),
    });
  }
  sorties.set("rss.xml", rss(publies));
  const derniere = publies[0] ? isoParis(publies[0].mis_a_jour && publies[0].mis_a_jour > publies[0].date ? publies[0].mis_a_jour : publies[0].date, publies[0].heure) : null;
  sorties.set("actualites/index.json", JSON.stringify({
    maj: derniere, site: SITE, rss: `${SITE}/rss.xml`,
    articles: publies.slice(0, 30).map((a) => ({
      slug: a.slug, titre: a.title, description: a.description, date: a.date, heure: a.heure, publie_le: isoParis(a.date, a.heure),
      mis_a_jour: a.mis_a_jour || null, type: a.type, type_libelle: TYPES[a.type].label, thematiques: a.thematiques,
      temps_lecture_min: tempsLecture(a.mots), url: urlArticle(a), image: OG[a.type], image_alt: a.image_alt || ALT_DEFAUT[a.type],
    })),
  }, null, 2) + "\n");
  const entrees = [{ loc: `${SITE}/actualites`, lastmod: publies[0]?.date, freq: "daily", prio: "0.9" }];
  for (const t of Object.keys(TYPES)) if (publies.some((a) => a.type === t)) entrees.push({ loc: `${SITE}/actualites/type/${t}`, lastmod: publies.find((a) => a.type === t).date, freq: "daily", prio: "0.6" });
  for (const t of themesUtilises) entrees.push({ loc: `${SITE}/actualites/theme/${t}`, lastmod: publies.find((a) => a.thematiques.includes(t)).date, freq: "weekly", prio: "0.5" });
  for (const a of publies) entrees.push({ loc: urlArticle(a), lastmod: a.mis_a_jour || a.date, freq: "monthly", prio: a.type === "fond" ? "0.8" : "0.7" });
  sorties.set("sitemap.xml", sitemap(lire(path.join(ROOT, "sitemap.xml")), entrees));

  // En-tête et pied de page recopiés dans chaque page HTML de la racine
  for (const f of fs.readdirSync(ROOT).filter((x) => x.endsWith(".html") && !sorties.has(x))) {
    let html = lire(path.join(ROOT, f));
    for (const [nom, bloc] of [["entete", ENTETE], ["pied", PIED]]) {
      const [d, fin] = MARQUEURS[nom];
      const i = html.indexOf(d), j = html.indexOf(fin);
      if (i < 0 || j < i) { err(f, `marqueurs ${d} ... ${fin} absents : la page ne reçoit pas l'${nom === "entete" ? "en-tête" : "le pied de page"} commun`); continue; }
      html = html.slice(0, i + d.length) + "\n" + bloc + "\n" + html.slice(j);
    }
    if (!/<main\b[^>]*id="contenu"/.test(html)) err(f, "zone <main id=\"contenu\"> absente (cible du lien « Aller au contenu »)");
    sorties.set(f, html);
  }
}

/* ------------------------------------------------------------------ */
/* 6. Contrôles globaux : liens internes et adresses e-mail            */
/* ------------------------------------------------------------------ */
const ancien = new Set();
if (!erreurs.length) {
  // Fichiers générés obsolètes (article retiré, page de liste disparue)
  const dossier = path.join(ROOT, "actualites");
  const parcourir = (d) => fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? parcourir(path.join(d, e.name)) : [rel(path.join(d, e.name))]) : [];
  for (const f of parcourir(dossier)) if (!sorties.has(f)) ancien.add(f);
  for (const f of fs.readdirSync(ROOT).filter((x) => /^actualites-page-\d+\.html$/.test(x))) if (!sorties.has(f)) ancien.add(f);

  const existe = (p) => (sorties.has(p) || (fs.existsSync(path.join(ROOT, p)) && !ancien.has(p)));
  const resoudre = (cible) => {
    const p = decodeURIComponent(cible.split(/[?#]/)[0]).replace(/^\//, "");
    if (p === "") return existe("index.html");
    if (/\.[a-z0-9]{2,5}$/i.test(p)) return existe(p) && !p.endsWith(".html") ? true : existe(p);
    return existe(p + ".html") || existe(p.replace(/\/$/, "") + "/index.html");
  };
  const pagesHtml = new Map();
  for (const f of fs.readdirSync(ROOT).filter((x) => x.endsWith(".html"))) pagesHtml.set(f, sorties.get(f) ?? lire(path.join(ROOT, f)));
  for (const [f, c] of sorties) if (f.endsWith(".html")) pagesHtml.set(f, c);
  for (const [f, html] of pagesHtml) {
    const sansScripts = html.replace(/<script\b[\s\S]*?<\/script>/gi, "");
    for (const [, attr, cible] of sansScripts.matchAll(/\b(href|src|srcset)="([^"]+)"/g)) {
      for (const c of attr === "srcset" ? cible.split(",").map((x) => x.trim().split(/\s+/)[0]) : [cible]) {
        if (/^(https?:|#|tel:|data:|\/\/)/i.test(c)) { if (/^http:\/\//i.test(c)) err(f, `lien non sécurisé http « ${c} »`); continue; }
        const absolu = c.startsWith("/") ? c : "/" + path.posix.join(path.posix.dirname(f), c);
        if (!resoudre(absolu)) err(f, `lien interne cassé « ${c} »`);
        if (/\.html(?:[?#]|$)/.test(c) && !c.includes("assets/")) warn(f, `lien interne avec « .html » (« ${c} ») : préférer l'adresse sans extension`);
      }
    }
  }

  // Règle permanente : aucune adresse e-mail dans les fichiers du site
  const RE_MAIL = /mailto\s*:|[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
  const EXT = /\.(html|js|mjs|css|json|txt|md|xml|yml|yaml|py)$/i;
  const tous = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    if ([".git", "node_modules", ".vercel"].includes(e.name)) return [];
    const p = path.join(d, e.name);
    return e.isDirectory() ? tous(p) : EXT.test(e.name) ? [rel(p)] : [];
  });
  const aScanner = new Set([...tous(ROOT).filter((f) => !ancien.has(f)), ...sorties.keys()]);
  for (const f of aScanner) {
    const contenu = sorties.get(f) ?? lire(path.join(ROOT, f));
    contenu.split("\n").forEach((ligne, i) => { const m = ligne.match(RE_MAIL); if (m) err(`${f}:${i + 1}`, `adresse e-mail ou lien mailto interdit (« ${m[0]} ») : utiliser le formulaire /contact`); });
  }
}

/* ------------------------------------------------------------------ */
/* 7. Bilan et écriture                                                */
/* ------------------------------------------------------------------ */
if (avertissements.length) console.warn(`Avertissements (non bloquants) :\n- ${avertissements.join("\n- ")}\n`);
if (erreurs.length) {
  console.error(`BUILD REFUSÉ : ${erreurs.length} problème(s) bloquant(s). Aucun fichier n'a été écrit.\n- ${erreurs.join("\n- ")}`);
  process.exit(1);
}

const aEcrire = [...sorties].filter(([f, c]) => !fs.existsSync(path.join(ROOT, f)) || lire(path.join(ROOT, f)) !== c).map(([f]) => f);
if (CHECK) {
  const mode = BROUILLON ? "Contrôle brouillon OK (relecture non exigée)" : "Contrôle OK";
  if (!BROUILLON && (aEcrire.length || ancien.size)) {
    console.error(`${mode} pour le contenu, mais les fichiers générés ne sont pas à jour (${[...aEcrire, ...ancien].slice(0, 8).join(", ")}${aEcrire.length + ancien.size > 8 ? "..." : ""}).\nLancer : node scripts/build.mjs`);
    process.exit(1);
  }
  console.log(`${mode} : ${articles.length} article(s) conforme(s), ${sorties.size} fichier(s) vérifié(s).`);
  process.exit(0);
}
for (const f of aEcrire) { fs.mkdirSync(path.dirname(path.join(ROOT, f)), { recursive: true }); fs.writeFileSync(path.join(ROOT, f), sorties.get(f)); }
for (const f of ancien) fs.rmSync(path.join(ROOT, f));
// Dossiers vides laissés par un retrait
const nettoyer = (d) => { if (!fs.existsSync(d)) return; for (const e of fs.readdirSync(d, { withFileTypes: true })) if (e.isDirectory()) nettoyer(path.join(d, e.name)); if (!fs.readdirSync(d).length && d !== path.join(ROOT, "actualites")) fs.rmdirSync(d); };
nettoyer(path.join(ROOT, "actualites"));
console.log(`Build OK : ${publies.length} article(s) publié(s), ${aEcrire.length} fichier(s) écrit(s), ${ancien.size} fichier(s) obsolète(s) supprimé(s).`);
