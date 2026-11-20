/* Random campus/galaxy decorations, generated once per viewport class.
   CSS performs every animation. No frame loop, timers, tracking or network requests. */
(function () {
  'use strict';
  var button = document.querySelector('.galaxy-toggle');
  if (!button) return;
  var root = document.documentElement;
  var key = 'site:motion-paused';
  var media = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  var fields = document.querySelectorAll('[data-galaxy-field]');
  var compact = window.innerWidth <= 760;
  var paused = false;
  var palette = ['#b4ebdc', '#c9edf7', '#f5deb0', '#b3d9ef', '#e4f4da'];
  try { paused = localStorage.getItem(key) === '1'; } catch (error) { /* Storage is optional. */ }

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
  function populate() {
    for (var i = 0; i < fields.length; i++) {
      var field = fields[i];
      if (field.childElementCount) continue;
      var campus = field.getAttribute('data-galaxy-field') === 'campus';
      // At most 118 generated decorations on desktop, 63 on a phone.
      var counts = campus ? (compact ? [36, 6, 3] : [72, 8, 6]) : (compact ? [16, 2, 0] : [28, 4, 0]);
      var kinds = ['mote', 'meteor', 'halo'];
      var fragment = document.createDocumentFragment();
      for (var kind = 0; kind < kinds.length; kind++) {
        for (var n = 0; n < counts[kind]; n++) fragment.appendChild(particle(kinds[kind]));
      }
      field.appendChild(fragment);
    }
  }
  function update() {
    var reduced = !!(media && media.matches);
    var state = reduced ? 'reduced' : document.hidden ? 'hidden' : paused ? 'paused' : 'running';
    root.setAttribute('data-galaxy-motion', state);
    button.hidden = reduced;
    button.setAttribute('aria-pressed', String(paused));
    button.setAttribute('title', paused ? 'অ্যানিমেশন চালু করুন' : 'অ্যানিমেশন বন্ধ করুন');
    if (state === 'running') populate();
  }
  button.addEventListener('click', function () {
    if (media && media.matches) return;
    paused = !paused;
    try { localStorage.setItem(key, paused ? '1' : '0'); } catch (error) { /* Toggling still works on this page. */ }
    update();
  });
  document.addEventListener('visibilitychange', update);
  if (media && media.addEventListener) media.addEventListener('change', update);
  else if (media && media.addListener) media.addListener(update);
  window.addEventListener('storage', function (event) {
    if (event.key !== key && event.key !== null) return;
    paused = event.key !== null && event.newValue === '1';
    update();
  });
  window.addEventListener('resize', function () {
    var nextCompact = window.innerWidth <= 760;
    if (nextCompact === compact) return; // Never rebuild on every resize pixel or animation frame.
    compact = nextCompact;
    for (var i = 0; i < fields.length; i++) fields[i].textContent = '';
    update();
  });
  update();
}());
