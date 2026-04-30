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

/** Draws the crop area on a canvas and returns a base64 data URL.
 *  transparent=true → PNG, no bg fill, logo drawn at logoScale (0–1) centered with padding.
 *  transparent=false → JPEG, white fill, full canvas (avatars). */
function getCroppedDataUrl(
  image: HTMLImageElement,
  crop: Crop,
  transparent = false,
  logoScale = 1,
): string {
  const canvas  = document.createElement('canvas');
  const scaleX  = image.naturalWidth  / image.width;
  const scaleY  = image.naturalHeight / image.height;
  const size    = 400;

  canvas.width  = size;
  canvas.height = size;

  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingQuality = 'high';

  if (!transparent) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
  }

  const cropX = (crop.x  / 100) * image.width  * scaleX;
  const cropY = (crop.y  / 100) * image.height * scaleY;
  const cropW = (crop.width  / 100) * image.width  * scaleX;
  const cropH = (crop.height / 100) * image.height * scaleY;

  // logoScale < 1 → draws logo smaller, centred, leaving transparent padding around it
  const drawSize = size * logoScale;
  const offset   = (size - drawSize) / 2;
  ctx.drawImage(image, cropX, cropY, cropW, cropH, offset, offset, drawSize, drawSize);

  return transparent
    ? canvas.toDataURL('image/png')
    : canvas.toDataURL('image/jpeg', 0.9);
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface ImageCropModalProps {
  src: string;
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
  transparent?: boolean; // preserve alpha — use for logos; default false (JPEG + white bg for avatars)
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ImageCropModal({ src, onSave, onCancel, transparent = false }: ImageCropModalProps) {
  const imgRef                    = useRef<HTMLImageElement>(null);
  const [crop, setCrop]           = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const [selectedGradient, setSelectedGradient] = useState(0);
  const [logoScale, setLogoScale] = useState(0.8); // default 80% — gives natural padding for logos

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height));
  }, []);

  function handleSave() {
    if (!imgRef.current || !completedCrop) return;
    const dataUrl = getCroppedDataUrl(imgRef.current, completedCrop, transparent, transparent ? logoScale : 1);
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

        {/* Logo zoom slider — only shown for transparent/logo mode */}
        {transparent && (
          <div className="px-5 py-3 border-t border-gray-100">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-gray-600">Logo size</span>
              <span className="text-xs text-gray-400">{Math.round(logoScale * 100)}%</span>
            </div>
            <input
              type="range"
              min={0.4}
              max={1}
              step={0.05}
              value={logoScale}
              onChange={(e) => setLogoScale(parseFloat(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-[#7F56D9]"
            />
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-gray-400">Smaller</span>
              <span className="text-[10px] text-gray-400">Larger</span>
            </div>
          </div>
        )}

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
