import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ImageRef } from '../types';
import { fileToCompressedDataUrl } from '../utils/image';
import { newId } from '../utils/id';

interface Props {
  images: ImageRef[];
  onChange: (images: ImageRef[]) => void;
}

export default function ImagesEditor({ images, onChange }: Props) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      const newImages: ImageRef[] = [];
      for (const file of Array.from(files)) {
        const dataUrl = await fileToCompressedDataUrl(file);
        newImages.push({ id: newId('img'), dataUrl, caption: '', isMain: false });
      }
      const combined = [...images, ...newImages];
      if (!combined.some((img) => img.isMain) && combined.length > 0) {
        combined[0].isMain = true;
      }
      onChange(combined);
    } catch {
      alert(t('errors.imageLoadFailed'));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function updateCaption(id: string, caption: string) {
    onChange(images.map((img) => (img.id === id ? { ...img, caption } : img)));
  }

  function setMain(id: string) {
    onChange(images.map((img) => ({ ...img, isMain: img.id === id })));
  }

  function remove(id: string) {
    const filtered = images.filter((img) => img.id !== id);
    if (filtered.length > 0 && !filtered.some((img) => img.isMain)) {
      filtered[0].isMain = true;
    }
    onChange(filtered);
  }

  return (
    <div>
      {images.length > 0 && (
        <div className="image-grid">
          {images.map((img) => (
            <div key={img.id} className={`image-card${img.isMain ? ' is-main' : ''}`}>
              <img src={img.dataUrl} alt={img.caption || t('images.altFallback')} />
              <input
                type="text"
                placeholder={t('images.captionPlaceholder')}
                value={img.caption}
                onChange={(e) => updateCaption(img.id, e.target.value)}
              />
              <div className="image-card-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setMain(img.id)} disabled={img.isMain}>
                  {img.isMain ? t('images.mainLabel') : t('images.setMainButton')}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => remove(img.id)}>
                  {t('common.delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleFiles(e.target.files)}
        style={{ display: 'none' }}
      />
      <button type="button" className="btn" onClick={() => inputRef.current?.click()} disabled={busy}>
        {busy ? t('common.loading') : t('images.addButton')}
      </button>
    </div>
  );
}
