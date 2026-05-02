/* ============================================================
   Respi.info — Nav avec menus déroulants + burger mobile + active auto
   ============================================================ */
(function () {
  var btn = document.querySelector('.r-nav-toggle');
  var nav = document.querySelector('.r-nav');
  var groups = document.querySelectorAll('.r-nav-group');

  /* ---------- Active link auto-marqué selon URL courante ---------- */
  if (nav) {
    var current = location.pathname.replace(/^\//, '');
    if (current === '' || current === '/') current = 'index.html';
    if (current.indexOf('.') === -1) current += '.html';
    nav.querySelectorAll('a').forEach(function (a) {
      var href = (a.getAttribute('href') || '').replace(/^\.?\//, '');
      if (href === current) {
        a.classList.add('is-active');
        // Marquer aussi le trigger parent du dropdown
        var parentGroup = a.closest('.r-nav-group');
        if (parentGroup) {
          var trig = parentGroup.querySelector('.r-nav-trigger');
          if (trig) trig.classList.add('is-active');
        }
      }
    });
  }

  /* ---------- Burger toggle mobile ---------- */
  if (btn && nav) {
    btn.setAttribute('aria-expanded', 'false');
    btn.addEventListener('click', function () {
      var isOpen = nav.classList.toggle('is-open');
      btn.classList.toggle('is-open', isOpen);
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    // Fermer au clic sur un lien (pas sur un trigger)
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('is-open');
        btn.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
        closeAllGroups();
      });
    });
  }

  /* ---------- Dropdowns ---------- */
  function closeAllGroups(except) {
    groups.forEach(function (g) {
      if (g === except) return;
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
      var wasOpen = group.dataset.open === 'true';
      closeAllGroups();
      if (!wasOpen) {
        group.dataset.open = 'true';
        trigger.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* Fermer dropdowns sur clic extérieur (desktop uniquement) */
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.r-nav-group')) {
      closeAllGroups();
    }
  });

  /* Fermer sur Escape */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeAllGroups();
      if (nav && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        if (btn) {
          btn.classList.remove('is-open');
          btn.setAttribute('aria-expanded', 'false');
          btn.focus();
        }
      }
    }
  });
})();
