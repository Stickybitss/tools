import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSimpleYaml } from './lib/yaml.mjs';
import { validateTool, parseRepo, loadTools } from './lib/tools.mjs';
import { esc, renderTool } from './lib/render.mjs';
import { parseIssueBody, issueToTool, toolToYaml } from './lib/issue.mjs';

test('yaml: escalares, listas, comillas y comentarios', () => {
  const o = parseSimpleYaml('# c\nname: Foo\ntags: [a, "b, c", d]\ndemo: true\ndescription: "hola # no comentario"\ncategory: web # sí comentario\n');
  assert.deepEqual(o, { name: 'Foo', tags: ['a', 'b, c', 'd'], demo: true, description: 'hola # no comentario', category: 'web' });
});

test('yaml: línea inválida lanza error', () => {
  assert.throws(() => parseSimpleYaml('esto no es yaml'));
});

test('parseRepo', () => {
  assert.deepEqual(parseRepo('https://github.com/a/b'), { owner: 'a', repo: 'b' });
  assert.equal(parseRepo('https://gitlab.com/a/b'), null);
  assert.equal(parseRepo('javascript:alert(1)'), null);
});

const ok = { name: 'X', repo: 'https://github.com/a/b', description: 'Una descripción suficientemente larga.', category: 'web', author: 'a' };

test('validateTool: válido y casos de error', () => {
  assert.deepEqual(validateTool('x', ok), []);
  assert.ok(validateTool('X Y', ok).length);
  assert.ok(validateTool('x', { ...ok, category: 'nope' }).length);
  assert.ok(validateTool('x', { ...ok, repo: 'http://evil.com' }).length);
  assert.ok(validateTool('x', { ...ok, description: 'ab' }).length);
  assert.ok(validateTool('x', { ...ok, tags: ['UPPER'] }).length);
});

test('esc neutraliza HTML', () => {
  assert.equal(esc('<img src=x onerror="a">'), '&lt;img src=x onerror=&quot;a&quot;&gt;');
});

test('renderTool escapa datos hostiles', () => {
  const site = { siteUrl: 'https://x.es', name: 'N', githubUrl: '', discordUrl: '' };
  const tool = { ...ok, slug: 'x', name: '<script>alert(1)</script>', tags: ['<b>'], demo: false, language: '', license: '' };
  const html = renderTool({ site, tool, meta: {} });
  assert.ok(!html.includes('<script>alert(1)'));
  assert.ok(html.includes('&lt;script&gt;'));
});

test('las herramientas del repositorio son válidas', () => {
  const { problems } = loadTools();
  assert.deepEqual(problems, []);
});

const ISSUE = [
  '### URL del repositorio', '', 'https://github.com/n0va/subzero2', '',
  '### Nombre', '', 'SubZero 2', '',
  '### Descripción', '', 'Escáner de subdominios rápido', 'y sin ruido.', '',
  '### Categoría', '', 'recon', '',
  '### Tags', '', 'Go, CLI', '',
  '### Confirmaciones', '', '- [x] ok', '',
].join('\n');

test('issue: parsea el formulario y genera el yml', () => {
  const f = parseIssueBody(ISSUE);
  assert.equal(f.name, 'SubZero 2');
  const { slug, tool, errors } = issueToTool(f);
  assert.deepEqual(errors, []);
  assert.equal(slug, 'subzero2');
  assert.deepEqual(tool.tags, ['go', 'cli']);
  assert.equal(tool.author, 'n0va');
  const y = parseSimpleYaml(toolToYaml(tool, '2026-01-01'));
  assert.equal(y.description, 'Escáner de subdominios rápido y sin ruido.');
  assert.deepEqual(y.tags, ['go', 'cli']);
});

test('issue: datos inválidos devuelven errores', () => {
  const { errors } = issueToTool({ repo: 'https://evil.com/x', name: '', description: 'x', category: 'zzz' });
  assert.ok(errors.length >= 3);
});

