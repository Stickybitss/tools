import fs from 'node:fs';
import path from 'node:path';
import { ROOT, loadTools } from './lib/tools.mjs';
import { renderHome, renderTool, render404, FAVICON } from './lib/render.mjs';
import { readCache, refreshCache } from './lib/github.mjs';

const DIST = path.join(ROOT, 'dist');
const withGithub = process.argv.includes('--github');

const site = JSON.parse(fs.readFileSync(path.join(ROOT, 'site.json'), 'utf8'));
const { tools, problems } = loadTools();

if (problems.length) {
  console.error('✗ Hay herramientas con errores:');
  for (const p of problems) for (const e of p.errors) console.error(`  tools/${p.file}: ${e}`);
  process.exit(1);
}

console.log(`Herramientas válidas: ${tools.length}`);
const meta = withGithub ? await refreshCache(tools) : readCache();

fs.rmSync(DIST, { recursive: true, force: true });
const write = (rel, content) => {
  const f = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, content);
};

// Assets
write('assets/styles.css', fs.readFileSync(path.join(ROOT, 'src/styles.css'), 'utf8') + '\n' + fs.readFileSync(path.join(ROOT, 'src/extra.css'), 'utf8'));
write('assets/app.js', fs.readFileSync(path.join(ROOT, 'src/client.js'), 'utf8'));
write('favicon.svg', FAVICON);

// Páginas
write('index.html', renderHome({ site, tools, meta }));
write('404.html', render404({ site }));
for (const tool of tools) write(`tool/${tool.slug}/index.html`, renderTool({ site, tool, meta }));

// API pública para quien quiera consumir el catálogo
const api = tools.map((t) => ({ ...t, ...(meta[t.slug] ? { stars: meta[t.slug].stars, pushed_at: meta[t.slug].pushed_at } : {}), url: `${site.siteUrl}/tool/${t.slug}/` }));
write('tools.json', JSON.stringify(api, null, 2));

// SEO
const base = site.siteUrl.replace(/\/$/, '');
const urls = ['/', ...tools.map((t) => `/tool/${t.slug}/`)];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${base}${u}</loc></url>`).join('\n')}\n</urlset>\n`);
write('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`);

console.log(`✓ Sitio generado en dist/ (${tools.length + 2} páginas)`);
