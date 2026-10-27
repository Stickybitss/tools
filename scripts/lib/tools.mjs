import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseSimpleYaml } from './yaml.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const TOOLS_DIR = path.join(ROOT, 'tools');

export const CATEGORIES = {
  recon: 'Recon',
  osint: 'OSINT',
  web: 'Web',
  network: 'Network',
  defensive: 'Defensiva',
  ctf: 'CTF',
  forensics: 'Forense',
  other: 'Otros',
};

const REPO_RE = /^https:\/\/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:[/?#].*)?$/;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TAG_RE = /^[a-z0-9+#.-]{1,20}$/;
const AUTHOR_RE = /^[A-Za-z0-9_.-]{1,39}$/;

/** Devuelve { owner, repo } de una URL de GitHub o null. */
export function parseRepo(url) {
  const m = String(url || '').match(REPO_RE);
  return m ? { owner: m[1], repo: m[2] } : null;
}

/** Valida un objeto de herramienta. Devuelve lista de errores (vacía = ok). */
export function validateTool(slug, t) {
  const errors = [];
  if (!SLUG_RE.test(slug)) errors.push('el nombre del fichero debe ser un slug (a-z, 0-9 y guiones)');
  for (const k of ['name', 'repo', 'description', 'category', 'author']) {
    if (typeof t[k] !== 'string' || !t[k].trim()) errors.push(`falta el campo obligatorio "${k}"`);
  }
  if (t.name && t.name.length > 40) errors.push('"name" no puede superar 40 caracteres');
  if (t.repo && !parseRepo(t.repo)) errors.push('"repo" debe ser una URL https://github.com/<usuario>/<repo>');
  if (t.description) {
    if (t.description.length < 3) errors.push('"description" es demasiado corta (mínimo 3 caracteres)');
    if (t.description.length > 300) errors.push('"description" no puede superar 300 caracteres');
  }
  if (t.category && !(t.category in CATEGORIES)) {
    errors.push(`"category" debe ser una de: ${Object.keys(CATEGORIES).join(', ')}`);
  }
  if (t.author && !AUTHOR_RE.test(t.author)) errors.push('"author" solo admite letras, números, "_", "." y "-"');
  if (t.tags !== undefined) {
    if (!Array.isArray(t.tags)) errors.push('"tags" debe ser una lista: [go, cli]');
    else {
      if (t.tags.length > 6) errors.push('máximo 6 tags');
      for (const tag of t.tags) {
        if (typeof tag !== 'string' || !TAG_RE.test(tag)) errors.push(`tag no válido: "${tag}" (minúsculas, máx. 20 caracteres)`);
      }
    }
  }
  return errors;
}

/** Lee todos los tools/*.yml (ignora los que empiezan por "_"). */
export function loadTools() {
  const files = fs.readdirSync(TOOLS_DIR).filter((f) => f.endsWith('.yml') && !f.startsWith('_')).sort();
  const tools = [];
  const problems = [];
  const seenRepos = new Map();

  for (const file of files) {
    const slug = file.replace(/\.yml$/, '');
    let data;
    try {
      data = parseSimpleYaml(fs.readFileSync(path.join(TOOLS_DIR, file), 'utf8'));
    } catch (e) {
      problems.push({ file, errors: [e.message] });
      continue;
    }
    const errors = validateTool(slug, data);
    const key = data.repo ? data.repo.toLowerCase().replace(/\/$/, '') : null;
    if (key && seenRepos.has(key)) errors.push(`el repositorio ya está publicado en ${seenRepos.get(key)}`);
    else if (key) seenRepos.set(key, file);
    if (errors.length) {
      problems.push({ file, errors });
      continue;
    }
    tools.push({
      slug,
      name: data.name.trim(),
      repo: data.repo.replace(/\/$/, ''),
      description: data.description.trim(),
      category: data.category,
      tags: data.tags || [],
      author: data.author,
      language: data.language || '',
      license: data.license || '',
      logo: data.logo || '',
      demo: data.demo === true,
      added: data.added || '',
    });
  }
  return { tools, problems };
}
