/* Random campus/galaxy decorations with full and genuinely smaller lite budgets.
   CSS performs every animation. No frame loop, timers, tracking or network requests. */
(function () {
  'use strict';
  var button = document.querySelector('.galaxy-toggle');
  if (!button) return;
  var control = document.querySelector('.galaxy-control');
  var status = document.querySelector('.galaxy-mode-status');
  var root = document.documentElement;
  // Keep the earlier key: an old saved pause now selects the requested lite mode.
  var key = 'site:motion-paused';
  var media = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  var fields = document.querySelectorAll('[data-galaxy-field]');
  var compact = window.innerWidth <= 760;
  var lite = false;
  var palette = ['#b4ebdc', '#c9edf7', '#f5deb0', '#b3d9ef', '#e4f4da'];
  try { lite = localStorage.getItem(key) === '1'; } catch (error) { /* Storage is optional. */ }

  function between(min, max) { return min + Math.random() * (max - min); }
  function property(node, name, min, max, unit) {
    node.style.setProperty(name, between(min, max).toFixed(2) + (unit || ''));
  }
  function particle(kind) {
    var node = document.createElement('span');
    node.className = 'galaxy-' + kind + ' galaxy-animated';
    property(node, '--x', 2, 98, '%');
    property(node, '--y', 4, kind === 'meteor' ? 66 : 96, '%');
    property(node, '--size', kind === 'halo' ? 45 : 1.5, kind === 'halo' ? 150 : 4.5, 'px');
    property(node, '--duration', kind === 'halo' ? 24 : kind === 'meteor' ? 7 : 9, kind === 'halo' ? 48 : kind === 'meteor' ? 19 : 25, 's');
    property(node, '--delay', -36, 0, 's');
    property(node, '--dx', -55, 70, 'px');
    property(node, '--dy', -130, -35, 'px');
    property(node, '--alpha', .25, .7);
    property(node, '--trail', 55, 135, 'px');
    property(node, '--angle', 15, 35, 'deg');
    node.style.setProperty('--tone', palette[Math.floor(Math.random() * palette.length)]);
    return node;
  }
  function reconcile(active, reduced) {
    for (var i = 0; i < fields.length; i++) {
      var field = fields[i];
      var campus = field.getAttribute('data-galaxy-field') === 'campus';
      // Lite keeps only 18 simple points on desktop / 10 on phones (full: 118 / 63).
      var counts = lite ? (campus ? [compact ? 6 : 12, 0, 0] : [compact ? 4 : 6, 0, 0])
        : campus ? (compact ? [36, 6, 3] : [72, 8, 6]) : (compact ? [16, 2, 0] : [28, 4, 0]);
      var total = reduced ? 0 : counts[0] + counts[1] + counts[2];
      // Remove, rather than CSS-hide or cache, unused particles to release their nodes/layers.
      while (field.childElementCount > total) field.removeChild(field.lastElementChild);
      if (!active || field.childElementCount === total) continue;
      var fragment = document.createDocumentFragment();
      for (var n = field.childElementCount; n < total; n++) {
        fragment.appendChild(particle(n < counts[0] ? 'mote' : n < counts[0] + counts[1] ? 'meteor' : 'halo'));
      }
      field.appendChild(fragment);
    }
  }
  function update() {
    var reduced = !!(media && media.matches);
    var state = reduced ? 'reduced' : document.hidden ? 'hidden' : lite ? 'lite' : 'running';
    root.setAttribute('data-galaxy-quality', lite ? 'lite' : 'full');
    root.setAttribute('data-galaxy-motion', state);
    if (control) control.hidden = reduced;
    button.hidden = reduced;
    button.setAttribute('aria-pressed', String(lite));
    button.setAttribute('title', lite ? 'পূর্ণ অ্যানিমেশনে ফিরুন' : 'কম ইফেক্টে হালকা অ্যানিমেশন চালু করুন');
    var label = lite ? 'হালকা মোড চলছে' : 'পূর্ণ মোড চলছে';
    if (status && status.textContent !== label) status.textContent = label;
    reconcile(state === 'running' || state === 'lite', reduced);
  }
  button.addEventListener('click', function () {
    if (media && media.matches) return;
    lite = !lite;
    try { localStorage.setItem(key, lite ? '1' : '0'); } catch (error) { /* Toggling still works on this page. */ }
    update();
  });
  document.addEventListener('visibilitychange', update);
  if (media && media.addEventListener) media.addEventListener('change', update);
  else if (media && media.addListener) media.addListener(update);
  window.addEventListener('storage', function (event) {
    if (event.key !== key && event.key !== null) return;
    lite = event.key !== null && event.newValue === '1';
    update();
  });
  window.addEventListener('resize', function () {
    var nextCompact = window.innerWidth <= 760;
    if (nextCompact === compact) return; // No rebuild on every resize pixel or animation frame.
    compact = nextCompact;
    for (var i = 0; i < fields.length; i++) fields[i].textContent = '';
    update();
  });
  update();
}());
