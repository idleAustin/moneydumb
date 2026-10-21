'use client';

import { useState, useRef } from 'react';
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
              <span>Importing…</span>
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
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0, fontSize: '1rem', color: 'var(--as-text-primary)' }}>
              {result.created > 0 ? (
                <CheckCircle2 size={18} strokeWidth={2.0} style={{ color: 'var(--as-status-success)' }} aria-hidden="true" focusable="false" />
              ) : (
                <AlertTriangle size={18} strokeWidth={2.0} style={{ color: 'var(--as-status-warning)' }} aria-hidden="true" focusable="false" />
              )}
              <span>{result.created > 0 ? 'Import Complete' : 'Import Result'}</span>
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 16, marginTop: 16 }}>
              <div className="stat-card" style={{ flex: 1, padding: '12px 16px' }}>
                <div className="stat-label">Rows Found</div>
                <div className="stat-value" style={{ fontSize: '1.4rem' }}>
                  {result.total}
                </div>
              </div>
              <div className="stat-card stat-green" style={{ flex: 1, padding: '12px 16px' }}>
                <div className="stat-label">Created</div>
                <div className="stat-value" style={{ fontSize: '1.4rem' }}>
                  {result.created}
                </div>
              </div>
              {result.errors.length > 0 && (
                <div className="stat-card stat-red" style={{ flex: 1, padding: '12px 16px' }}>
                  <div className="stat-label">Errors</div>
                  <div className="stat-value" style={{ fontSize: '1.4rem' }}>
                    {result.errors.length}
                  </div>
                </div>
              )}
            </div>
            {result.errors.length > 0 && (
              <div
                style={{
                  maxHeight: 160,
                  overflowY: 'auto',
                  fontSize: '0.78rem',
                  background: 'var(--as-bg-elevated)',
                  border: '1px solid var(--as-border-subtle)',
                  borderRadius: 'var(--as-radius-md)',
                  padding: 12,
                  color: 'var(--as-status-error)',
                  marginBottom: 12,
                }}
              >
                {result.errors.map((err, i) => (
                  <div key={i}>• {err}</div>
                ))}
              </div>
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
