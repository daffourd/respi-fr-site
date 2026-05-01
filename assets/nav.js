/* ============================================================
   Respi.info — Toggle nav mobile + active link auto-detect
   Pas de drawer plein écran : nav horizontale visible sur desktop,
   dropdown sous header sur mobile.
   ============================================================ */
(function () {
  var btn = document.querySelector('.r-nav-toggle');
  var nav = document.querySelector('.r-nav');

  // Active link auto-marqué selon URL courante
  if (nav) {
    var current = location.pathname.replace(/^\//, '');
    if (current === '' || current === '/') current = 'index.html';
    if (current.indexOf('.') === -1) current += '.html';
    nav.querySelectorAll('a').forEach(function (a) {
      var href = (a.getAttribute('href') || '').replace(/^\.?\//, '');
      if (href === current) a.classList.add('is-active');
    });
  }

  // Burger toggle mobile
  if (btn && nav) {
    btn.setAttribute('aria-expanded', 'false');
    btn.addEventListener('click', function () {
      var isOpen = nav.classList.toggle('is-open');
      btn.classList.toggle('is-open', isOpen);
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    // Fermer au clic sur un lien
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('is-open');
        btn.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
      });
    });
    // Fermer à Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        btn.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
        btn.focus();
      }
    });
  }
})();
