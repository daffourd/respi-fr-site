/* ============================================================
   Respi.info : navigation (menus déroulants en « disclosure », burger mobile, lien actif)
   Les liens du menu sont écrits dans scripts/gabarits.mjs (source unique).
   ============================================================ */
(function () {
  var btn = document.querySelector('.r-nav-toggle');
  var nav = document.getElementById('main-nav') || document.querySelector('.r-nav');
  var groups = document.querySelectorAll('.r-nav-group');

  /* ---------- Lien actif selon l'adresse courante (avec ou sans .html) ---------- */
  function normaliser(p) {
    p = (p || '').split(/[?#]/)[0].replace(/\.html$/, '').replace(/\/index$/, '').replace(/\/+$/, '');
    return p === '' ? '/' : p;
  }
  if (nav) {
    var courant = normaliser(location.pathname);
    nav.querySelectorAll('a').forEach(function (a) {
      var cible = normaliser(a.getAttribute('href'));
      var actif = cible === courant || (cible === '/actualites' && courant.indexOf('/actualites') === 0);
      if (actif) {
        a.classList.add('is-active');
        a.setAttribute('aria-current', 'page');
        var parent = a.closest('.r-nav-group');
        if (parent) {
          var trig = parent.querySelector('.r-nav-trigger');
          if (trig) trig.classList.add('is-active');
        }
      }
    });
  }

  /* ---------- Bouton menu mobile ---------- */
  function fermerMenu(rendreFocus) {
    if (!nav || !btn) return;
    nav.classList.remove('is-open');
    btn.classList.remove('is-open');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', 'Ouvrir le menu');
    if (rendreFocus) btn.focus();
  }
  if (btn && nav) {
    btn.setAttribute('aria-expanded', 'false');
    btn.addEventListener('click', function () {
      var ouvert = nav.classList.toggle('is-open');
      btn.classList.toggle('is-open', ouvert);
      btn.setAttribute('aria-expanded', ouvert ? 'true' : 'false');
      btn.setAttribute('aria-label', ouvert ? 'Fermer le menu' : 'Ouvrir le menu');
    });
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { fermerMenu(false); fermerGroupes(); });
    });
  }

  /* ---------- Sous-menus ---------- */
  function fermerGroupes(sauf) {
    groups.forEach(function (g) {
      if (g === sauf) return;
      g.dataset.open = 'false';
      var t = g.querySelector('.r-nav-trigger');
      if (t) t.setAttribute('aria-expanded', 'false');
    });
  }
  groups.forEach(function (group) {
    var trigger = group.querySelector('.r-nav-trigger');
    if (!trigger) return;
    trigger.setAttribute('aria-expanded', 'false');
    group.dataset.open = 'false';
    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      var etaitOuvert = group.dataset.open === 'true';
      fermerGroupes();
      if (!etaitOuvert) {
        group.dataset.open = 'true';
        trigger.setAttribute('aria-expanded', 'true');
      }
    });
    /* Fermer le sous-menu quand le focus clavier le quitte */
    group.addEventListener('focusout', function (e) {
      if (!group.contains(e.relatedTarget)) {
        group.dataset.open = 'false';
        trigger.setAttribute('aria-expanded', 'false');
      }
    });
  });

  document.addEventListener('click', function (e) {
    if (!e.target.closest('.r-nav-group')) fermerGroupes();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var ouvert = document.querySelector('.r-nav-group[data-open="true"] .r-nav-trigger');
    fermerGroupes();
    if (ouvert) { ouvert.focus(); return; }
    if (nav && nav.classList.contains('is-open')) fermerMenu(true);
  });
})();
