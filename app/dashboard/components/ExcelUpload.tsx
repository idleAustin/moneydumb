'use client';

import { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Download, Upload, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

interface TemplateColumn {
  header: string;
  example: string | number;
}

interface ImportResult {
  created: number;
  errors: string[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ExcelRow = Record<string, any>;

interface ExcelUploadProps {
  templateColumns: TemplateColumn[];
  templateName: string;
  onImport: (rows: ExcelRow[]) => Promise<ImportResult> | ImportResult;
  onComplete?: () => void;
}

export default function ExcelUpload({
  templateColumns,
  templateName,
  onImport,
  onComplete,
}: ExcelUploadProps) {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    total: number;
    created: number;
    errors: string[];
  } | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!result) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setResult(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [result]);

  /* ---- Download template ---- */
  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const headers = templateColumns.map((c) => c.header);
    const example = templateColumns.map((c) => c.example ?? '');
    const ws = XLSX.utils.aoa_to_sheet([headers, example]);

    // Auto-size columns
    ws['!cols'] = headers.map((h) => ({ wch: Math.max(h.length + 4, 16) }));

    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, templateName);
  };

  /* ---- Upload & parse ---- */
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setResult(null);

    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<ExcelRow>(ws, { defval: '' });

      if (rows.length === 0) {
        setResult({
          total: 0,
          created: 0,
          errors: ['No data rows found in the file.'],
        });
        setImporting(false);
        return;
      }

      const { created, errors } = await onImport(rows);
      setResult({ total: rows.length, created, errors });
      if (onComplete) onComplete();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setResult({
        total: 0,
        created: 0,
        errors: [`Failed to read file: ${message}`],
      });
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <>
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          type="button"
          className="btn btn-secondary btn-small"
          onClick={downloadTemplate}
          aria-label="Download Excel template"
          title="Download Excel template"
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Download size={14} strokeWidth={2.0} aria-hidden="true" focusable="false" />
            <span>Template</span>
          </span>
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-small"
          onClick={() => fileRef.current?.click()}
          disabled={importing}
          aria-label={importing ? 'Importing Excel file' : 'Upload filled Excel file'}
          title="Upload filled Excel file"
        >
          {importing ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Loader2 size={14} strokeWidth={2.0} className="animate-spin" aria-hidden="true" focusable="false" />
              <span>Importing...</span>
            </span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Upload size={14} strokeWidth={2.0} aria-hidden="true" focusable="false" />
              <span>Upload</span>
            </span>
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          style={{ display: 'none' }}
          onChange={handleFile}
          aria-label="Upload spreadsheet file"
        />
      </div>

      {/* Result modal */}
      {result && (
        <div className="modal-overlay" onClick={() => setResult(null)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="excel-import-modal-title"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 440 }}
          >
            <h3
              id="excel-import-modal-title"
              style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0, fontSize: '1rem', color: 'var(--as-text-primary)' }}
            >
              {result.created > 0 ? (
                <CheckCircle2 size={18} strokeWidth={2.0} style={{ color: 'var(--as-status-success)' }} aria-hidden="true" focusable="false" />
              ) : (
                <AlertTriangle size={18} strokeWidth={2.0} style={{ color: 'var(--as-status-warning)' }} aria-hidden="true" focusable="false" />
              )}
              <span>{result.created > 0 ? 'Import Complete' : 'Import Result'}</span>
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${result.errors.length > 0 ? 3 : 2}, minmax(0, 1fr))`,
                background: 'var(--as-bg-base)',
                border: '1px solid var(--as-border-subtle)',
                borderRadius: 'var(--as-radius-md)',
                marginTop: 16,
                marginBottom: 16,
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '12px 14px', borderRight: '1px solid var(--as-border-subtle)' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--as-text-secondary)' }}>Rows Found</div>
                <div style={{ fontFamily: 'var(--as-font-mono)', fontVariantNumeric: 'tabular-nums', fontSize: '1.35rem', fontWeight: 700, color: 'var(--as-text-primary)', marginTop: 4 }}>
                  {result.total}
                </div>
              </div>
              <div style={{ padding: '12px 14px', borderRight: result.errors.length > 0 ? '1px solid var(--as-border-subtle)' : 'none' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--as-text-secondary)' }}>Created</div>
                <div style={{ fontFamily: 'var(--as-font-mono)', fontVariantNumeric: 'tabular-nums', fontSize: '1.35rem', fontWeight: 700, color: 'var(--as-status-success)', marginTop: 4 }}>
                  {result.created}
                </div>
              </div>
              {result.errors.length > 0 && (
                <div style={{ padding: '12px 14px' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--as-text-secondary)' }}>Errors</div>
                  <div style={{ fontFamily: 'var(--as-font-mono)', fontVariantNumeric: 'tabular-nums', fontSize: '1.35rem', fontWeight: 700, color: 'var(--as-status-error)', marginTop: 4 }}>
                    {result.errors.length}
                  </div>
                </div>
              )}
            </div>
            {result.errors.length > 0 && (
              <ul
                style={{
                  listStyle: 'none',
                  maxHeight: 160,
                  overflowY: 'auto',
                  fontSize: '0.78rem',
                  background: 'var(--as-bg-base)',
                  border: '1px solid color-mix(in srgb, var(--as-status-error) 45%, transparent)',
                  borderRadius: 'var(--as-radius-md)',
                  padding: '10px 14px',
                  color: 'var(--as-status-error)',
                  marginBottom: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                {result.errors.map((err, i) => (
                  <li key={i} style={{ lineHeight: 1.4 }}>{err}</li>
                ))}
              </ul>
            )}
            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setResult(null)}
                aria-label="Dismiss import results"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
