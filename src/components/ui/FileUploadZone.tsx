import { useState, useRef } from 'react';
import { UploadCloud01, Trash01 } from '@untitled-ui/icons-react';

export interface UploadedFile {
  file: File;
  preview: string | null;
}

interface FileUploadZoneProps {
  files: UploadedFile[];
  onAdd: (file: File) => void;
  onRemove: (index: number) => void;
  accept?: string;
  hint?: string;
  label?: string;
}

export default function FileUploadZone({
  files,
  onAdd,
  onRemove,
  accept = 'image/svg+xml,image/png,image/jpeg,image/gif',
  hint = 'SVG, PNG, JPG or GIF (max. 800×400px)',
  label,
}: FileUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleFiles(list: FileList | null) {
    if (!list) return;
    Array.from(list).forEach((f) => onAdd(f));
  }

  return (
    <div className="flex flex-col gap-3">
      {label && (
        <label className="block text-sm font-medium text-[#344054]">{label}</label>
      )}

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl px-6 py-8 cursor-pointer transition-colors select-none ${
          dragging
            ? 'border-[#7F56D9] bg-[#F4F3FF]'
            : 'border-[#D5D7DA] bg-white hover:border-[#7F56D9] hover:bg-[#F9F5FF]'
        }`}
      >
        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-[#E9EAEB] bg-white shadow-sm">
          <UploadCloud01 width={20} height={20} className="text-[#535862]" />
        </div>
        <div className="text-center">
          <p className="text-sm text-[#535862]">
            <span className="font-semibold text-[#6941C6]">Click to upload</span>{' '}
            or drag and drop
          </p>
          <p className="text-xs text-[#A4A7AE] mt-0.5">{hint}</p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="flex flex-col gap-2">
          {files.map(({ file, preview }, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 p-3 border border-[#E9EAEB] rounded-lg bg-white"
            >
              {preview ? (
                <img
                  src={preview}
                  alt={file.name}
                  className="w-10 h-10 rounded-lg object-cover shrink-0 border border-[#E9EAEB]"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-[#F2F4F7] flex items-center justify-center shrink-0">
                  <UploadCloud01 width={16} height={16} className="text-[#717680]" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#344054] truncate">{file.name}</p>
                <p className="text-xs text-[#717680]">{(file.size / 1024).toFixed(0)} KB</p>
              </div>
              <button
                type="button"
                onClick={() => onRemove(idx)}
                className="shrink-0 text-[#717680] hover:text-[#D92D20] transition-colors p-1 rounded"
              >
                <Trash01 width={14} height={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        className="hidden"
        onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
      />
    </div>
  );
}

export function createUploadedFile(file: File): UploadedFile {
  return {
    file,
    preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
  };
}

export function revokeUploadedFiles(files: UploadedFile[]) {
  files.forEach((f) => { if (f.preview) URL.revokeObjectURL(f.preview); });
}
