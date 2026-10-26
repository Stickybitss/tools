import { loadTools } from './lib/tools.mjs';

const { tools, problems } = loadTools();
if (problems.length) {
  console.error('✗ Validación fallida:\n');
  for (const p of problems) {
    console.error(`  tools/${p.file}`);
    for (const e of p.errors) console.error(`    - ${e}`);
  }
  process.exit(1);
}
console.log(`✓ ${tools.length} herramientas válidas`);
