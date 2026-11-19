// Header hamburger menu: toggle, close on Escape, outside click or link click.
(function () {
  var btn = document.querySelector('.menu-toggle');
  var menu = document.getElementById('site-menu');
  if (!btn || !menu) return;
  var label = btn.querySelector('.menu-label');
  function setOpen(open) {
    menu.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.documentElement.classList.toggle('menu-open', open);
    if (label) label.textContent = open ? 'Close' : 'Menu';
    if (open) { var first = menu.querySelector('a'); if (first) first.focus({ preventScroll: true }); }
  }
  btn.addEventListener('click', function (e) { e.stopPropagation(); setOpen(!menu.classList.contains('open')); });
  document.addEventListener('click', function (e) {
    if (menu.classList.contains('open') && !menu.contains(e.target) && !btn.contains(e.target)) setOpen(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu.classList.contains('open')) { setOpen(false); btn.focus(); }
  });
  menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setOpen(false); }); });
})();
