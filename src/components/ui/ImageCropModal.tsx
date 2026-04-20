import React, { useState, useRef, useCallback } from 'react';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { X, Crop01 } from '@untitled-ui/icons-react';
import Button from './Button';

// ── Gradient palette (matches Figma colour swatches) ─────────────────────────

const GRADIENTS = [
  'linear-gradient(135deg,#F472B6,#A855F7)',
  'linear-gradient(135deg,#60A5FA,#818CF8)',
  'linear-gradient(135deg,#34D399,#60A5FA)',
  'linear-gradient(135deg,#FBBF24,#F87171)',
  'linear-gradient(135deg,#F472B6,#FB923C)',
  'linear-gradient(135deg,#A78BFA,#38BDF8)',
  'linear-gradient(135deg,#4ADE80,#22D3EE)',
  'linear-gradient(135deg,#FCD34D,#FB923C)',
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function centerAspectCrop(w: number, h: number): Crop {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 80 }, 1, w, h),
    w, h,
  );
}

/** Draws the crop area on a canvas and returns a base64 data URL. */
function getCroppedDataUrl(
  image: HTMLImageElement,
  crop: Crop,
): string {
  const canvas  = document.createElement('canvas');
  const scaleX  = image.naturalWidth  / image.width;
  const scaleY  = image.naturalHeight / image.height;
  const size    = 400; // output at 400×400

  canvas.width  = size;
  canvas.height = size;

  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingQuality = 'high';

  const cropX = (crop.x  / 100) * image.width  * scaleX;
  const cropY = (crop.y  / 100) * image.height * scaleY;
  const cropW = (crop.width  / 100) * image.width  * scaleX;
  const cropH = (crop.height / 100) * image.height * scaleY;

  ctx.drawImage(image, cropX, cropY, cropW, cropH, 0, 0, size, size);
  return canvas.toDataURL('image/jpeg', 0.9);
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface ImageCropModalProps {
  src: string;                         // object URL of selected file
  onSave: (dataUrl: string) => void;   // cropped JPEG data URL
  onCancel: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ImageCropModal({ src, onSave, onCancel }: ImageCropModalProps) {
  const imgRef                    = useRef<HTMLImageElement>(null);
  const [crop, setCrop]           = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const [selectedGradient, setSelectedGradient] = useState(0);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height));
  }, []);

  function handleSave() {
    if (!imgRef.current || !completedCrop) return;
    const dataUrl = getCroppedDataUrl(imgRef.current, completedCrop);
    onSave(dataUrl);
  }

  return (
    /* Backdrop */
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-1">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg border border-gray-200 shadow-sm flex items-center justify-center shrink-0">
              <Crop01 width={16} height={16} className="text-gray-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Crop image</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Upload a 800 × 800px image for best results.
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors mt-0.5"
          >
            <X width={18} height={18} />
          </button>
        </div>

        {/* Crop area */}
        <div className="px-4 py-3 bg-gray-50">
          <ReactCrop
            crop={crop}
            onChange={(_, pct) => setCrop(pct)}
            onComplete={(_, pct) => setCompletedCrop(pct)}
            aspect={1}
            circularCrop={false}
            className="max-h-96 w-full"
          >
            <img
              ref={imgRef}
              src={src}
              alt="Crop preview"
              onLoad={onImageLoad}
              className="max-h-96 w-full object-contain"
            />
          </ReactCrop>
        </div>

        {/* Gradient palette */}
        <div className="flex items-center gap-2 px-5 py-3 overflow-x-auto">
          {GRADIENTS.map((g, i) => (
            <button
              key={i}
              onClick={() => setSelectedGradient(i)}
              style={{ background: g }}
              className={`
                w-7 h-7 rounded-full shrink-0 transition-all
                ${selectedGradient === i
                  ? 'ring-2 ring-offset-2 ring-brand-500 scale-110'
                  : 'opacity-80 hover:opacity-100'
                }
              `}
            />
          ))}
          <button className="w-7 h-7 rounded-full shrink-0 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-brand-400 hover:text-brand-500 text-lg leading-none">
            +
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-5 pb-5">
          <Button
            variant="secondary"
            className="flex-1 justify-center"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 justify-center"
            onClick={handleSave}
            disabled={!completedCrop}
          >
            Save changes
          </Button>
        </div>
      </div>
    </div>
  );
}
