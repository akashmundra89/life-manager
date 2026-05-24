import { useRef, useState } from 'react';
import { Download, Upload, AlertCircle, FileSpreadsheet, Merge, RefreshCcw } from 'lucide-react';
import { Button, Modal } from './ui';
import { exportToExcel, importFromExcel } from '../lib/excelBackup.js';

/**
 * Backup / restore controls for a single collection.
 *
 * Props:
 *   filenameBase — string used in the downloaded file name (e.g. "grocery")
 *   items        — current array of items (from useLocalCollection)
 *   onReplaceAll — function(newItems) to overwrite the collection
 *   onMerge      — optional function(newItems) to merge (de-dup by id). Defaults to replace + skip-existing.
 *   compact      — boolean, renders just the icon-only buttons (no label)
 */
export default function BackupMenu({ filenameBase, items, onReplaceAll, onMerge, compact = false }) {
  const fileRef = useRef(null);
  const [pending, setPending] = useState(null); // { rows, name }
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function pickFile() {
    setError('');
    fileRef.current?.click();
  }

  async function onFile(e) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-uploading the same file
    if (!file) return;
    setBusy(true);
    try {
      const rows = await importFromExcel(file);
      if (rows.length === 0) {
        setError('No rows found in that file.');
        return;
      }
      setPending({ rows, name: file.name });
    } catch (err) {
      setError(err?.message || 'Could not parse the file.');
    } finally {
      setBusy(false);
    }
  }

  function doReplace() {
    if (!pending) return;
    onReplaceAll?.(pending.rows);
    setPending(null);
  }

  function doMerge() {
    if (!pending) return;
    if (onMerge) {
      onMerge(pending.rows);
    } else {
      // Default merge: existing items first, then any new items whose ids aren't already present.
      const existingIds = new Set(items.map((it) => it.id));
      const additions = pending.rows.filter((r) => !existingIds.has(r.id));
      onReplaceAll?.([...items, ...additions]);
    }
    setPending(null);
  }

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={onFile}
      />
      <div className="inline-flex items-center gap-1">
        <Button
          variant="secondary"
          size="sm"
          iconOnly={compact}
          onClick={async () => {
            setError('');
            setBusy(true);
            try {
              await exportToExcel(filenameBase, items);
            } catch (err) {
              setError(err?.message || 'Export failed.');
            } finally {
              setBusy(false);
            }
          }}
          title={`Download ${items.length} item${items.length === 1 ? '' : 's'} as Excel`}
          disabled={items.length === 0 || busy}
        >
          <Download className="w-4 h-4" />
          {!compact && <span>Export</span>}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          iconOnly={compact}
          onClick={pickFile}
          disabled={busy}
          title="Restore from Excel backup"
        >
          <Upload className="w-4 h-4" />
          {!compact && <span>Import</span>}
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
        <Modal open={true} onClose={() => setPending(null)} title="Restore from Excel" size="md">
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-xl glass-soft">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-300 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-ink truncate">{pending.name}</div>
                <div className="text-xs text-ink-faint mt-0.5">
                  {pending.rows.length} row{pending.rows.length === 1 ? '' : 's'} ready to import · current list has {items.length}
                </div>
              </div>
            </div>
            <p className="text-sm text-ink-muted">
              Choose how to apply the backup:
            </p>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={doMerge}
                className="flex items-start gap-3 p-3 rounded-xl glass glass-hover hover:shadow-glass-soft text-left transition-all"
              >
                <Merge className="w-4 h-4 text-brand-600 dark:text-brand-300 mt-0.5 shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-ink">Merge</div>
                  <div className="text-xs text-ink-faint">Add new rows from the file (matched by id) — keeps your current items.</div>
                </div>
              </button>
              <button
                onClick={doReplace}
                className="flex items-start gap-3 p-3 rounded-xl glass glass-hover hover:shadow-glass-soft text-left transition-all"
              >
                <RefreshCcw className="w-4 h-4 text-rose-600 dark:text-rose-300 mt-0.5 shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-ink">Replace all</div>
                  <div className="text-xs text-ink-faint">Wipe the current list and load the file. Best for recovery.</div>
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
