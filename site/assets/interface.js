/* Progressive enhancements only. The directory and all page links remain static HTML. */
(function () {
  'use strict';
  var burger = document.getElementById('burger');
  var links = document.getElementById('navLinks');
  if (burger && links) {
    burger.hidden = false;
    burger.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      burger.setAttribute('aria-expanded', String(open));
    });
    links.addEventListener('click', function (event) {
      if (event.target.closest('a')) closeMenu(false);
    });
    function closeMenu(returnFocus) {
      var wasOpen = links.classList.contains('open');
      links.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
      if (wasOpen && returnFocus) burger.focus();
    }
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeMenu(true);
    });
    document.addEventListener('click', function (event) {
      if (!event.target.closest('nav')) closeMenu(false);
    });
    if (window.matchMedia) {
      var desktop = window.matchMedia('(min-width: 1201px)');
      var resize = function () { if (desktop.matches) closeMenu(false); };
      if (desktop.addEventListener) desktop.addEventListener('change', resize);
      else if (desktop.addListener) desktop.addListener(resize);
    }
  }

  var form = document.querySelector('.directory-search');
  var directory = document.querySelector('.network-directory');
  if (!form || !directory) return;
  var input = document.getElementById('directory-query');
  var status = document.getElementById('directory-status');
  var empty = document.getElementById('directory-empty');
  var diagram = document.querySelector('.network-diagram');
  var clear = form.querySelector('[data-search-reset]');
  var groups = Array.prototype.slice.call(directory.querySelectorAll('.network-directory-group'));
  var isOurApp = document.documentElement.classList.contains('hsc-android-app');
  function normalize(text) {
    return text.normalize('NFKC').toLocaleLowerCase().replace(/[০-৯]/g, function (digit) {
      return '০১২৩৪৫৬৭৮৯'.indexOf(digit);
    }).replace(/[^\p{L}\p{M}\p{N}]+/gu, ' ').trim();
  }
  var entries = Array.prototype.slice.call(directory.querySelectorAll('a[data-page]')).map(function (link) {
    var group = link.closest('.network-directory-group');
    return {link:link, excluded:isOurApp && link.dataset.page === 'android-app', text:normalize(link.textContent + ' ' + link.dataset.page + ' ' + group.dataset.graphGroup + ' ' + group.querySelector('h3').textContent)};
  });
  function filter() {
    var query = normalize(input.value), words = query ? query.split(/\s+/) : [], count = 0;
    entries.forEach(function (entry) {
      var matches = !entry.excluded && words.every(function (word) { return entry.text.includes(word); });
      entry.link.hidden = !matches;
      if (matches) count++;
    });
    groups.forEach(function (group) {
      group.hidden = !Array.prototype.some.call(group.querySelectorAll('a[data-page]'), function (link) { return !link.hidden; });
    });
    clear.hidden = !input.value;
    empty.hidden = count !== 0;
    status.textContent = count.toLocaleString('bn-BD') + (query ? 'টি পেজ পাওয়া গেছে' : 'টি পেজে সরাসরি যাওয়ার লিংক');
    if (diagram) diagram.hidden = !!query;
  }
  function reset() {
    input.value = '';
    filter();
    input.focus();
  }
  form.hidden = false;
  status.hidden = false;
  form.addEventListener('submit', function (event) { event.preventDefault(); });
  input.addEventListener('input', filter);
  input.addEventListener('keydown', function (event) { if (event.key === 'Escape') reset(); });
  document.querySelectorAll('[data-search-reset]').forEach(function (button) { button.addEventListener('click', reset); });
  window.addEventListener('pageshow', filter);
  filter();
}());
