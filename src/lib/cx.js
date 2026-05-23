// Tiny class-joining helper — no dependency.
export function cx(...parts) {
  const out = [];
  for (const p of parts) {
    if (!p) continue;
    if (typeof p === 'string' || typeof p === 'number') { out.push(String(p)); continue; }
    if (Array.isArray(p)) { const s = cx(...p); if (s) out.push(s); continue; }
    if (typeof p === 'object') {
      for (const k in p) if (p[k]) out.push(k);
    }
  }
  return out.join(' ');
}
