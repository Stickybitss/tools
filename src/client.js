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

  /* Terminal interactiva (Hero Shell) */
  const termWindow = $('#terminal-window');
  const termBody = $('#term-body');
  const termOutput = $('#term-output');
  const termInput = $('#term-input');

  if (termWindow && termInput && termOutput) {
    const history = [];
    let histIdx = -1;

    // Foco directo al hacer clic en cualquier parte de la ventana
    termWindow.addEventListener('click', () => termInput.focus());

    const scrollToBottom = () => {
      if (termBody) termBody.scrollTop = termBody.scrollHeight;
    };

    const print = (html) => {
      const p = document.createElement('div');
      p.className = 'term-line';
      p.innerHTML = html;
      termOutput.appendChild(p);
      scrollToBottom();
    };

    const COMMANDS = {
      help: () => {
        return `<p class="term-line" style="margin-bottom:6px"><b class="term-success">Comandos disponibles:</b></p>
<div class="term-table">
  <div><b>help</b></div><div>Muestra esta lista de ayuda</div>
  <div><b>tools, ls</b></div><div>Lista las herramientas públicas del arsenal</div>
  <div><b>open &lt;slug&gt;</b></div><div>Abre la ficha de una herramienta (ej. open adautograph)</div>
  <div><b>discord</b></div><div>Abre el servidor de Discord (chat.stickybit.es)</div>
  <div><b>submit</b></div><div>Ir al formulario para publicar tu herramienta</div>
  <div><b>whoami</b></div><div>Muestra tu identidad en el sistema</div>
  <div><b>clear</b></div><div>Limpia la pantalla de la terminal</div>
</div>`;
      },
      tools: () => {
        const cards = [...document.querySelectorAll('.card')];
        if (!cards.length) return `<p class="term-line dim">No hay herramientas cargadas.</p>`;
        let out = `<p class="term-line term-success">Directorio activo (${cards.length} herramientas):</p><div class="term-table">`;
        cards.forEach((c) => {
          const name = c.querySelector('h3')?.textContent || '';
          const rawAuthor = c.querySelector('.author')?.textContent || '';
          const authorMatch = rawAuthor.match(/@[A-Za-z0-9_.-]+/);
          const author = authorMatch ? authorMatch[0] : rawAuthor.trim();
          const href = c.getAttribute('href');
          out += `<div><b>${name}</b></div><div>${author} &mdash; <a class="term-link" href="${href}">ver ficha ↗</a></div>`;
        });
        out += `</div>`;
        return out;
      },
      ls: () => COMMANDS.tools(),
      discord: () => {
        window.open('https://chat.stickybit.es/', '_blank');
        return `<p class="term-line term-success">✓ Abriendo servidor de Discord: <a class="term-link" href="https://chat.stickybit.es/" target="_blank">chat.stickybit.es ↗</a></p>`;
      },
      chat: () => COMMANDS.discord(),
      submit: () => {
        const submitSection = document.getElementById('submit');
        if (submitSection) submitSection.scrollIntoView({ behavior: 'smooth' });
        return `<p class="term-line term-success">✓ Desplazando a la sección de publicación...</p>`;
      },
      whoami: () => {
        return `<p class="term-line">uid=0(root) gid=0(stickybit) groups=0(root),1337(hacker),42(maker)<br><span class="dim">Permission status: <b class="term-success">GRANTEE</b> &mdash; Happy hacking!</span></p>`;
      },
      clear: () => {
        termOutput.innerHTML = '';
        return null;
      }
    };

    termInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const raw = termInput.value.trim();
        if (!raw) return;

        // Guarda en historial
        history.push(raw);
        histIdx = history.length;

        // Imprime el comando ingresado
        print(`<span class="prompt-arrow">➜</span> <span class="prompt-tilde">~</span> <span class="term-cmd-prev">${raw.replace(/</g, '&lt;')}</span>`);
        termInput.value = '';

        const parts = raw.split(/\s+/);
        const cmd = parts[0].toLowerCase();
        const arg = parts[1]?.toLowerCase();

        if (cmd === 'open') {
          if (!arg) {
            print(`<span class="term-error">Uso: open &lt;slug&gt; (ejemplo: open adautograph o open htb-cli)</span>`);
          } else {
            const target = document.querySelector(`.card[href*="${arg}"]`);
            if (target) {
              print(`<span class="term-success">✓ Abriendo ${arg}...</span>`);
              location.href = target.getAttribute('href');
            } else {
              print(`<span class="term-error">No se encontró la herramienta "${arg}". Escribe 'tools' para ver la lista.</span>`);
            }
          }
        } else if (COMMANDS[cmd]) {
          const res = COMMANDS[cmd]();
          if (res) print(res);
        } else {
          print(`<span class="term-error">Comando no reconocido: "${cmd}". Escribe <b class="cmd-hint">help</b> para ver los comandos.</span>`);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (histIdx > 0) {
          histIdx--;
          termInput.value = history[histIdx] || '';
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (histIdx < history.length - 1) {
          histIdx++;
          termInput.value = history[histIdx] || '';
        } else {
          histIdx = history.length;
          termInput.value = '';
        }
      }
    });
  }
})();
