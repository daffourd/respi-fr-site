/**
 * Respi.info : en-tête et pied de page communs à toutes les pages du site.
 * Source unique : node scripts/build.mjs recopie ces blocs dans chaque page HTML de la racine
 * (entre les commentaires <!-- entete:debut --> ... <!-- entete:fin --> et <!-- pied:debut --> ... <!-- pied:fin -->)
 * et dans les pages générées de la rubrique Actualités.
 * Liens absolus et sans « .html » (Vercel sert /bpco pour bpco.html grâce à cleanUrls).
 */

export const ENTETE = `<a class="skip-link" href="#contenu">Aller au contenu</a>
<header class="site-header">
  <div class="site-header-inner">
    <a href="/" class="brand">
      <img src="/assets/logo-76.png" alt="" width="38" height="38" />
      <span class="brand-txt">Respi.info<small>Respirer mieux, vivre plus</small></span>
    </a>
    <nav class="r-nav" id="main-nav" aria-label="Navigation principale">
      <div class="r-nav-group">
        <button type="button" class="r-nav-trigger" aria-expanded="false" aria-controls="r-menu-app">L'application</button>
        <div class="r-nav-dropdown" id="r-menu-app">
          <a href="/fonctionnement">Le parcours</a>
          <a href="/pour-qui">Pour qui</a>
          <a href="/faq">FAQ</a>
          <a href="/soutenir">Nous soutenir</a>
        </div>
      </div>
      <div class="r-nav-group">
        <button type="button" class="r-nav-trigger" aria-expanded="false" aria-controls="r-menu-ressources">Ressources</button>
        <div class="r-nav-dropdown" id="r-menu-ressources">
          <a href="/sources">Sources</a>
          <a href="/telechargements">Téléchargements</a>
          <a href="/partenaires">Partenaires</a>
          <a href="/charte-editoriale">Charte éditoriale</a>
        </div>
      </div>
      <a href="/actualites">Actualités</a>
      <a href="/presse">Presse</a>
      <a href="/contact">Contact</a>
    </nav>
    <a class="r-cta-pill" href="https://www.respi.info">Ouvrir l'app</a>
    <button type="button" class="r-nav-toggle" aria-label="Ouvrir le menu" aria-controls="main-nav" aria-expanded="false">
      <span></span><span></span><span></span>
    </button>
  </div>
</header>`;

export const PIED = `<footer class="site-footer">
  <div class="site-footer-inner">
    <div>
      <a href="/" class="brand" style="margin-bottom: 16px;">
        <img src="/assets/logo-76.png" alt="" width="38" height="38" style="filter: brightness(0) invert(1);" />
        <span class="brand-txt" style="color: #fff;">Respi.info<small style="color: rgba(255,255,255,0.75);">Respirer mieux, vivre plus</small></span>
      </a>
      <p class="baseline">
        Application gratuite pour les personnes vivant avec une maladie respiratoire chronique,
        une allergie, un asthme ou exposées à la pollution.
        Éditée par <strong>JOOY</strong>, association loi 1901, sans publicité ni revente de données.
      </p>
    </div>
    <div>
      <p class="site-footer-title">Pathologies</p>
      <a href="/asthme">Asthme</a>
      <a href="/bpco">BPCO</a>
      <a href="/fibrose">Fibrose pulmonaire</a>
      <a href="/htap">HTAP</a>
      <a href="/bronchectasies">Bronchectasies (DDB)</a>
      <a href="/pneumopathie-hypersensibilite">Pneumopathie d'hypersensibilité</a>
      <a href="/mucoviscidose">Mucoviscidose</a>
    </div>
    <div>
      <p class="site-footer-title">Le projet</p>
      <a href="/fonctionnement">Le parcours</a>
      <a href="/actualites">Actualités</a>
      <a href="/faq">FAQ</a>
      <a href="/sources">Sources</a>
      <a href="/partenaires">Partenaires</a>
      <a href="/charte-editoriale">Charte éditoriale</a>
      <a href="/soutenir">Nous soutenir</a>
      <a href="/contact">Nous écrire</a>
    </div>
    <div>
      <p class="site-footer-title">Informations</p>
      <a href="/presse">Espace presse</a>
      <a href="/telechargements">Téléchargements</a>
      <a href="/rss.xml">Flux RSS des actualités</a>
      <a href="https://www.respi.info/legal/mentions" target="_blank" rel="noopener">Mentions légales</a>
      <a href="https://www.respi.info/legal/privacy" target="_blank" rel="noopener">Confidentialité</a>
    </div>
  </div>
  <div class="site-footer-bottom">
    <span>© 2026 JOOY, Respi.info.</span>
    <span>Respi.info n'est pas un dispositif médical et ne remplace pas l'avis d'un professionnel de santé. En cas d'urgence : <strong>15 (SAMU)</strong> ou <strong>112</strong>.</span>
  </div>
</footer>`;

export const MARQUEURS = {
  entete: ["<!-- entete:debut -->", "<!-- entete:fin -->"],
  pied: ["<!-- pied:debut -->", "<!-- pied:fin -->"],
};

export const VERSION_ASSETS = "20261019";
