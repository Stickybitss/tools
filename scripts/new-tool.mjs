// Genera tools/<slug>.yml a partir de una URL de GitHub, consultando la API.
// Uso: npm run new -- https://github.com/usuario/repo [--category recon] [--tags go,cli]
import fs from 'node:fs';
import path from 'node:path';
import { TOOLS_DIR, CATEGORIES, parseRepo } from './lib/tools.mjs';
import { fetchRepoMeta } from './lib/github.mjs';

const args = process.argv.slice(2);
const url = args.find((a) => a.startsWith('http'));
const opt = (name) => {
  const i = args.indexOf(`--${name}`);
  return i !== -1 ? args[i + 1] : undefined;
};

const r = parseRepo(url);
if (!r) {
  console.error('Uso: npm run new -- https://github.com/usuario/repo [--category recon] [--tags go,cli]');
  process.exit(1);
}
const category = opt('category') || 'other';
if (!(category in CATEGORIES)) {
  console.error(`Categoría no válida. Opciones: ${Object.keys(CATEGORIES).join(', ')}`);
  process.exit(1);
}

const meta = await fetchRepoMeta(url);
if (meta.private) throw new Error('El repositorio es privado');
const slug = r.repo.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const file = path.join(TOOLS_DIR, `${slug}.yml`);
if (fs.existsSync(file)) {
  console.error(`Ya existe tools/${slug}.yml`);
  process.exit(1);
}
const tags = (opt('tags') || meta.language.toLowerCase()).split(',').map((s) => s.trim()).filter(Boolean);
const desc = (meta.description || 'Describe aquí qué hace la herramienta (20-200 caracteres).').replace(/"/g, '\\"');

fs.writeFileSync(file, [
  `name: ${r.repo}`,
  `repo: https://github.com/${r.owner}/${r.repo}`,
  `description: "${desc}"`,
  `category: ${category}`,
  `tags: [${tags.join(', ')}]`,
  `author: ${meta.owner}`,
  `added: ${new Date().toISOString().slice(0, 10)}`,
  '',
].join('\n'));
console.log(`✓ Creado tools/${slug}.yml — revísalo y ajusta nombre, descripción y categoría.`);
if (!meta.license) console.warn('! El repo no declara licencia (es obligatoria para publicarlo).');
