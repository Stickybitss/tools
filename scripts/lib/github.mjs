import fs from 'node:fs';
import path from 'node:path';
import { ROOT, parseRepo } from './tools.mjs';

const CACHE = path.join(ROOT, '.cache', 'github.json');

export function readCache() {
  try {
    return JSON.parse(fs.readFileSync(CACHE, 'utf8'));
  } catch {
    return {};
  }
}

export function writeCache(data) {
  fs.mkdirSync(path.dirname(CACHE), { recursive: true });
  fs.writeFileSync(CACHE, JSON.stringify(data, null, 2));
}

/** Consulta la API de GitHub para un repo. Devuelve metadatos normalizados. */
export async function fetchRepoMeta(url) {
  const r = parseRepo(url);
  if (!r) throw new Error('URL de repo no válida');
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'stickybit-tools' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetch(`https://api.github.com/repos/${r.owner}/${r.repo}`, { headers });
  if (!res.ok) throw new Error(`GitHub respondió ${res.status} para ${r.owner}/${r.repo}`);
  const j = await res.json();
  return {
    fullName: j.full_name,
    description: j.description || '',
    stars: j.stargazers_count,
    language: j.language || '',
    license: j.license?.spdx_id && j.license.spdx_id !== 'NOASSERTION' ? j.license.spdx_id : (j.license?.name || ''),
    archived: !!j.archived,
    private: !!j.private,
    pushed_at: j.pushed_at,
    owner: j.owner?.login || r.owner,
    fetchedAt: new Date().toISOString(),
  };
}

/** Actualiza la caché para todas las herramientas no-demo. Los fallos no rompen el build. */
export async function refreshCache(tools) {
  const cache = readCache();
  for (const t of tools.filter((x) => !x.demo)) {
    try {
      cache[t.slug] = await fetchRepoMeta(t.repo);
      console.log(`  ✓ ${t.slug}: ★ ${cache[t.slug].stars}`);
    } catch (e) {
      console.warn(`  ! ${t.slug}: ${e.message} (se usa la caché/ficha)`);
    }
  }
  writeCache(cache);
  return cache;
}
