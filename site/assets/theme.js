/* A light reading canvas for new visitors; respect either previously saved theme. */
(function () {
  var root = document.documentElement;
  var key = 'site:theme';
  var theme = 'light';
  root.setAttribute('data-js', 'true');
  try { if (localStorage.getItem(key) === 'dark') theme = 'dark'; } catch (e) { /* Storage is optional. */ }
  function apply(value) {
    theme = value === 'dark' ? 'dark' : 'light';
    root.setAttribute('data-theme', theme);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#f8f9fb' : '#101923');
    var button = document.querySelector('.theme-toggle');
    if (button) {
      button.setAttribute('aria-pressed', String(theme === 'dark'));
      button.setAttribute('title', theme === 'dark' ? 'লাইট মোড চালু করুন' : 'ডার্ক মোড চালু করুন');
    }
  }
  apply(theme);
  function init() {
    var button = document.querySelector('.theme-toggle');
    if (!button) return;
    button.hidden = false;
    apply(theme);
    button.addEventListener('click', function () {
      apply(theme === 'light' ? 'dark' : 'light');
      try { localStorage.setItem(key, theme); } catch (e) { /* The current page still toggles. */ }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  window.addEventListener('storage', function (event) {
    if (event.key === key || event.key === null) apply(event.key === null ? 'light' : event.newValue);
  });
}());
