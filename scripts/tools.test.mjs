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
