/* One-time, block-level text entrances. Bengali words/conjuncts are never split.
   No hidden pending text, network, storage writes, frame loop or perpetual text motion. */
(function () {
  'use strict';
  var root = document.documentElement;
  if (!window.IntersectionObserver || !window.MutationObserver || !Element.prototype.animate) return;
  var media = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  var active = new Set(), seen = new WeakSet(), observer, quality;
  var selector = 'main h1,main h2,main h3,main h4,main p,main li,main .btn,main .hero-title>span,main .stat b,main .stat span,main .dabi-teaser-copy>strong,main .dabi-teaser-copy>small,main .go';
  var excluded = 'table,.sr-only,.chap,.tcard,.mcq-panel,.galaxy-control,[aria-live],[role="status"],[role="timer"],.network-diagram,[data-no-text-motion]';
  var candidates = Array.prototype.filter.call(document.querySelectorAll(selector), function (node) {
    if (node.matches('.hero-title') || node.closest(excluded)) return false;
    // Animate either a text block or its nested content, never both at once.
    var parent = node.parentElement;
    if (!node.matches('.hero-title>span') && parent && parent.closest('h1,h2,h3,h4,p,li,.btn')) return false;
    return !!node.textContent.trim();
  });
  function reduced() { return !!(media && media.matches); }
  function lite() { return root.getAttribute('data-galaxy-quality') === 'lite'; }
  function cancelAll() {
    active.forEach(function (animation) { animation.cancel(); });
    active.clear();
  }
  function sync() {
    var stop = reduced(), nextQuality = stop ? 'reduced' : lite() ? 'lite' : 'full';
    if (quality && quality !== nextQuality) cancelAll();
    quality = nextQuality;
    root.setAttribute('data-text-motion', nextQuality);
    if (stop) { cancelAll(); if (observer) observer.disconnect(); return; }
    if (observer) candidates.forEach(function (node) { if (!seen.has(node)) observer.observe(node); });
    active.forEach(function (animation) {
      if (document.hidden) animation.pause(); else if (animation.playState === 'paused') animation.play();
    });
  }
  function enter(entries) {
    var order = 0;
    entries.forEach(function (entry) {
      if (!entry.isIntersecting || document.hidden || reduced()) return;
      var node = entry.target;
      if (seen.has(node)) return;
      seen.add(node); observer.unobserve(node);
      // Lite does not allocate dozens of animations for dense text; the rest stays fully visible.
      if (active.size >= (lite() ? 6 : 28) || node.getClientRects().length === 0) return;
      var small = lite(), distance = small ? 3 : node.closest('.hero-copy') ? 16 : 10;
      try {
        var animation = node.animate([
          {opacity:small ? .8 : .45, transform:'translateY(' + distance + 'px)'},
          {opacity:1, transform:'translateY(0)'}
        ], {duration:small ? 260 : 650, delay:small ? 0 : Math.min(order++, 5) * 55, easing:'cubic-bezier(.2,.7,.2,1)', iterations:1, fill:'none'});
        active.add(animation);
        animation.onfinish = animation.oncancel = function () { active.delete(animation); };
      } catch (_) { /* A rejected animation must never hide or disable its text. */ }
    });
  }
  try {
    observer = new IntersectionObserver(enter, {threshold:.08});
    // Share the existing full/lite preference without adding a second control or storage key.
    new MutationObserver(sync).observe(root, {attributes:true, attributeFilter:['data-galaxy-quality']});
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('pagehide', cancelAll);
    window.addEventListener('pageshow', sync);
    window.addEventListener('beforeprint', cancelAll);
    if (media && media.addEventListener) media.addEventListener('change', sync);
    else if (media && media.addListener) media.addListener(sync);
    sync();
  } catch (_) { cancelAll(); if (observer) observer.disconnect(); }
}());
