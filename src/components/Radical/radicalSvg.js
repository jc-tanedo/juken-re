import { getRawStorage } from 'src/utils/storage';

const MEMORY_CACHE = new Map();
const PENDING_FETCHES = new Map();
const STORAGE_PREFIX = '[JukenSvg]:';
const rawStorage = getRawStorage();

export function selectRadicalSvgUrl(subject) {
  const images = subject?.data?.character_images || [];
  const noCss = images.find(
    img => img?.content_type === 'image/svg+xml' && img?.metadata?.inline_styles === false && img?.url,
  );
  if (noCss) return noCss.url;
  const anySvg = images.find(img => img?.content_type === 'image/svg+xml' && img?.url);
  return anySvg?.url || null;
}

export function prepareRadicalSvg(svgXml, color = '#000000') {
  if (typeof svgXml !== 'string' || !/<svg\b/i.test(svgXml)) return null;

  let normalized = svgXml
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/((?:stroke|fill)\s*[:=]\s*["']?)(?:#000000|#000|black|currentColor)(?=["';\s}])/gi, `$1${color}`);

  normalized = normalized.replace(/<svg\b([^>]*)>/i, (full, attrs) => {
    let nextAttrs = attrs;
    if (!/\bviewBox\s*=/i.test(nextAttrs)) {
      const widthMatch = nextAttrs.match(/\bwidth\s*=\s*["'](\d+(?:\.\d+)?)/i);
      const heightMatch = nextAttrs.match(/\bheight\s*=\s*["'](\d+(?:\.\d+)?)/i);
      const vbWidth = widthMatch ? widthMatch[1] : '1000';
      const vbHeight = heightMatch ? heightMatch[1] : '1000';
      nextAttrs += ` viewBox="0 0 ${vbWidth} ${vbHeight}"`;
    }
    if (!/\bstroke\s*=/i.test(nextAttrs)) {
      nextAttrs += ` stroke="${color}"`;
    }
    if (!/\bfill\s*=/i.test(nextAttrs)) {
      nextAttrs += ' fill="none"';
    }
    return `<svg${nextAttrs}>`;
  });

  return normalized;
}

export function getCachedRadicalSvg(url) {
  return url ? MEMORY_CACHE.get(url) || null : null;
}

export function clearRadicalSvgCache() {
  MEMORY_CACHE.clear();
  PENDING_FETCHES.clear();
}

export async function loadRadicalSvg(url, fetchImpl = global.fetch) {
  if (!url) return null;
  if (MEMORY_CACHE.has(url)) return MEMORY_CACHE.get(url);
  if (PENDING_FETCHES.has(url)) return PENDING_FETCHES.get(url);

  const task = (async () => {
    const storageKey = `${STORAGE_PREFIX}${url}`;
    try {
      const cached = await rawStorage.getItem(storageKey);
      if (typeof cached === 'string' && /<svg\b/i.test(cached)) {
        MEMORY_CACHE.set(url, cached);
        return cached;
      }
    } catch {
      // Ignore storage read errors and try network.
    }

    if (typeof fetchImpl !== 'function') return null;
    try {
      const res = await fetchImpl(url);
      if (res && res.ok === false) return null;
      const xml = await res?.text?.();
      if (typeof xml !== 'string' || !/<svg\b/i.test(xml)) return null;
      MEMORY_CACHE.set(url, xml);
      rawStorage.setItem(storageKey, xml).catch(() => {});
      return xml;
    } catch {
      return null;
    } finally {
      PENDING_FETCHES.delete(url);
    }
  })();

  PENDING_FETCHES.set(url, task);
  return task;
}
