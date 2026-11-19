// Phone menu for Brewer Intelligence: toggles the sidebar navigation as a glass panel.
(function () {
  var side = document.querySelector('.sidebar');
  var btn = document.querySelector('.bi-menu-toggle');
  var nav = document.getElementById('bi-main-nav');
  if (!side || !btn || !nav) return;
  function set(open) {
    side.classList.toggle('menu-open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (open) { var a = nav.querySelector('.nav.active') || nav.querySelector('.nav'); if (a) a.focus({ preventScroll: true }); }
  }
  btn.addEventListener('click', function (e) { e.stopPropagation(); set(!side.classList.contains('menu-open')); });
  nav.addEventListener('click', function (e) { if (e.target.closest('.nav')) set(false); });
  document.addEventListener('click', function (e) { if (side.classList.contains('menu-open') && !side.contains(e.target)) set(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && side.classList.contains('menu-open')) { set(false); btn.focus(); } });
  window.addEventListener('resize', function () { if (window.innerWidth > 900) set(false); });
})();
