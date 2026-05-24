// Excel backup / restore helpers — dynamic-imports SheetJS only when invoked,
// so the ~400KB xlsx library never lands in any page's initial bundle.
//
// Edge cases handled:
//   - Arrays (e.g. expenses.tags) are joined with ", " on export, split on import.
//   - Booleans serialize to TRUE/FALSE; "true"/"yes"/"1" parse back to true.
//   - Numbers stay numbers. Date strings stay strings (we keep ISO format).
//   - Column order is preferred-first, then any other keys, with user_id skipped.

const ARRAY_FIELDS = new Set(['tags']);
const BOOLEAN_FIELDS = new Set(['checked', 'done', 'recurring']);

function serializeValue(_key, value) {
  if (value == null) return '';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  if (typeof value === 'object') return JSON.stringify(value);
  return value;
}

function parseValue(key, raw) {
  if (raw == null || raw === '') {
    if (BOOLEAN_FIELDS.has(key)) return false;
    if (ARRAY_FIELDS.has(key)) return [];
    return undefined;
  }
  if (ARRAY_FIELDS.has(key)) {
    if (Array.isArray(raw)) return raw;
    return String(raw).split(/[,;]/).map((s) => s.trim()).filter(Boolean);
  }
  if (BOOLEAN_FIELDS.has(key)) {
    const s = String(raw).trim().toLowerCase();
    return s === 'true' || s === 'yes' || s === '1';
  }
  if (key === 'amount') {
    const n = Number(raw);
    return Number.isFinite(n) ? n : raw;
  }
  return raw;
}

/** Lazy-load SheetJS only when needed. */
async function loadXLSX() {
  const mod = await import('xlsx');
  return mod.default ?? mod;
}

/** Trigger a browser download of items as an .xlsx file. */
export async function exportToExcel(filenameBase, items) {
  const XLSX = await loadXLSX();
  const safeItems = Array.isArray(items) ? items : [];

  const seen = new Set();
  const cols = [];
  const preferred = ['id', 'created_at', 'date', 'name', 'title', 'category', 'priority', 'amount'];
  for (const k of preferred) {
    if (safeItems.some((it) => it && Object.prototype.hasOwnProperty.call(it, k))) {
      cols.push(k); seen.add(k);
    }
  }
  for (const it of safeItems) {
    if (!it) continue;
    for (const k of Object.keys(it)) {
      if (k === 'user_id') continue;
      if (!seen.has(k)) { cols.push(k); seen.add(k); }
    }
  }
  if (cols.length === 0) cols.push('(empty)');

  const rows = safeItems.map((it) => {
    const row = {};
    for (const c of cols) row[c] = serializeValue(c, it?.[c]);
    return row;
  });

  const ws = XLSX.utils.json_to_sheet(rows, { header: cols });
  ws['!cols'] = cols.map((c) => {
    const maxLen = Math.max(
      c.length,
      ...rows.map((r) => String(r[c] ?? '').length),
    );
    return { wch: Math.min(60, Math.max(8, maxLen + 2)) };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sanitizeSheetName(filenameBase));

  const stamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `life-manager-${filenameBase}-${stamp}.xlsx`);
}

/** Parse an uploaded File and return a normalized array of objects. */
export async function importFromExcel(file) {
  const XLSX = await loadXLSX();
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const firstSheet = wb.Sheets[wb.SheetNames[0]];
  if (!firstSheet) return [];
  const rows = XLSX.utils.sheet_to_json(firstSheet, { defval: '', raw: false });
  return rows.map((row) => {
    const out = {};
    for (const k of Object.keys(row)) {
      const key = String(k).trim();
      if (!key || key === '(empty)') continue;
      const v = parseValue(key, row[k]);
      if (v !== undefined) out[key] = v;
    }
    if (!out.id) out.id = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `row-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    if (!out.created_at) out.created_at = new Date().toISOString();
    return out;
  });
}

function sanitizeSheetName(s) {
  return String(s || 'data').replace(/[:\\/?*[\]]/g, '_').slice(0, 31);
}

// ── Multi-sheet (full backup) ────────────────────────────────────────────────
//
// `collections` is an array of { key, items } pairs. `key` is used as both the
// sheet name in the workbook and the dictionary key in the import result.

function buildSheet(XLSX, items) {
  const safeItems = Array.isArray(items) ? items : [];
  const seen = new Set();
  const cols = [];
  const preferred = ['id', 'created_at', 'date', 'name', 'title', 'category', 'priority', 'amount'];
  for (const k of preferred) {
    if (safeItems.some((it) => it && Object.prototype.hasOwnProperty.call(it, k))) {
      cols.push(k); seen.add(k);
    }
  }
  for (const it of safeItems) {
    if (!it) continue;
    for (const k of Object.keys(it)) {
      if (k === 'user_id') continue;
      if (!seen.has(k)) { cols.push(k); seen.add(k); }
    }
  }
  if (cols.length === 0) cols.push('(empty)');

  const rows = safeItems.map((it) => {
    const row = {};
    for (const c of cols) row[c] = serializeValue(c, it?.[c]);
    return row;
  });

  const ws = XLSX.utils.json_to_sheet(rows, { header: cols });
  ws['!cols'] = cols.map((c) => {
    const maxLen = Math.max(c.length, ...rows.map((r) => String(r[c] ?? '').length));
    return { wch: Math.min(60, Math.max(8, maxLen + 2)) };
  });
  return ws;
}

function parseSheet(XLSX, sheet) {
  if (!sheet) return [];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
  return rows.map((row) => {
    const out = {};
    for (const k of Object.keys(row)) {
      const key = String(k).trim();
      if (!key || key === '(empty)') continue;
      const v = parseValue(key, row[k]);
      if (v !== undefined) out[key] = v;
    }
    if (!out.id) out.id = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `row-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    if (!out.created_at) out.created_at = new Date().toISOString();
    return out;
  });
}

/**
 * One-click full backup. `collections` = [{ key: 'grocery', items: [...] }, ...]
 * Produces a single .xlsx where each collection is its own sheet.
 */
export async function exportAllToExcel(filenameBase, collections) {
  const XLSX = await loadXLSX();
  const wb = XLSX.utils.book_new();
  for (const { key, items } of collections) {
    const ws = buildSheet(XLSX, items);
    XLSX.utils.book_append_sheet(wb, ws, sanitizeSheetName(key));
  }
  const stamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `life-manager-${filenameBase}-${stamp}.xlsx`);
}

/**
 * Parse a multi-sheet workbook. Returns { sheetName: [rows] } for every sheet found.
 * Caller maps sheet names to collection keys.
 */
export async function importAllFromExcel(file) {
  const XLSX = await loadXLSX();
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const out = {};
  for (const name of wb.SheetNames) {
    out[name] = parseSheet(XLSX, wb.Sheets[name]);
  }
  return out;
}

