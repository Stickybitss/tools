// JS del cliente: búsqueda, filtros y efectos. Los datos ya vienen renderizados en el HTML.
(() => {
  const $ = (s) => document.querySelector(s);
  const grid = $('#grid');
  const search = $('#search');
  const empty = $('#empty');

  /* Directorio: búsqueda + filtros por categoría */
  if (grid && search) {
    const cards = [...grid.querySelectorAll('.card')];
    let filter = 'all';
    const apply = () => {
      const q = search.value.trim().toLowerCase();
      let n = 0;
      cards.forEach((c) => {
        const ok = (filter === 'all' || c.dataset.category === filter) && c.dataset.search.includes(q);
        c.hidden = !ok;
        if (ok) n++;
      });
      if (empty) empty.style.display = n ? 'none' : 'block';
    };
    document.querySelectorAll('.filter').forEach((b) => {
      b.onclick = () => {
        $('.filter.active')?.classList.remove('active');
        b.classList.add('active');
        filter = b.dataset.filter;
        apply();
      };
    });
    search.addEventListener('input', apply);
    cards.forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--x', e.clientX - r.left + 'px');
        el.style.setProperty('--y', e.clientY - r.top + 'px');
      });
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement !== search) {
        e.preventDefault();
        search.focus();
      }
    });
  }

  /* Cabecera flotante al hacer scroll + menú móvil */
  const header = $('header');
  addEventListener('scroll', () => header.classList.toggle('scrolled', scrollY > 18), { passive: true });
  header.classList.toggle('scrolled', scrollY > 18);
  const menu = $('.menu');
  const links = $('.links');
  menu.onclick = () => {
    const open = links.classList.toggle('open');
    menu.setAttribute('aria-expanded', open);
  };
  links.querySelectorAll('a').forEach((a) => (a.onclick = () => links.classList.remove('open')));

  /* Efecto holográfico del hero */
  const hero = $('.hero');
  const heroArt = $('.hero-art');
  if (hero && heroArt && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let frame = 0, cx = 50, cy = 50, tx = 50, ty = 50;
    const animate = () => {
      cx += (tx - cx) * 0.16;
      cy += (ty - cy) * 0.16;
      heroArt.style.setProperty('--holo-x', cx.toFixed(2) + '%');
      heroArt.style.setProperty('--holo-y', cy.toFixed(2) + '%');
      frame = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.06 ? requestAnimationFrame(animate) : 0;
    };
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      tx = Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100));
      ty = Math.max(0, Math.min(100, ((e.clientY - r.top) / r.height) * 100));
      if (!frame) frame = requestAnimationFrame(animate);
    }, { passive: true });
  }

  /* Resalta la sección activa en el menú (solo en la home) */
  const navItems = [...document.querySelectorAll('[data-section]')];
  const sections = ['tools', 'manifesto', 'submit'].map((id) => document.getElementById(id)).filter(Boolean);
  if (sections.length) {
    const spy = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) navItems.forEach((a) => a.classList.toggle('active', a.dataset.section === e.target.id));
    }), { rootMargin: '-35% 0px -55%', threshold: 0 });
    sections.forEach((s) => spy.observe(s));
  }
})();