test('issue: comillas y almohadillas no rompen el yml', () => {
  const { tool } = issueToTool({ ...parseIssueBody(ISSUE), name: 'Mi "tool" #1', description: 'Descripción con "comillas" y # almohadilla dentro.' });
  const y = parseSimpleYaml(toolToYaml(tool));
  assert.equal(y.name, 'Mi "tool" #1');
  assert.equal(y.description, 'Descripción con "comillas" y # almohadilla dentro.');
});

// --- Herramientas que son una web (sin repositorio) ---
import { parseWebsite } from './lib/tools.mjs';
import { parseWebsiteHtml } from './lib/website.mjs';

test('parseWebsite: acepta https público y rechaza lo peligroso', () => {
  assert.equal(parseWebsite('https://pwnatlas.app/'), 'https://pwnatlas.app/');
  assert.equal(parseWebsite('https://pwnatlas.app/a?b=1#frag'), 'https://pwnatlas.app/a?b=1');
  for (const bad of ['http://pwnatlas.app', 'javascript:alert(1)', 'https://localhost/', 'https://127.0.0.1/', 'https://10.0.0.1/', 'https://user:pw@x.com/', 'https://x.com:8443/', 'https://intranet/', 'https://foo.local/', 'no es url']) {
    assert.equal(parseWebsite(bad), null, bad);
  }
});

const WEB_ISSUE = [
  '### Nombre de la herramienta', '', 'PwnAtlas', '',
  '### URL del repositorio o de la web', '', 'https://pwnatlas.app/', '',
  '### Descripción', '', 'Buscador gratuito de máquinas de Hack The Box.', '',
  '### Categoría', '', 'other', '',
  '### Tags', '', 'pwn', '',
].join('\n');

test('issue: una web se acepta sin repositorio y el autor es quien envía el issue', () => {
  const { slug, tool, errors } = issueToTool({ ...parseIssueBody(WEB_ISSUE), author: 'Odracir063' });
  assert.deepEqual(errors, []);
  assert.equal(slug, 'pwnatlas');
  assert.equal(tool.website, 'https://pwnatlas.app/');
  assert.equal(tool.repo, undefined);
  assert.equal(tool.author, 'Odracir063');
  const y = parseSimpleYaml(toolToYaml({ ...tool, logo: 'https://pwnatlas.app/icon.png' }, '2026-01-01'));
  assert.equal(y.website, 'https://pwnatlas.app/');
  assert.equal(y.logo, 'https://pwnatlas.app/icon.png');
  assert.deepEqual(validateTool('pwnatlas', y), []);
});

test('issue: sin autor o con URL inválida una web da error claro', () => {
  assert.ok(issueToTool({ ...parseIssueBody(WEB_ISSUE) }).errors.some((e) => e.includes('author')));
  const bad = issueToTool({ ...parseIssueBody(WEB_ISSUE), repo: 'ftp://x', author: 'a' });
  assert.ok(bad.errors.some((e) => e.includes('URL no es válida')));
});

test('web: ficha y datos estructurados', () => {
  const site = { siteUrl: 'https://x.es', mainUrl: 'https://m.es', name: 'N', githubUrl: '', discordUrl: '' };
  const tool = { name: 'PwnAtlas', website: 'https://pwnatlas.app/', repo: '', description: 'Buscador gratuito de máquinas de Hack The Box.', category: 'other', author: 'a', tags: ['pwn'], slug: 'pwnatlas', demo: false, language: '', license: '' };
  const html = renderTool({ site, tool, meta: {} });
  assert.ok(html.includes('Visitar web'));
  assert.ok(html.includes('nofollow ugc'));
  assert.ok(!html.includes('Ver en GitHub'));
  assert.ok(html.includes('WebApplication'));
});

test('parseWebsiteHtml: descripción y logo', () => {
  const html = '<title>X</title><meta name="description" content="Hola &amp; adiós"><link rel="icon" href="/favicon.ico"><link rel="apple-touch-icon" href="/icon.png">';
  const r = parseWebsiteHtml(html, 'https://pwnatlas.app/');
  assert.equal(r.description, 'Hola & adiós');
  assert.equal(r.logo, 'https://pwnatlas.app/icon.png');
});
