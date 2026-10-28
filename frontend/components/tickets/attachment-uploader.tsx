'use client';

import { useRef, useState } from 'react';
import api from '@/lib/api';

interface Attachment {
  id: string;
  nombre: string;
  url: string;
  tipo: string;
  tamanio: number;
}

interface Props {
  ticketId: string;
  attachments: Attachment[];
  onUploaded: (attachment: Attachment) => void;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(tipo: string) {
  if (tipo.startsWith('image/')) return '🖼️';
  if (tipo === 'application/pdf') return '📄';
  if (tipo.includes('word')) return '📝';
  if (tipo.includes('excel') || tipo.includes('spreadsheet')) return '📊';
  return '📎';
}

export function AttachmentUploader({ ticketId, attachments, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleFile(file: File) {
    setError('');
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await api.post(`/tickets/${ticketId}/attachments`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onUploaded(res.data);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Error al subir el archivo.');
    } finally {
      setUploading(false);
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-700 mb-2">Archivos adjuntos</h3>

      {attachments.length > 0 && (
        <ul className="space-y-1 mb-3">
          {attachments.map((a) => (
            <li key={a.id} className="flex items-center gap-2 text-sm">
              <span>{fileIcon(a.tipo)}</span>
              <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate max-w-[180px]">
                {a.nombre}
              </a>
              <span className="text-slate-400 text-xs">{formatSize(a.tamanio)}</span>
            </li>
          ))}
        </ul>
      )}

      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition"
      >
        {uploading ? (
          <p className="text-sm text-slate-500">Subiendo...</p>
        ) : (
          <p className="text-sm text-slate-400">Arrastrá un archivo o hacé clic aquí<br /><span className="text-xs">PDF, imágenes, Word, Excel · máx. 5 MB</span></p>
        )}
      </div>

      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}

      <input ref={inputRef} type="file" className="hidden" onChange={onInputChange}
        accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx,.txt" />
    </div>
  );
}
