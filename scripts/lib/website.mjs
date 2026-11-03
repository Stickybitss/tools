// Comprobaciones y metadatos para herramientas que son una web (no un repositorio de GitHub).

const UA = 'Mozilla/5.0 (compatible; StickyBitTools/1.0; +https://tools.stickybit.es)';

const decode = (s) =>
  String(s || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();

/** Atributo de una etiqueta HTML, p. ej. attr('<link rel="icon" href="/a.png">', 'href'). */
function attr(tag, name) {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  return m ? m[1] ?? m[2] ?? m[3] : '';
}

/** Extrae descripción y logo (apple-touch-icon / icono de la pestaña) del HTML de una web. */
export function parseWebsiteHtml(html, baseUrl) {
  const metas = [...html.matchAll(/<meta\b[^>]*>/gi)].map((m) => m[0]);
  const links = [...html.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0]);

  const metaContent = (key) => {
    const tag = metas.find((t) => new RegExp(`(?:name|property)\\s*=\\s*["']${key}["']`, 'i').test(t));
    return tag ? decode(attr(tag, 'content')) : '';
  };

  const iconOf = (re) => links.find((t) => re.test(attr(t, 'rel')) && attr(t, 'href'));
  const best =
    iconOf(/apple-touch-icon/i) ||
    links.find((t) => /\bicon\b/i.test(attr(t, 'rel')) && /\.(png|svg|webp|jpe?g)(\?|$)/i.test(attr(t, 'href'))) ||
    iconOf(/\bicon\b/i);

  let logo = '';
  if (best) {
    try {
      const u = new URL(decode(attr(best, 'href')), baseUrl);
      if (u.protocol === 'https:') logo = u.toString();
    } catch {
      /* se ignora */
    }
  }
  const title = decode((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1]);
  return { title, description: metaContent('description') || metaContent('og:description'), logo };
}

/**
 * Visita la web: comprueba que responde y obtiene descripción y logo.
 * Lanza un Error si no es accesible (red, 404/410 o error del servidor).
 * Los códigos 401/403/429 se aceptan: muchas webs legítimas bloquean a los bots.
 */
export async function fetchWebsiteMeta(url) {
  let res;
  try {
    res = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml' },
      redirect: 'follow',
      signal: AbortSignal.timeout(12000),
    });
  } catch (e) {
    throw new Error(`no se puede acceder a la web (${e.cause?.code || e.name || 'error de red'})`);
  }
  if (res.status === 404 || res.status === 410 || res.status >= 500) {
    throw new Error(`la web responde con error ${res.status}`);
  }
  let info = { title: '', description: '', logo: '' };
  const type = res.headers.get('content-type') || '';
  if (res.ok && type.includes('html')) {
    const html = (await res.text()).slice(0, 300000);
    info = parseWebsiteHtml(html, res.url || url);
  }
  return { status: res.status, finalUrl: res.url || url, ...info };
}
