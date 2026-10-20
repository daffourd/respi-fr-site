# Guide de rédaction des Actualités Respi.info

Ce guide s'adresse aux robots rédacteurs (article de fond le matin, conseil pratique l'après-midi) et au robot relecteur indépendant. Il est la référence de la charte publique https://fr.respi.info/charte-editoriale. Les articles sont publiés **sans relecture humaine préalable** : chaque règle ci-dessous compte.

## 1. Avant d'écrire

1. Si le fichier `content/actualites/PAUSE` existe : ne rien écrire, ne rien publier, s'arrêter.
2. Lire `actualites/index.json` (30 derniers articles) : ne pas reprendre un sujet traité dans les 30 derniers jours.
3. Consulter le calendrier éditorial `content/evenements.json` (voir section 7).
4. Vérifier qu'aucun article du même type n'existe déjà à la date du jour (un fond et un pratique au maximum par jour).

## 2. Ligne éditoriale

**Pour qui.** Les personnes qui vivent avec une maladie respiratoire chronique (BPCO, asthme, fibrose pulmonaire, HTAP, mucoviscidose, bronchectasies, pneumopathies d'hypersensibilité), leurs proches aidants, les personnes allergiques ou asthmatiques et celles qui sont gênées par la pollution de l'air. Beaucoup ont plus de 60 ans, certaines sont essoufflées ou fatiguées en lisant.

**Ton.** Chaleureux, clair, rassurant sans minimiser. Le site **tutoie** le lecteur (« ton médecin », « tu peux »). Niveau de lecture grand public : phrases courtes (20 mots en moyenne), un mot technique expliqué dès sa première apparition, des paragraphes de 2 à 4 phrases.

**Esprit.** Éducation thérapeutique : aider à comprendre et à agir, jamais à remplacer le soin. Chaque article se termine par ce qui change concrètement pour le lecteur.

**Article de fond (le matin, heure 07:00).** Une actualité scientifique ou sanitaire expliquée (nouvelle recommandation, étude publiée, campagne de santé publique, bilan de qualité de l'air, journée mondiale) et ce qu'elle change au quotidien. 700 à 1 400 mots.

**Conseil pratique (l'après-midi, heure 14:00).** Un geste concret applicable aujourd'hui, saisonnier si possible (aération, pollens, froid, chaleur, ozone, activité physique adaptée, sommeil, aidants, préparation d'une consultation). 300 à 650 mots.

## 3. Fichier d'article

Emplacement : `content/actualites/AAAA-MM-JJ-slug.md` (slug en minuscules, sans accent, mots séparés par des tirets simples). L'adresse publiée sera `https://fr.respi.info/actualites/AAAA-MM-JJ-slug`.

```
---
title: Titre de 20 à 70 caractères, 60 conseillés
description: Résumé de 150 à 160 caractères exactement, qui donne envie de lire et dit ce que le lecteur va apprendre.
date: 2026-10-19
heure: 07:00
type: fond
thematiques: bpco, asthme
image_alt: Texte alternatif facultatif de l'image de partage (15 à 200 caractères)
source: Titre exact de la page, Média ou organisme | https://www.exemple-officiel.fr/page
source: Deuxième source, Organisme | https://...
source: Troisième source, Organisme | https://...
---
Corps en Markdown simple.
```

- `type` : `fond` ou `pratique`.
- `thematiques` : 1 à 4 valeurs parmi `bpco`, `asthme`, `allergies`, `pollens`, `qualite-air`, `fibrose`, `mucoviscidose`, `htap`, `bronchectasies`, `etp`, `traitements`, `aidants`, `recherche`, `activite-physique`, `vie-quotidienne`.
- `mis_a_jour: AAAA-MM-JJ` : facultatif, seulement après une correction.
- Une ligne `source:` par source, au format `Titre, Média | https://...` (la dernière virgule sépare le titre du média).
- Markdown admis : `##` et `###`, listes `-` ou `1.`, **gras**, *italique*, liens `[texte](https://...)` ou `[texte](/bpco)`, citations courtes `>`. Tout HTML est refusé.
- Pas de titre `#` dans le corps : le titre vient de l'en-tête. Le gabarit ajoute seul les sources numérotées, le lien vers l'application, la ligne de charte éditoriale, l'avertissement santé (une petite cartouche discrète tout en fin d'article, numéros 15 et 112 en gras et cliquables, jamais en tête ni au milieu du texte) et 3 articles liés. Ne jamais remettre cet avertissement en encadré ni l'écrire dans le corps de l'article.

## 4. Structures types

**Article de fond**
1. Chapeau de 2 à 3 phrases : le fait, la date, pour qui c'est important.
2. `## Ce qui a été publié` (ou décidé, ou mesuré) : le fait expliqué, avec la source.
3. `## Pourquoi c'est important pour les poumons` : le mécanisme en mots simples.
4. `## Ce que cela change au quotidien` : 3 à 5 pistes concrètes, sans conseil individuel.
5. `## Quand en parler à son médecin` : situations qui justifient une question au soignant.
6. `## À retenir` : 3 à 5 puces.

**Conseil pratique**
1. Chapeau : la situation de saison et le bénéfice du geste.
2. `## Le geste` : comment faire, étape par étape.
3. `## Le bon moment` ou `## Les précautions` : adapter à la qualité de l'air, à la météo, à la fatigue.
4. `## À retenir` : 2 à 4 puces.

## 5. Règles de sources

- Au moins **3 sources** pour un fond (sur au moins 2 sites différents) et **2** pour un pratique.
- Au moins **une source officielle** de la liste blanche `DOMAINES_OFFICIELS` de `scripts/regles-editoriales.mjs` : has-sante.fr, santepubliquefrance.fr, ansm.sante.fr, sante.gouv.fr, ameli.fr, sante.fr, vaccination-info-service.fr, inserm.fr, who.int, ecdc.europa.eu, eea.europa.eu, atmo-france.org et associations agréées, goldcopd.org, ginasthma.org, splf.fr, ersnet.org, pubmed, cochranelibrary.com, legifrance.gouv.fr, service-public.fr, lesouffle.org, vaincrelamuco.org, etc.
- Les autres sources doivent figurer dans `DOMAINES_RECONNUS` (revues scientifiques, associations de patients). Un domaine absent des deux listes bloque le build : ne pas contourner, choisir une autre source. Pour ajouter un domaine, le justifier dans une demande séparée.
- URL en `https`, page précise (pas une page d'accueil), jamais de lien raccourci ni de lien de redirection.
- **Chaque source doit avoir été ouverte et lue** pendant la rédaction. Chaque chiffre du texte doit se retrouver sur une page citée, avec son année. Si un chiffre ne se vérifie pas, le retirer.
- Préférer la date de la donnée à celle de l'article qui la cite (« 17 000 décès en 2017 », pas « chaque année »).

## 6. Interdits (contrôlés par le build)

**Santé.**
- Aucun diagnostic, aucun conseil individuel (« dans ton cas », « je te recommande »).
- Aucun dosage chiffré (mg, µg, ml, UI), aucun nombre de prises, aucun débit d'oxygène en L/min. Seules les concentrations dans l'air en µg/m³ sont admises.
- Jamais « augmente ton oxygène », « arrête ton traitement », « double la dose », « remplace ton médicament », ni aucune invitation à modifier un traitement.
- Aucune promesse de guérison ou d'efficacité absolue.
- Aucun nom commercial de médicament ou de vaccin : employer la famille (« bronchodilatateur de courte durée d'action ») ou la molécule, sans conseil de prise.
- Rappeler, quand c'est utile, de parler de toute question de traitement avec son médecin ou son pharmacien.

**Personnes.** Aucun médecin, soignant, chercheur ou expert **nommé ni cité** dans les articles. Si un article gagnerait vraiment à citer un médecin, ne pas publier la citation : écrire l'article sans elle et suivre la procédure de validation décrite dans le prompt du robot (brouillon de demande soumis à Vincent Daffourd, jamais envoyé ni publié sans son accord).

**Écriture.**
- Aucun tiret cadratin ni demi-cadratin : utiliser une virgule, deux-points ou des parenthèses.
- Jamais « qu'on ». Éviter le pronom « on » (avertissement du build) : préférer « tu », « les patients », une tournure directe.
- Aucune adresse e-mail, aucun lien de messagerie, aucun numéro de téléphone sauf le 15, le 112, le 114, le 3114 et le 39 89.
- Aucun emoji.

## 7. Calendrier éditorial (`content/evenements.json`)

Chaque événement porte : `id`, `nom`, `date` (ou `date_debut` et `date_fin`), `statut` (`confirme` ou `a_confirmer`), `source_url`, `angle`, `thematiques`, parfois `a_verifier` et `messages_cles`, et une `sequence` :

- `j_moins_7` : article à publier 7 jours avant le jour J (`type` fond ou pratique, `sujet`) ;
- `jour_j_fond` et `jour_j_pratique` : sujets du jour J (date ou date_debut) ;
- `suite_pratiques` : liste de conseils pratiques datés (`date`, `sujet`).

**Procédure quotidienne du robot :**
1. Chercher un événement **confirmé** dont la séquence prévoit un article du type du robot à la date du jour (J, J moins 7 ou suite). S'il existe, traiter ce sujet en respectant l'`angle` et les `messages_cles` (par exemple le rappel du 39 89 pendant le Mois sans tabac).
2. Un événement `a_confirmer` n'est utilisé qu'après vérification de sa date sur `source_url` ou une autre source officielle. Sans confirmation, ne jamais annoncer de date précise ; choisir un autre sujet.
3. Sinon, choisir un sujet d'actualité récente (moins de 15 jours) sur une source officielle, ou un geste de saison pour le conseil pratique.
4. Toujours vérifier les faits du jour : un sujet prévu dans le calendrier ne dispense pas des règles de sources.

Le build valide ce fichier (dates réelles, statuts, champs obligatoires, pas de double réservation d'un même créneau par deux événements confirmés).

## 8. Étapes de publication

1. Écrire l'article dans `content/actualites/`.
2. `node scripts/build.mjs --brouillon` : corriger toutes les erreurs signalées.
3. Faire relire par le **relecteur indépendant**, qui n'a pas écrit l'article. Il ouvre chaque source, vérifie chaque chiffre et chaque affirmation, puis écrit `content/actualites/relectures/<nom de l'article>.json` :
   `{"article": "...", "verdict": "PUBLIER" | "CORRIGER" | "REJETER", "sha256": "<empreinte du fichier .md final>", "relu_le": "...", "relecteur": "...", "sources_verifiees": [{"url": "...", "ok": true, "constat": "..."}], "corrections": []}`.
   Le build refuse l'article si le verdict n'est pas PUBLIER, si une source n'est pas confirmée, ou si le fichier a changé après la relecture (empreinte différente).
4. `node scripts/build.mjs` puis `node scripts/build.mjs --check`.
5. Committer l'article, sa relecture et les fichiers générés (`actualites.html`, `actualites/`, `rss.xml`, `sitemap.xml`), puis pousser.

Codes de sortie du build : 0 = succès, 1 = contenu non conforme (rien n'est écrit), 3 = PAUSE active et nouvel article refusé.

## 9. Retirer ou corriger un article

- **Corriger** : modifier le `.md`, ajouter `mis_a_jour: AAAA-MM-JJ`, refaire relire (l'empreinte change), lancer `node scripts/build.mjs`, committer.
- **Retirer** : supprimer `content/actualites/<nom>.md` et sa relecture, lancer `node scripts/build.mjs` (les pages générées obsolètes sont supprimées, la liste, le flux RSS, le sitemap et `index.json` sont mis à jour), committer et pousser.
- **Tout arrêter** : créer le fichier `content/actualites/PAUSE` (un commit suffit, même depuis un téléphone). Les nouveaux articles sont alors refusés ; les retraits et corrections restent possibles. Supprimer le fichier pour reprendre.

Les signalements des lecteurs arrivent par le formulaire https://fr.respi.info/contact?sujet=correction.
