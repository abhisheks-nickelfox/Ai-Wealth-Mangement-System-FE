import React, { useRef, useState } from 'react';
import { UploadCloud01 } from '@untitled-ui/icons-react';

interface FileUploadProps {
  accept?: string;
  maxSizeMB?: number;
  onFile: (file: File) => void;
  error?: string;
}

export default function FileUpload({
  accept = 'image/svg+xml,image/png,image/jpeg,image/gif',
  maxSizeMB = 2,
  onFile,
  error,
}: FileUploadProps) {
  const inputRef  = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [sizeError, setSizeError] = useState('');

  const displayError = error || sizeError;

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;

    if (file.size > maxSizeMB * 1024 * 1024) {
      setSizeError(`File must be under ${maxSizeMB} MB`);
      return;
    }
    setSizeError('');
    onFile(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`
          flex flex-col items-center justify-center gap-3
          border-2 border-dashed rounded-xl px-6 py-10 cursor-pointer
          transition-colors select-none
          ${dragging
            ? 'border-brand-400 bg-brand-50'
            : displayError
            ? 'border-error-300 bg-error-50'
            : 'border-gray-200 bg-white hover:border-brand-300 hover:bg-brand-50'
          }
        `}
      >
        {/* Upload icon */}
        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-200 bg-white shadow-sm">
          <UploadCloud01 width={20} height={20} className="text-gray-600" />
        </div>

        {/* Labels */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-brand-600">Click to upload</span>{' '}
            or drag and drop
          </p>
          <p className="text-xs text-gray-400 mt-1">
            SVG, PNG, JPG or GIF (max. 800×800px)
          </p>
        </div>
      </div>

      {displayError && (
        <p className="text-xs text-error-600">{displayError}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
