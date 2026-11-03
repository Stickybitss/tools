// Se ejecuta en GitHub Actions cuando un moderador pone la etiqueta "aprobada" a un issue.
// Lee el issue (ISSUE_BODY, ISSUE_AUTHOR), valida y crea tools/<slug>.yml. Si algo falla, imprime el motivo y sale con código 1.
// La herramienta puede ser un repositorio de GitHub o una web pública (https).
import fs from 'node:fs';
import path from 'node:path';
import { TOOLS_DIR, loadTools, validateTool } from './lib/tools.mjs';
import { parseIssueBody, issueToTool, toolToYaml } from './lib/issue.mjs';
import { fetchRepoMeta } from './lib/github.mjs';
import { fetchWebsiteMeta } from './lib/website.mjs';

const fail = (msgs) => {
  console.log('No se ha podido crear la ficha automáticamente:\n');
  for (const m of [].concat(msgs)) console.log(`- ${m}`);
  console.log('\nCorrige el issue (edita los campos) y vuelve a poner la etiqueta `aprobada`.');
  process.exit(1);
};

const fields = { ...parseIssueBody(process.env.ISSUE_BODY), author: process.env.ISSUE_AUTHOR || '' };
let { slug, tool, errors } = issueToTool(fields);

// Comprobaciones externas
try {
  if (tool.repo) {
    // Repositorio: público, no archivado y con licencia
    const meta = await fetchRepoMeta(tool.repo);
    if (meta.private) fail('el repositorio es privado');
    if (meta.archived) fail('el repositorio está archivado');
    if (!meta.license) fail('el repositorio no declara licencia (es obligatoria)');
    if ((!tool.description || tool.description.length < 3) && meta.description) tool.description = meta.description.slice(0, 300);
    if (meta.logo) tool.logo = meta.logo;
  } else if (tool.website) {
    // Web: accesible; se aprovechan su descripción y su logo
    const meta = await fetchWebsiteMeta(tool.website);
    if ((!tool.description || tool.description.length < 3) && meta.description) tool.description = meta.description.slice(0, 300);
    if (meta.logo) tool.logo = meta.logo;
  }
} catch (e) {
  fail(e.message);
}

errors = validateTool(slug, tool);
if (errors.length) fail(errors);

const file = path.join(TOOLS_DIR, `${slug}.yml`);
if (fs.existsSync(file)) fail(`ya existe una herramienta con el identificador "${slug}"`);

fs.writeFileSync(file, toolToYaml(tool));

// Comprueba duplicados y coherencia global antes de dar el visto bueno
const { problems } = loadTools();
if (problems.length) {
  fs.rmSync(file);
  fail(problems.flatMap((p) => p.errors.map((e) => `${p.file}: ${e}`)));
}

console.log(`Ficha creada: tools/${slug}.yml`);
if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `slug=${slug}\nname=${tool.name}\n`);
