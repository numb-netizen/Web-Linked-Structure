/* Native hash links become keyboard-accessible tabs. Without this file all plans stay readable. */
(function () {
  'use strict';
  var choices = document.querySelector('[data-routine-tabs]');
  if (!choices) return;
  var tabs = Array.prototype.slice.call(choices.querySelectorAll('[data-routine-choice]'));
  var panels = tabs.map(function (tab) { return document.getElementById(tab.getAttribute('data-routine-choice')); });
  if (!tabs.length || panels.some(function (panel) { return !panel; })) return;
  var selected = 0;
  function fromHash() { return tabs.findIndex(function (tab) { return tab.hash === window.location.hash; }); }
  function select(index, focus) {
    if (index < 0 || index >= tabs.length) return;
    selected = index;
    tabs.forEach(function (tab, current) {
      var active = current === index;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      panels[current].hidden = !active;
    });
    if (focus) tabs[index].focus();
  }
  function choose(index, focus) {
    // Assigning the hash remains the fallback when optional History methods are blocked.
    if (window.location.hash !== tabs[index].hash) {
      try { window.history.pushState(null, '', tabs[index].hash); }
      catch (_) { window.location.hash = tabs[index].hash; }
    }
    select(index, focus);
  }
  choices.setAttribute('role', 'tablist');
  tabs.forEach(function (tab, index) {
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panels[index].id);
    panels[index].setAttribute('role', 'tabpanel');
    panels[index].setAttribute('aria-labelledby', tab.id);
    panels[index].tabIndex = 0;
    tab.addEventListener('click', function (event) {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault(); choose(index, false);
    });
    tab.addEventListener('keydown', function (event) {
      var next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else if (event.key === ' ') next = index;
      else return;
      event.preventDefault(); choose(next, true);
    });
  });
  function syncHash() {
    var index = fromHash();
    // Other in-page links (main-content/contact/etc.) must not unexpectedly change departments.
    select(index >= 0 ? index : !window.location.hash ? 0 : selected, false);
  }
  window.addEventListener('hashchange', syncHash);
  window.addEventListener('popstate', syncHash);
  syncHash();
  var printButton = document.querySelector('[data-routine-print]');
  if (printButton && typeof window.print === 'function') {
    printButton.hidden = false;
    printButton.addEventListener('click', function () { window.print(); });
  }
}());
