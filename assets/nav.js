/* ============================================================
   Respi.info — Drawer de navigation
   Injecte le drawer dans <body> et gère son ouverture/fermeture.
   Le footer reste hardcodé dans chaque page (SEO + a11y).
   ============================================================ */
(function () {
  var drawerHTML = [
    '<aside class="drawer" id="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title" hidden>',
    '  <div class="drawer-inner">',
    '    <div class="drawer-top">',
    '      <a href="index.html" class="drawer-brand">',
    '        <img src="assets/logo.png" alt="" />',
    '        <span>Respi.info</span>',
    '      </a>',
    '      <button class="drawer-close" type="button" aria-label="Fermer le menu">Fermer</button>',
    '    </div>',
    '    <div class="drawer-grid">',
    '      <div>',
    '        <div class="drawer-eyebrow" id="drawer-title">Le projet, chapitre par chapitre</div>',
    '        <ul class="drawer-chapters">',
    '          <li><a href="index.html"><strong>Le projet, <em>en un coup d\'œil</em></strong><span class="arrow">→</span></a></li>',
    '          <li><a href="fonctionnement.html"><strong>Le parcours <em>quotidien</em></strong><span class="arrow">→</span></a></li>',
    '          <li><a href="pour-qui.html"><strong>Pour qui, <em>concrètement</em></strong><span class="arrow">→</span></a></li>',
    '          <li><a href="faq.html"><strong>Questions <em>fréquentes</em></strong><span class="arrow">→</span></a></li>',
    '          <li><a href="partenaires-sources.html"><strong>Partenaires <em>&amp; sources</em></strong><span class="arrow">→</span></a></li>',
    '          <li><a href="presse.html"><strong>Espace <em>presse</em></strong><span class="arrow">→</span></a></li>',
    '          <li><a href="telechargements.html"><strong>Affiches, fiches, <em>onepagers</em></strong><span class="arrow">→</span></a></li>',
    '        </ul>',
    '      </div>',
    '      <div class="drawer-side">',
    '        <div class="drawer-side-block">',
    '          <h4>Aller plus vite</h4>',
    '          <ul>',
    '            <li><a href="https://www.respi.info">Ouvrir l\'application</a></li>',
    '            <li><a href="contact.html">Nous écrire</a></li>',
    '            <li><a href="https://jooy.info" target="_blank" rel="noopener">JOOY (asso loi 1901)</a></li>',
    '          </ul>',
    '        </div>',
    '        <div class="drawer-side-block">',
    '          <h4>Légal</h4>',
    '          <ul>',
    '            <li><a href="https://www.respi.info/legal/mentions" target="_blank" rel="noopener">Mentions légales</a></li>',
    '            <li><a href="https://www.respi.info/legal/cgu" target="_blank" rel="noopener">CGU</a></li>',
    '            <li><a href="https://www.respi.info/legal/privacy" target="_blank" rel="noopener">Confidentialité</a></li>',
    '            <li><a href="https://www.respi.info/legal/cookies" target="_blank" rel="noopener">Cookies</a></li>',
    '          </ul>',
    '        </div>',
    '        <div class="drawer-cta">',
    '          <p><strong>Tu veux essayer&nbsp;?</strong><br>Création de compte en 30 secondes. Aucune carte bancaire.</p>',
    '          <a class="btn light" href="https://www.respi.info">Ouvrir l\'app →</a>',
    '        </div>',
    '      </div>',
    '    </div>',
    '  </div>',
    '</aside>'
  ].join('\n');

  // Inject after the body opens (avant le contenu pour pouvoir scroller derrière)
  document.body.insertAdjacentHTML('afterbegin', drawerHTML);

  var drawer = document.getElementById('drawer');
  var openers = document.querySelectorAll('[data-open-drawer]');
  var closer = drawer.querySelector('.drawer-close');

  function openDrawer() {
    drawer.hidden = false;
    // Force reflow so the transition runs
    void drawer.offsetWidth;
    drawer.classList.add('is-open');
    document.body.classList.add('no-scroll');
    closer.focus();
  }

  function closeDrawer() {
    drawer.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
    setTimeout(function () { drawer.hidden = true; }, 320);
  }

  openers.forEach(function (b) {
    b.addEventListener('click', function (e) {
      e.preventDefault();
      openDrawer();
    });
  });

  closer.addEventListener('click', closeDrawer);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
      closeDrawer();
    }
  });

  // Click sur fond noir du drawer = fermer
  drawer.addEventListener('click', function (e) {
    if (e.target === drawer) closeDrawer();
  });
})();
