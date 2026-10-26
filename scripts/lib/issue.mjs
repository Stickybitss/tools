import { CATEGORIES, parseRepo, validateTool } from './tools.mjs';

// Etiquetas del formulario .github/ISSUE_TEMPLATE/submit-tool.yml -> campo del .yml
const FIELD_MAP = {
  'URL del repositorio': 'repo',
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

/** Convierte los campos del issue en una herramienta validada. Devuelve { slug, tool, errors }. */
export function issueToTool(fields) {
  const r = parseRepo(oneLine(fields.repo));
  const slug = r ? r.repo.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : '';
  const tags = String(fields.tags || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const tool = {
    name: oneLine(fields.name),
    repo: r ? `https://github.com/${r.owner}/${r.repo}` : oneLine(fields.repo),
    description: oneLine(fields.description),
    category: oneLine(fields.category).toLowerCase(),
    author: r ? r.owner : '',
    tags,
  };
  return { slug, tool, errors: validateTool(slug, tool) };
}

const q = (s) => `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

/** Serializa la herramienta al formato de tools/<slug>.yml. */
export function toolToYaml(tool, added = new Date().toISOString().slice(0, 10)) {
  const lines = [
    `name: ${q(tool.name)}`,
    `repo: ${tool.repo}`,
    `description: ${q(tool.description)}`,
    `category: ${tool.category}`,
  ];
  if (tool.tags.length) lines.push(`tags: [${tool.tags.join(', ')}]`);
  lines.push(`author: ${tool.author}`, `added: ${added}`, '');
  return lines.join('\n');
}

export { CATEGORIES };
