import { parseRepo } from './tools.mjs';

const BADGE_HOSTS = ['img.shields.io', 'badge.fury.io', 'badgen.net', 'readme-typing-svg.demolab.com', 'github-readme-stats'];

function isBadge(url) {
  return BADGE_HOSTS.some(h => url.includes(h));
}

/** Resuelve una ruta de imagen de un README a una URL absoluta válida */
export function resolveImageUrl(repoUrl, rawSrc, defaultBranch = 'main') {
  if (!rawSrc) return null;
  const src = rawSrc.trim();
  if (isBadge(src)) return null;
  
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return src;
  }
  
  const r = parseRepo(repoUrl);
  if (!r) return null;
  const cleanPath = src.replace(/^\.?\//, '');
  return `https://raw.githubusercontent.com/${r.owner}/${r.repo}/${defaultBranch}/${cleanPath}`;
}

/** Extrae el logo más probable del README de un repositorio */
export async function detectRepoLogo(repoUrl) {
  const r = parseRepo(repoUrl);
  if (!r) return null;
  
  try {
    const res = await fetch(`https://api.github.com/repos/${r.owner}/${r.repo}/readme`, {
      headers: {
        'User-Agent': 'stickybit-tools',
        Accept: 'application/vnd.github.raw',
        ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {})
      }
    });
    if (!res.ok) return null;
    const md = await res.text();
    
    // 1. Busca etiquetas <img src="..."> típicas de encabezados
    const imgMatches = [...md.matchAll(/<img[^>]+src=["'](.*?)["']/gi)];
    for (const m of imgMatches) {
      const url = resolveImageUrl(repoUrl, m[1]);
      if (url && (url.includes('logo') || url.includes('icon') || !isBadge(url))) {
        return url;
      }
    }
    
    // 2. Busca imágenes Markdown ![alt](src)
    const mdMatches = [...md.matchAll(/!\[(.*?)\]\((.*?)\)/g)];
    for (const m of mdMatches) {
      const alt = m[1].toLowerCase();
      const url = resolveImageUrl(repoUrl, m[2]);
      if (url && (alt.includes('logo') || alt.includes('icon') || m[2].includes('logo') || m[2].includes('icon'))) {
        return url;
      }
    }
    
    // Fallback: primera imagen que no sea badge
    for (const m of mdMatches) {
      const url = resolveImageUrl(repoUrl, m[2]);
      if (url) return url;
    }
  } catch {
    return null;
  }
  return null;
}
