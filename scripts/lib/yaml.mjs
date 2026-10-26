// Parser mínimo de un subconjunto de YAML (sin dependencias).
// Soporta: `clave: valor`, `clave: [a, b, c]`, comillas simples/dobles,
// booleanos y comentarios con `#` al inicio de línea o tras un espacio.

function parseScalar(raw) {
  const v = raw.trim();
  if (v === '') return '';
  let m = v.match(/^"((?:[^"\\]|\\.)*)"/);
  if (m) return m[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  m = v.match(/^'((?:[^']|'')*)'/);
  if (m) return m[1].replace(/''/g, "'");
  const bare = v.replace(/\s+#.*$/, '').trim();
  if (bare === 'true') return true;
  if (bare === 'false') return false;
  return bare;
}

function parseList(inner) {
  const items = [];
  let cur = '';
  let quote = null;
  for (const ch of inner) {
    if (quote) {
      cur += ch;
      if (ch === quote) quote = null;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
      cur += ch;
    } else if (ch === ',') {
      items.push(cur);
      cur = '';
    } else cur += ch;
  }
  items.push(cur);
  return items.map((s) => s.trim()).filter(Boolean).map(parseScalar);
}

export function parseSimpleYaml(text) {
  const out = {};
  text.replace(/^\uFEFF/, '').split(/\r?\n/).forEach((line, i) => {
    const t = line.trim();
    if (!t || t.startsWith('#')) return;
    const m = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!m) throw new Error(`línea ${i + 1}: formato no válido -> "${line}"`);
    const val = m[2].trim();
    if (val.startsWith('[')) {
      const end = val.lastIndexOf(']');
      if (end === -1) throw new Error(`línea ${i + 1}: lista sin cerrar`);
      out[m[1]] = parseList(val.slice(1, end));
    } else out[m[1]] = parseScalar(val);
  });
  return out;
}
