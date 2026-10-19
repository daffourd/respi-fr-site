# Respi.info : site d'information `fr.respi.info`

Site statique (HTML, CSS, JavaScript léger, sans framework) hébergé sur Vercel avec `cleanUrls` : `bpco.html` est servi à l'adresse `/bpco`. Chaque push sur `main` redéploie le site.

- **www.respi.info** : l'application (dépôt séparé).
- **fr.respi.info** (ce dépôt) : pages pathologies, FAQ, sources, presse, rubrique Actualités.
- **about.respi.info** : ancien site, redirigé vers fr.respi.info.

## Rubrique Actualités

| Élément | Emplacement |
|---|---|
| Articles (Markdown) | `content/actualites/AAAA-MM-JJ-slug.md` |
| Rapports du relecteur | `content/actualites/relectures/AAAA-MM-JJ-slug.json` |
| Arrêt d'urgence | fichier `content/actualites/PAUSE` |
| Calendrier éditorial | `content/evenements.json` |
| Guide des robots rédacteurs | `scripts/REDACTION-ACTUALITES.md` |
| Règles bloquantes | `scripts/regles-editoriales.mjs` |
| En-tête et pied de page communs | `scripts/gabarits.mjs` |

Commandes (Node 18 ou plus, aucune dépendance) :

```bash
node scripts/build.mjs              # contrôle puis génère les pages (à committer)
node scripts/build.mjs --check      # contrôle seulement, échoue si un fichier généré n'est pas à jour
node scripts/build.mjs --brouillon  # contrôle un article avant relecture
python3 scripts/og-images.py        # régénère les 3 images de partage (une seule fois)
```

Fichiers générés : `actualites.html`, `actualites/*.html`, `actualites/index.json` (pour l'application), `rss.xml`, entrées `/actualites` de `sitemap.xml`, et l'en-tête et le pied de page de chaque page de la racine (entre les commentaires `entete:debut` et `pied:fin`). Pour modifier le menu, éditer `scripts/gabarits.mjs` puis lancer le build.

## Test local

```bash
python3 -m http.server 8888
# puis ouvrir http://localhost:8888/index.html (en local, ajouter .html aux adresses)
```

## Règles permanentes

- Aucune adresse e-mail sur le site : tout contact passe par `/contact` (formulaire). Le build le vérifie.
- Pas de tiret cadratin ni demi-cadratin dans les textes, pas de « qu'on ».
- Liens internes absolus et sans `.html`.

## Charte graphique

| Jeton | Valeur | Usage |
|---|---|---|
| `--bleu-encre` | `#1F3A52` | Titres, en-tête, pied de page |
| `--bleu-deep` | `#2E6CB6` | Boutons, accents |
| `--bleu-nuit` | `#0D1B2A` | Bandeau stores |
| `--sauge-deep` | `#3F6E58` | Étiquettes vertes (contraste 5,9:1) |
| `--ambre-texte` | `#8A5A00` | Étiquettes ambre (contraste 5,9:1) |
| `--corail-texte` | `#B23A1E` | Messages d'erreur (contraste 6:1) |

Polices : Inter (texte) et Playfair Display (titres en italique).
