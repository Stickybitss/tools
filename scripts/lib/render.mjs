import { CATEGORIES } from './tools.mjs';

/** Escapa texto para HTML (contenido y atributos). Imprescindible: los datos los envía la comunidad. */
export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function initials(name) {
  const words = name.trim().split(/[\s_-]+/).filter(Boolean);
  const s = words.length > 1 ? words[0][0] + words[1][0] : name.replace(/[^A-Za-z0-9]/g, '').slice(0, 2);
  return (s || '??').toUpperCase();
}

function fmtStars(n) {
  return n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : String(n);
}

// Logo oficial de StickyBit (proporciones tomadas del original: marco, "t" pixelada y cuadrado verde pequeño)
const MARK = '<span class="brand-mark"><svg viewBox="215 215 593 593" aria-hidden="true"><rect x="235.5" y="235.5" width="552" height="552" fill="none" stroke="#f2f4f8" stroke-width="41"/><polygon fill="#f2f4f8" points="430,338 512,338 512,430 604,430 604,502 512,502 512,583 614,583 614,655 430,655 430,502 348,502 348,430 430,430"/><rect x="645" y="277" width="102" height="102" fill="#b7ff32"/></svg></span>';

function layout({ site, root, title, description, canonicalPath, body, ogType = 'website' }) {
  const canonical = site.siteUrl.replace(/\/$/, '') + canonicalPath;
  const discord = site.discordUrl ? `<a href="${esc(site.discordUrl)}" target="_blank" rel="noreferrer">Discord</a>` : '';
  const github = site.githubUrl ? `<a href="${esc(site.githubUrl)}" target="_blank" rel="noreferrer">GitHub</a>` : '';
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="theme-color" content="#080c10">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${esc(canonical)}">
  <link rel="icon" type="image/svg+xml" href="${root}favicon.svg">
  <meta property="og:site_name" content="${esc(site.name)}">
  <meta property="og:type" content="${ogType}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${esc(canonical)}">
  <meta name="twitter:card" content="summary">
  <link rel="stylesheet" href="${root}assets/styles.css">
</head>
<body>
  <a class="skip" href="#main">Saltar al contenido</a>
  <header><nav class="shell"><a class="brand" href="${root}" aria-label="StickyBit, inicio">${MARK}<span class="brand-word">STICKY<b>BIT</b></span></a><div class="links"><a href="${root}#tools" data-section="tools">Explorar</a><a href="${root}#manifesto" data-section="manifesto">Comunidad</a><a class="submit-link" href="${root}#submit" data-section="submit">Subir herramienta <b>↗</b></a></div><button class="menu" aria-label="Abrir menú" aria-expanded="false"><i></i><i></i></button></nav></header>
  <main id="main">
${body}
  </main>
  <footer class="shell"><a class="brand" href="${root}">${MARK}<span class="brand-word">STICKY<b>BIT</b></span></a><p>Aprender, compartir y crecer en ciberseguridad.</p><div class="foot-links">${github}${discord}<span>© ${new Date().getFullYear()}</span></div></footer>
  <script src="${root}assets/app.js" defer></script>
</body>
</html>
`;
}

function card(t, meta) {
  const m = meta[t.slug] || {};
  const search = [t.name, t.author, t.description, t.category, ...t.tags].join(' ').toLowerCase();
  const lang = m.language || t.language;
  const stars = m.stars ? `<span class="stars">★ ${fmtStars(m.stars)}</span>` : '';
  return `<a class="card" href="tool/${esc(t.slug)}/" data-category="${esc(t.category)}" data-search="${esc(search)}" aria-label="Ver ${esc(t.name)}"><div class="card-top"><span class="icon">${esc(initials(t.name))}</span><span class="right">${t.demo ? '<span class="badge">demo</span>' : ''}${stars}<span class="repo-arrow">↗</span></span></div><div class="card-main"><h3>${esc(t.name)}</h3><p>${esc(t.description)}</p><div class="tags">${t.tags.map((x) => `<span class="tag">${esc(x)}</span>`).join('')}</div></div><div class="card-foot"><span class="author"><i class="avatar">${esc(initials(t.author))}</i>@${esc(t.author)}</span><span class="lang"><i></i>${esc(lang || CATEGORIES[t.category])}</span></div></a>`;
}

export function renderHome({ site, tools, meta }) {
  const hasDemo = tools.some((t) => t.demo);
  const real = tools.filter((t) => !t.demo).length;
  const makers = new Set(tools.map((t) => t.author.toLowerCase())).size;
  const used = Object.keys(CATEGORIES).filter((c) => tools.some((t) => t.category === c));
  const filters = ['<button class="filter active" data-filter="all">Todas</button>']
    .concat(used.map((c) => `<button class="filter" data-filter="${c}">${esc(CATEGORIES[c])}</button>`))
    .join('');
  const tick = ['PENTESTING', 'DEFENSIVA', 'CTFS', 'WRITE-UPS', 'CERTIFICACIONES']
    .map((x) => `<span>${x}</span>`)
    .join('<i>✦</i>') + '<i>✦</i>';

  const body = `    <section class="hero shell"><div class="hero-art" aria-hidden="true"><div class="hero-word">STICKYBIT</div><small>OFFENSIVE SECURITY / COMMUNITY</small></div>
      <div><div class="eyebrow"><i></i> comunidad de ciberseguridad${hasDemo ? ' · demo' : ''}</div><h1>Aprende.<br>Comparte. <em>Crece.</em></h1><p class="lead">Un directorio abierto de herramientas, write-ups y proyectos de seguridad creados por la comunidad. Código real para gente que quiere avanzar.</p><div class="actions"><a class="btn primary" href="#tools">Explorar herramientas <span>↓</span></a><a class="btn" href="#submit">Publicar mi proyecto <span>↗</span></a></div></div>
      <div class="terminal"><div class="term-head"><div class="dots"><i></i><i></i><i></i></div><span>stickybit@community:~</span><em>/</em></div><div class="term-body"><p><b>➜</b> ~ stickybit discover --latest</p><div class="scan"></div><p class="dim">Indexando repositorios públicos...</p><p><strong>✓</strong> catálogo cargado</p><p><strong>✓</strong> creadores conectados</p><p><strong>✓</strong> comunidad activa</p><p class="dim"><b>➜</b> ~ <i class="caret"></i></p></div></div>
      <div class="hero-stats"><div><strong>${String(hasDemo ? tools.length : real).padStart(2, '0')}</strong><span>tools${hasDemo ? ' demo' : ''}</span></div><div><strong>${String(makers).padStart(2, '0')}</strong><span>makers</span></div><div><strong>100%</strong><span>open source</span></div></div>
    </section>
    <div class="ticker" aria-hidden="true"><div class="ticker-track"><div class="ticker-group">${tick}</div><div class="ticker-group">${tick}</div></div></div>
    <section class="directory shell" id="tools"><div class="section-head"><div><span class="section-id">01 / DIRECTORIO</span><h2>Explora el arsenal</h2></div><p>Proyectos compartidos por sus propios creadores.${hasDemo ? '<br><span class="demo-note">Contenido ilustrativo mientras llegan las primeras herramientas reales.</span>' : ''}</p></div>
      <div class="controls"><label class="search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-4-4"></path></svg><input id="search" type="search" placeholder="Buscar herramienta, autor o tag..." autocomplete="off" aria-label="Buscar herramientas"><kbd>/</kbd></label><div class="filters" role="group" aria-label="Categorías">${filters}</div></div>
      <div class="tools" id="grid" aria-live="polite">${tools.map((t) => card(t, meta)).join('\n')}</div><div class="empty" id="empty"><b>404</b>No encontramos herramientas con esos filtros.</div>
    </section>
    <section class="manifesto shell" id="manifesto"><div class="manifesto-card"><span class="section-id">02 / POR QUÉ STICKYBIT</span><p class="statement">El conocimiento crece cuando circula. <strong>StickyBit conecta a quien construye con quien quiere aprender.</strong></p><div class="principles"><article><span>01</span><h3>Aprender haciendo</h3><p>Herramientas, laboratorios y write-ups para convertir curiosidad en experiencia.</p></article><article><span>02</span><h3>Compartir sin ruido</h3><p>Proyectos auditables, documentación clara y acceso directo a sus creadores.</p></article><article><span>03</span><h3>Crecer juntos</h3><p>Una comunidad para practicar, recibir feedback y dar visibilidad al talento.</p></article></div></div></section>
    <section class="contribute shell" id="submit"><div class="contribute-inner"><div><span class="section-id">03 / CONTRIBUYE</span><h2>¿Has construido<br>algo <em>potente?</em></h2></div><div class="contribute-copy"><p>Comparte tu repositorio con StickyBit. Tú mantienes el control; la comunidad te ayuda a llevarlo más lejos.</p><a class="btn light" href="${esc(site.submitUrl)}" target="_blank" rel="noreferrer">Enviar herramienta <span>↗</span></a></div></div><div class="code-note">{ learn: true, share: true, grow: together }</div></section>`;

  return layout({
    site,
    root: '',
    title: 'StickyBit Tools — Herramientas de ciberseguridad de la comunidad',
    description: 'Directorio abierto de herramientas, write-ups y proyectos de ciberseguridad creados por la comunidad StickyBit.',
    canonicalPath: '/',
    body,
  });
}

export function renderTool({ site, tool: t, meta }) {
  const m = meta[t.slug] || {};
  const lang = m.language || t.language || '—';
  const license = m.license || t.license || '—';
  let status = '—';
  if (t.demo) status = 'Demo';
  else if (m.archived) status = 'Archivado';
  else if (m.pushed_at) status = Date.now() - Date.parse(m.pushed_at) > 548 * 864e5 ? 'Inactivo' : 'Activo';
  const metaItems = [['Categoría', CATEGORIES[t.category]], ['Lenguaje', lang], ['Licencia', license], ['Estado', status]];
  if (m.stars !== undefined) metaItems.push(['Stars', String(m.stars)]);
  const repoBtn = t.demo
    ? '<a class="btn primary" aria-disabled="true" tabindex="-1">Ver en GitHub <span>↗</span></a>'
    : `<a class="btn primary" href="${esc(t.repo)}" target="_blank" rel="noreferrer noopener">Ver en GitHub <span>↗</span></a>`;
  const body = `    <div class="tool-page shell">
      <a class="back" href="../../#tools">← Volver al directorio</a>
      <article class="tool-card">
        <span class="icon">${esc(initials(t.name))}</span>
        <h1>${esc(t.name)}</h1>
        <span class="modal-author">por <a href="https://github.com/${esc(t.author)}" target="_blank" rel="noreferrer noopener">@${esc(t.author)}</a></span>
        <p class="tool-desc">${esc(t.description)}</p>
        ${t.demo ? '<p class="notice">Proyecto ilustrativo para mostrar cómo se ve una ficha completa dentro de StickyBit.</p>' : ''}
        <div class="tags">${t.tags.map((x) => `<span class="tag">${esc(x)}</span>`).join('')}</div>
        <div class="meta">${metaItems.map(([k, v]) => `<div><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`).join('')}</div>
        <p class="notice">Herramientas de seguridad: úsalas solo en sistemas propios o con autorización expresa. StickyBit no aloja el código ni se responsabiliza de su uso.</p>
        <div class="modal-actions">${repoBtn}<a class="btn" href="../../#tools">Seguir explorando</a></div>
      </article>
    </div>`;
  return layout({
    site,
    root: '../../',
    title: `${t.name} — StickyBit Tools`,
    description: t.description,
    canonicalPath: `/tool/${t.slug}/`,
    body,
    ogType: 'article',
  });
}

export function render404({ site }) {
  return layout({
    site,
    root: '/',
    title: '404 — StickyBit Tools',
    description: 'Página no encontrada.',
    canonicalPath: '/404.html',
    body: '    <section class="nf shell"><div><b>404</b><h1>Aquí no hay nada.</h1><a class="btn primary" href="/">Volver al inicio <span>→</span></a></div></section>',
  });
}

export const FAVICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><rect width="1024" height="1024" rx="230" fill="#0a0d11"/><rect x="235.5" y="235.5" width="552" height="552" fill="none" stroke="#f2f4f8" stroke-width="41"/><polygon fill="#f2f4f8" points="430,338 512,338 512,430 604,430 604,502 512,502 512,583 614,583 614,655 430,655 430,502 348,502 348,430 430,430"/><rect x="645" y="277" width="102" height="102" fill="#b7ff32"/></svg>
`;
