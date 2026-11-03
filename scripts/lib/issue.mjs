import { CATEGORIES, parseRepo, parseWebsite, validateTool } from './tools.mjs';

// Etiquetas del formulario .github/ISSUE_TEMPLATE/submit-tool.yml -> campo del .yml
const FIELD_MAP = {
  'URL del repositorio o de la web': 'repo',
  'URL del repositorio': 'repo',
  'Nombre de la herramienta': 'name',
  Nombre: 'name',
  'Descripción': 'description',
  'Categoría': 'category',
  Tags: 'tags',
};

/** Extrae los campos del cuerpo de un issue creado con el formulario ("### Etiqueta\n\nvalor"). */
export function parseIssueBody(body) {
  const out = {};
  for (const chunk of String(body || '').split(/^### /m).slice(1)) {
    const nl = chunk.indexOf('\n');
    const label = (nl < 0 ? chunk : chunk.slice(0, nl)).trim();
    const value = (nl < 0 ? '' : chunk.slice(nl + 1)).trim();
    const key = FIELD_MAP[label];
    if (key) out[key] = value === '_No response_' ? '' : value;
  }
  return out;
}

const oneLine = (s) => String(s || '').replace(/\s+/g, ' ').trim();
const slugify = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/**
 * Convierte los campos del issue en una herramienta validada. Devuelve { slug, tool, errors }.
 * La URL puede ser un repositorio de GitHub o una web (https). En una web no hay propietario de repo,
 * así que el autor es quien envía el issue (fields.author).
 */
export function issueToTool(fields) {
  const rawUrl = oneLine(fields.repo);
  const r = parseRepo(rawUrl);
  const website = r ? null : parseWebsite(rawUrl);
  const name = oneLine(fields.name);

  const slug = r ? slugify(r.repo) : website ? slugify(name) || slugify(new URL(website).hostname.replace(/^www\./, '')) : '';
  const tags = String(fields.tags || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const tool = {
    name,
    description: oneLine(fields.description),
    category: oneLine(fields.category).toLowerCase(),
    author: r ? r.owner : oneLine(fields.author),
    tags,
  };
  if (r) tool.repo = `https://github.com/${r.owner}/${r.repo}`;
  else if (website) tool.website = website;

  const errors = validateTool(slug, tool);
  if (!r && !website) {
    const i = errors.findIndex((e) => e.startsWith('falta "repo"'));
    const msg = 'la URL no es válida: usa un repositorio de GitHub (https://github.com/usuario/repo) o una web pública con https://';
    if (i >= 0) errors[i] = msg;
    else errors.push(msg);
  }
  return { slug, tool, errors };
}

const q = (s) => `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

/** Serializa la herramienta al formato de tools/<slug>.yml. */
export function toolToYaml(tool, added = new Date().toISOString().slice(0, 10)) {
  const lines = [`name: ${q(tool.name)}`];
  if (tool.repo) lines.push(`repo: ${tool.repo}`);
  if (tool.website) lines.push(`website: ${tool.website}`);
  lines.push(`description: ${q(tool.description)}`, `category: ${tool.category}`);
  if (tool.tags.length) lines.push(`tags: [${tool.tags.join(', ')}]`);
  lines.push(`author: ${tool.author}`);
  if (tool.logo) lines.push(`logo: ${tool.logo}`);
  lines.push(`added: ${added}`, '');
  return lines.join('\n');
}

export { CATEGORIES };
