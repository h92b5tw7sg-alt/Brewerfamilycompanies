// Companies dropdown: close on outside click, Escape, or choosing an item.
(function () {
  var menu = document.querySelector('.co-menu');
  if (!menu) return;
  document.addEventListener('click', function (e) {
    if (menu.open && !menu.contains(e.target)) menu.open = false;
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu.open) {
      menu.open = false;
      menu.querySelector('summary').focus();
    }
  });
  menu.querySelectorAll('.co-panel a').forEach(function (a) {
    a.addEventListener('click', function () { menu.open = false; });
  });
})();
