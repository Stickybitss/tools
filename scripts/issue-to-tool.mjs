// Se ejecuta en GitHub Actions cuando un moderador pone la etiqueta "aprobada" a un issue.
// Lee el issue (ISSUE_BODY), valida y crea tools/<slug>.yml. Si algo falla, imprime el motivo y sale con código 1.
import fs from 'node:fs';
import path from 'node:path';
import { TOOLS_DIR, loadTools } from './lib/tools.mjs';
import { parseIssueBody, issueToTool, toolToYaml } from './lib/issue.mjs';
import { fetchRepoMeta } from './lib/github.mjs';

const fail = (msgs) => {
  console.log('No se ha podido crear la ficha automáticamente:\n');
  for (const m of [].concat(msgs)) console.log(`- ${m}`);
  console.log('\nCorrige el issue (edita los campos) y vuelve a poner la etiqueta `aprobada`.');
  process.exit(1);
};

const { slug, tool, errors } = issueToTool(parseIssueBody(process.env.ISSUE_BODY));
if (errors.length) fail(errors);

const file = path.join(TOOLS_DIR, `${slug}.yml`);
if (fs.existsSync(file)) fail(`ya existe una herramienta con el nombre de repositorio "${slug}"`);

// Comprobaciones contra GitHub: público, no archivado y con licencia
try {
  const meta = await fetchRepoMeta(tool.repo);
  if (meta.private) fail('el repositorio es privado');
  if (meta.archived) fail('el repositorio está archivado');
  if (!meta.license) fail('el repositorio no declara licencia (es obligatoria)');
} catch (e) {
  fail(e.message);
}

fs.writeFileSync(file, toolToYaml(tool));

// Comprueba duplicados y coherencia global antes de dar el visto bueno
const { problems } = loadTools();
if (problems.length) {
  fs.rmSync(file);
  fail(problems.flatMap((p) => p.errors.map((e) => `${p.file}: ${e}`)));
}

console.log(`Ficha creada: tools/${slug}.yml`);
if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `slug=${slug}\nname=${tool.name}\n`);
