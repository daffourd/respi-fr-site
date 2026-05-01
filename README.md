# Respi.info — site marketing `fr.respi.info`

Site de présentation de l'application Respi.info, distinct de :
- **www.respi.info** — l'application Next.js (PWA)
- **about.respi.info** — le site institutionnel (pros, presse, partenaires institutionnels)

Ce site-ci (`fr.respi.info`) est **le visage marketing/grand public** : présentation produit, téléchargements stores, partenaires et sources publiques.

## Stack

- **HTML statique pur** (2 pages, 0 dépendance JS)
- **CSS unique** (`assets/styles.css`) — charte alignée sur l'affiche A4 + flyer triptyque
- **Polices** : Inter + Playfair Display (Google Fonts)
- **Hébergement cible** : Vercel (gratuit, statique)

## Pages

| Fichier | URL | Contenu |
|---|---|---|
| `index.html` | `/` | Hero éditorial · 3 piliers · stores · pour qui · engagements · partenaires (résumé) · CTA |
| `partenaires-sources.html` | `/partenaires-sources` | Sources publiques détaillées (Atmo, RNSA, Copernicus, Météo France, HAS, GINA, GOLD, FFAAIR, SPLF, EM-Consulte, OQAI, ANSES, ESCAPE, Santé publique France) + partenaires (JOOY, Santé respiratoire France, FFAAIR, centres PID) + infrastructure (Vercel, Supabase, RGPD) |

## Test local

```bash
cd ~/Documents/Claude/Projects/Respi.info/00_Site_FR
python3 -m http.server 8888
# puis ouvre http://localhost:8888
```

## Déploiement Vercel

### 1. Créer le repo GitHub

```bash
cd ~/Documents/Claude/Projects/Respi.info/00_Site_FR
git init
git add -A
git commit -m "feat: site marketing fr.respi.info initial"
gh repo create daffourd/respi-fr-site --public --source=. --remote=origin --push
# (ou créer le repo manuellement sur github.com puis git remote add + push)
```

### 2. Importer dans Vercel

1. Aller sur https://vercel.com/new
2. Sélectionner le repo `daffourd/respi-fr-site`
3. Framework preset : **Other** (HTML statique pur)
4. Output directory : laisser vide (root)
5. Build command : laisser vide
6. Cliquer **Deploy**

### 3. Brancher le sous-domaine `fr.respi.info`

Dans le projet Vercel → **Settings → Domains** :
- Ajouter `fr.respi.info`
- Vercel demandera de créer un enregistrement CNAME chez le registrar du domaine `respi.info`

Côté **registrar** (Vercel DNS, Cloudflare, ou autre) :

| Type  | Nom | Valeur |
|-------|-----|--------|
| CNAME | `fr` | `cname.vercel-dns.com` |

(Si le DNS est géré par Vercel, l'ajout est automatique après avoir cliqué sur "Add domain".)

Propagation DNS : 1 à 30 minutes en général.

## Structure du repo

```
00_Site_FR/
├── index.html                  # Landing principale
├── partenaires-sources.html    # Page sources & partenaires
├── robots.txt
├── sitemap.xml
├── vercel.json                 # Config cache + clean URLs
├── README.md
├── assets/
│   ├── styles.css
│   ├── logo.png                # 256×256 — pour header/footer
│   ├── logo-512.png            # 512×512 — pour OG image
│   ├── favicon-16.png
│   ├── favicon-32.png
│   └── apple-touch-icon.png
└── downloads/
    ├── Respi.info_Affiche_A4.pdf
    └── Respi.info_Flyer_Triptyque.pdf
```

## Mises à jour ultérieures

Tout changement = `git add -A && git commit -m "..." && git push origin main` → Vercel redéploie automatiquement.

## Charte graphique

Reprend exactement la palette de l'app et de l'affiche A4 :

| Token | Valeur | Usage |
|---|---|---|
| `--bleu-encre` | `#1F3A52` | Titres, header, footer |
| `--bleu-deep` | `#2E6CB6` | CTA, accents serif italique |
| `--bleu-nuit` | `#0D1B2A` | Fond mockup iPhone, bandeau stores |
| `--sauge-deep` | `#5B8B75` | Pilier Coach, callouts positifs |
| `--ambre` | `#E8A83F` | Score météo, badges "Bientôt" |
| `--corail` | `#E07856` | Accent secondaire |

Typo :
- **Sans-serif body** : Inter (400/500/600/700/800)
- **Serif éditorial** : Playfair Display (600 + italique 500/600), pour reproduire les "Ton souffle, *accompagné chaque matin.*" du flyer
