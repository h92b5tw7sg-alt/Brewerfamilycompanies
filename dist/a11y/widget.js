/*!
 * Brewer accessibility menu — self-contained, no third-party requests, no tracking.
 * Usage: <script src="https://brewerfamilycompanies.com/a11y/widget.js" defer
 *          data-position="left" data-color="#d82723"
 *          data-statement="/accessibility/"></script>
 * Options (all optional): data-position left|right, data-color (button colour),
 * data-statement (link to the site's accessibility statement).
 * Preferences are stored per visitor in localStorage under "brewer-a11y".
 */
(function () {
  'use strict';
  if (window.__brewerA11y) return;
  window.__brewerA11y = true;

  var me = document.currentScript || document.querySelector('script[src*="a11y/widget"]');
  var cfg = {
    pos: (me && me.getAttribute('data-position')) === 'right' ? 'right' : 'left',
    color: (me && me.getAttribute('data-color')) || '#1f6feb',
    statement: (me && me.getAttribute('data-statement')) || ''
  };
  var KEY = 'brewer-a11y';
  var root = document.documentElement;

  var OPTIONS = [
    { id: 'text', label: 'Larger text', steps: ['Off', 'Large', 'Larger', 'Largest'] },
    { id: 'contrast', label: 'Higher contrast' },
    { id: 'links', label: 'Underline links' },
    { id: 'font', label: 'Readable font' },
    { id: 'spacing', label: 'Line spacing' },
    { id: 'motion', label: 'Stop animations' },
    { id: 'cursor', label: 'Big cursor' }
  ];

  var state = load();

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage unavailable */ }
  }

  var base = (me && me.src) ? me.src.replace(/[^/]*$/, '') : '/a11y/';
  root.classList.add(cfg.pos === 'right' ? 'ba11y-right' : 'ba11y-left');
  root.style.setProperty('--ba11y-color', cfg.color);

  function apply() {
    OPTIONS.forEach(function (o) {
      if (o.steps) {
        for (var i = 1; i < o.steps.length; i++) root.classList.toggle('ba11y-' + o.id + '-' + i, state[o.id] === i);
      } else {
        root.classList.toggle('ba11y-' + o.id, !!state[o.id]);
      }
    });
    if (state.motion) {
      document.querySelectorAll('video[autoplay]').forEach(function (v) { try { v.pause(); } catch (e) {} });
    }
  }

  function build() {
    if (!document.getElementById('ba11y-style')) {
      var link = document.createElement('link');
      link.id = 'ba11y-style';
      link.rel = 'stylesheet';
      link.href = base + 'widget.css?v=1';
      document.head.appendChild(link);
    }

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ba11y-btn';
    btn.setAttribute('aria-label', 'Accessibility options');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', 'ba11y-panel');
    btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="4" r="2" fill="currentColor"/><path d="M4 8.5l8 1.5 8-1.5M12 10v5m0 0l-3.5 6.5M12 15l3.5 6.5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    var panel = document.createElement('div');
    panel.className = 'ba11y-panel';
    panel.id = 'ba11y-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Accessibility options');
    panel.hidden = true;

    var html = '<div class="ba11y-head"><h2>Accessibility</h2><button type="button" class="ba11y-x" aria-label="Close accessibility options">×</button></div><div class="ba11y-grid">';
    OPTIONS.forEach(function (o) {
      html += '<button type="button" class="ba11y-opt" data-opt="' + o.id + '" aria-pressed="false">' + o.label + (o.steps ? '<small></small>' : '') + '</button>';
    });
    html += '</div><div class="ba11y-foot"><button type="button" class="ba11y-reset">Reset all</button>' +
      (cfg.statement ? '<a href="' + cfg.statement.replace(/"/g, '&quot;') + '">Accessibility statement</a>' : '') + '</div>';
    panel.innerHTML = html;

    document.body.appendChild(panel);
    document.body.appendChild(btn);

    function sync() {
      panel.querySelectorAll('.ba11y-opt').forEach(function (b) {
        var o = OPTIONS.filter(function (x) { return x.id === b.getAttribute('data-opt'); })[0];
        var v = state[o.id] || 0;
        b.setAttribute('aria-pressed', v ? 'true' : 'false');
        if (o.steps) b.querySelector('small').textContent = o.steps[v];
      });
    }
    function open(v) {
      panel.hidden = !v;
      btn.setAttribute('aria-expanded', v ? 'true' : 'false');
      if (v) { var f = panel.querySelector('.ba11y-opt'); if (f) f.focus(); }
    }

    btn.addEventListener('click', function () { open(panel.hidden); });
    panel.querySelector('.ba11y-x').addEventListener('click', function () { open(false); btn.focus(); });
    panel.addEventListener('click', function (e) {
      var b = e.target.closest('.ba11y-opt');
      if (!b) return;
      var o = OPTIONS.filter(function (x) { return x.id === b.getAttribute('data-opt'); })[0];
      if (o.steps) state[o.id] = ((state[o.id] || 0) + 1) % o.steps.length;
      else state[o.id] = !state[o.id];
      save(); apply(); sync();
    });
    panel.querySelector('.ba11y-reset').addEventListener('click', function () {
      state = {}; save(); apply(); sync();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !panel.hidden) { open(false); btn.focus(); }
    });
    document.addEventListener('click', function (e) {
      if (!panel.hidden && !panel.contains(e.target) && !btn.contains(e.target)) open(false);
    });
    sync();
  }

  apply();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
