/* Take Some Time — mobile nav toggle (independent of motion prefs) */
(function () {
  function init() {
    var head = document.querySelector('.site-head');
    var toggle = head && head.querySelector('.nav-toggle');
    var nav = head && head.querySelector('.nav');
    if (!head || !toggle || !nav) return;
    function close() { head.classList.remove('nav-open'); toggle.setAttribute('aria-expanded', 'false'); }
    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = head.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) close(); });
    document.addEventListener('click', function (e) { if (!head.contains(e.target)) close(); });
    window.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }
  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();

/* Take Some Time — gentle motion: scroll reveals */
(function () {
  var d = document;
  d.documentElement.classList.add('js');
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var sel = [
    'section:not(.hero) h2',
    'section:not(.hero) p.lede',
    '.step', '.menu-row', '.split-media',
    '.split > div:not(.split-media)',
    '.quote', '.quote-card', '.creds',
    '.page-hero h1', '.trust'
  ].join(', ');

  var items = Array.prototype.slice.call(d.querySelectorAll(sel));
  items.forEach(function (el) { el.classList.add('reveal'); });

  // stagger children within grids/lists
  d.querySelectorAll('.steps, .menu, .quote-strip').forEach(function (group) {
    Array.prototype.slice.call(group.children).forEach(function (child, i) {
      if (child.classList.contains('reveal')) child.style.transitionDelay = (i * 0.08) + 's';
    });
  });

  if (!('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('in'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.06, rootMargin: '0px 0px -7% 0px' });
  items.forEach(function (el) { io.observe(el); });

  // safety net: ensure everything is revealed even if observer/scroll never fires
  setTimeout(function () { items.forEach(function (el) { el.classList.add('in'); }); }, 1600);
})();
