#!/usr/bin/env python3
"""
Respi.info : génère une fois pour toutes les images de partage (Open Graph, 1200 x 630) de la rubrique Actualités.
  python3 scripts/og-images.py      -> assets/og/fond.png, assets/og/pratique.png, assets/og/site.png
Pillow seul, aucun service externe. Les articles réutilisent l'image de leur type : rien à générer par article.
"""
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NUIT, ENCRE, BLANC = (13, 27, 42), (31, 58, 82), (255, 255, 255)
SAUGE, AMBRE, BLEU_CLAIR, GRIS = (126, 176, 155), (232, 168, 63), (183, 224, 204), (200, 214, 226)

def police(candidats, taille):
    for p in candidats:
        if os.path.exists(p):
            return ImageFont.truetype(p, taille)
    return ImageFont.load_default()

SERIF = ["/usr/share/fonts/truetype/google-fonts/Lora-Variable.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"]
SERIF_IT = ["/usr/share/fonts/truetype/google-fonts/Lora-Italic-Variable.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Italic.ttf"]
SANS_B = ["/usr/share/fonts/opentype/inter/Inter-SemiBold.otf", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"]
SANS = ["/usr/share/fonts/opentype/inter/Inter-Regular.otf", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"]

def visuel(nom, etiquette, ligne1, ligne2, sous_titre, accent):
    img = Image.new("RGB", (1200, 630), NUIT)
    d = ImageDraw.Draw(img)
    # halo discret
    halo = Image.new("L", (1200, 630), 0)
    ImageDraw.Draw(halo).ellipse([760, -260, 1460, 440], fill=60)
    img.paste(Image.new("RGB", (1200, 630), ENCRE), (0, 0), halo)
    d = ImageDraw.Draw(img)
    d.rectangle([0, 606, 1200, 630], fill=accent)
    f_et = police(SANS_B, 24)
    larg = d.textlength(etiquette, font=f_et)
    d.rounded_rectangle([80, 72, 80 + larg + 40, 120], radius=12, fill=(255, 255, 255, 0), outline=accent, width=2)
    d.text((100, 82), etiquette, font=f_et, fill=accent)
    d.text((80, 170), ligne1, font=police(SERIF, 86), fill=BLANC)
    d.text((80, 278), ligne2, font=police(SERIF_IT, 70), fill=BLEU_CLAIR)
    d.text((80, 400), sous_titre, font=police(SANS, 30), fill=GRIS)
    logo = Image.open(os.path.join(ROOT, "assets/logo-512.png")).convert("RGBA")
    logo.thumbnail((84, 84))
    img.paste(logo, (80, 486), logo)
    d.text((182, 492), "Respi.info", font=police(SANS_B, 32), fill=BLANC)
    d.text((182, 534), "fr.respi.info/actualites", font=police(SANS, 24), fill=GRIS)
    out = os.path.join(ROOT, "assets/og", nom + ".png")
    img.save(out, optimize=True)
    print(out, os.path.getsize(out), "octets")

if __name__ == "__main__":
    os.makedirs(os.path.join(ROOT, "assets/og"), exist_ok=True)
    visuel("fond", "ARTICLE DE FOND", "Santé respiratoire,", "l'actualité expliquée.", "Recherche, recommandations et qualité de l'air, sources citées.", AMBRE)
    visuel("pratique", "CONSEIL PRATIQUE", "Un geste concret,", "à faire aujourd'hui.", "Asthme, BPCO, allergies, pollution : un conseil sourcé par jour.", SAUGE)
    visuel("site", "APPLICATION GRATUITE", "Ton souffle,", "accompagné chaque matin.", "Qualité de l'air, pollens, météo et ta maladie respiratoire.", SAUGE)
