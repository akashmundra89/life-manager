import { useRef, useState } from 'react';
import {
  Download, Upload, AlertCircle, FileSpreadsheet, Merge, RefreshCcw, Database,
} from 'lucide-react';
import { Button, Modal } from './ui';
import { exportAllToExcel, importAllFromExcel } from '../lib/excelBackup.js';

/**
 * Full-app backup — one .xlsx, one sheet per collection.
 *
 * Props:
 *   collections — array of { key, label, items, replaceAll }
 *                 `key`  → sheet name in the workbook (also matched on import)
 *                 `label` → human label for the preview modal
 *                 `items` / `replaceAll` → current data + setter for that collection
 */
export default function BackupAllMenu({ collections }) {
  const fileRef = useRef(null);
  const [pending, setPending] = useState(null); // { byKey: { key: rows[] }, name }
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const totalItems = collections.reduce((s, c) => s + (c.items?.length ?? 0), 0);

  async function doExport() {
    setError('');
    setBusy(true);
    try {
      await exportAllToExcel('backup', collections.map((c) => ({ key: c.key, items: c.items })));
    } catch (err) {
      setError(err?.message || 'Export failed.');
    } finally {
      setBusy(false);
    }
  }

  function pickFile() {
    setError('');
    fileRef.current?.click();
  }

  async function onFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      const sheets = await importAllFromExcel(file);
      // Map sheet names → known collection keys (case-insensitive match).
      const byKey = {};
      let matched = 0;
      for (const c of collections) {
        const lower = c.key.toLowerCase();
        const matchKey = Object.keys(sheets).find((s) => s.toLowerCase() === lower);
        if (matchKey) {
          byKey[c.key] = sheets[matchKey];
          matched += sheets[matchKey].length;
        }
      }
      if (matched === 0) {
        setError('No matching sheets found. Expected sheet names: ' + collections.map((c) => c.key).join(', '));
        return;
      }
      setPending({ byKey, name: file.name, sheets });
    } catch (err) {
      setError(err?.message || 'Could not parse the file.');
    } finally {
      setBusy(false);
    }
  }

  function applyMerge() {
    if (!pending) return;
    for (const c of collections) {
      const incoming = pending.byKey[c.key];
      if (!incoming) continue;
      const existingIds = new Set(c.items.map((it) => it.id));
      const additions = incoming.filter((r) => !existingIds.has(r.id));
      c.replaceAll([...c.items, ...additions]);
    }
    setPending(null);
  }

  function applyReplace() {
    if (!pending) return;
    for (const c of collections) {
      const incoming = pending.byKey[c.key];
      if (incoming) c.replaceAll(incoming);
    }
    setPending(null);
  }

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={onFile}
      />

      <div className="flex flex-wrap gap-2">
        <Button
          variant="primary"
          size="md"
          onClick={doExport}
          disabled={busy || totalItems === 0}
          title={`Download a single Excel with ${totalItems} item${totalItems === 1 ? '' : 's'} across ${collections.length} tabs`}
        >
          <Download className="w-4 h-4" />
          Export all
        </Button>
        <Button
          variant="secondary"
          size="md"
          onClick={pickFile}
          disabled={busy}
          title="Restore the whole app from a single Excel backup"
        >
          <Upload className="w-4 h-4" />
          Import all
        </Button>
      </div>

      {error && (
        <Modal open={true} onClose={() => setError('')} title="Couldn't import">
          <div className="flex items-start gap-3 text-sm text-ink-muted">
            <AlertCircle className="w-4 h-4 mt-0.5 text-rose-500 shrink-0" />
            <div>{error}</div>
          </div>
          <div className="mt-5 flex justify-end">
            <Button variant="secondary" onClick={() => setError('')}>Close</Button>
          </div>
        </Modal>
      )}

      {pending && (
        <Modal open={true} onClose={() => setPending(null)} title="Restore full backup" size="lg">
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-xl glass-soft">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-300 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-ink truncate">{pending.name}</div>
                <div className="text-xs text-ink-faint mt-0.5">
                  {Object.values(pending.byKey).reduce((s, r) => s + r.length, 0)} rows · matched {Object.keys(pending.byKey).length} of {collections.length} sheets
                </div>
              </div>
            </div>

            <div className="rounded-xl glass-soft divide-y divide-edge/5">
              {collections.map((c) => {
                const incoming = pending.byKey[c.key];
                const has = !!incoming;
                return (
                  <div key={c.key} className="flex items-center gap-3 px-3 py-2 text-sm">
                    <Database className="w-3.5 h-3.5 text-ink-faint shrink-0" />
                    <span className="font-medium text-ink flex-1 truncate">{c.label}</span>
                    <span className="text-xs text-ink-faint">
                      current <span className="font-semibold text-ink">{c.items.length}</span>
                    </span>
                    <span className="text-ink-faint">→</span>
                    <span className="text-xs">
                      {has ? (
                        <span className="text-emerald-600 dark:text-emerald-300 font-semibold">{incoming.length} in backup</span>
                      ) : (
                        <span className="text-ink-faint">— not in file</span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>

            <p className="text-sm text-ink-muted">How should the backup be applied?</p>

            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={applyMerge}
                className="flex items-start gap-3 p-3 rounded-xl glass glass-hover hover:shadow-glass-soft text-left transition-all"
              >
                <Merge className="w-4 h-4 text-brand-600 dark:text-brand-300 mt-0.5 shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-ink">Merge into current data</div>
                  <div className="text-xs text-ink-faint">Add backup rows whose id isn't already present. Safe — nothing is removed.</div>
                </div>
              </button>
              <button
                onClick={applyReplace}
                className="flex items-start gap-3 p-3 rounded-xl glass glass-hover hover:shadow-glass-soft text-left transition-all"
              >
                <RefreshCcw className="w-4 h-4 text-rose-600 dark:text-rose-300 mt-0.5 shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-ink">Replace all (per matched sheet)</div>
                  <div className="text-xs text-ink-faint">Wipe each matched collection and reload from the backup. Collections not in the file are untouched.</div>
                </div>
              </button>
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <Button variant="ghost" onClick={() => setPending(null)}>Cancel</Button>
          </div>
        </Modal>
      )}
    </>
  );
}
