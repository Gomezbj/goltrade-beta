
import React, { useState, useCallback, ChangeEvent, useEffect } from 'react';
import UploadIcon from './icons/UploadIcon';
import { useTranslations } from '../hooks/useTranslations';
import { ImageFileData } from '../types'; // Import ImageFileData

interface ImageUploaderProps {
  onImageUpload: (fileData: ImageFileData | null) => void;
  isLoading: boolean;
  title: string; // Title will be passed already translated
  inputId: string;
  initialImage?: ImageFileData | null; // New prop
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, isLoading, title, inputId, initialImage }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslations();

  useEffect(() => {
    if (initialImage) {
      const newPreview = `data:${initialImage.mimeType};base64,${initialImage.base64Image}`;
      // Only update if it's genuinely new or different to avoid potential issues
      // This also ensures that if a user uploads a file, then App.tsx re-renders with the same initialImage,
      // the user's selection isn't overwritten unless initialImage itself changes to something new.
      if (newPreview !== preview || initialImage.fileName !== fileName) {
        setPreview(newPreview);
        setFileName(initialImage.fileName);
        setError(null); // Clear any previous errors when initial image is set
      }
    } else {
      // If initialImage is null (e.g., after clearing inputs or loading history item without this image)
      // and the component isn't being reset by a key change, explicitly clear.
      // This is important if not relying solely on key-based reset for this scenario.
      if (preview !== null || fileName !== null) {
        setPreview(null);
        setFileName(null);
        setError(null);
      }
    }
  }, [initialImage]); // Only re-run when initialImage prop changes.

  const handleFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
        setError(t('imageUploaderErrorInvalidType'));
        setPreview(null);
        setFileName(null);
        onImageUpload(null);
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError(t('imageUploaderErrorTooLarge'));
        setPreview(null);
        setFileName(null);
        onImageUpload(null);
        return;
      }

      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setPreview(reader.result as string); // Update internal state
        setFileName(file.name); // Update internal state
        onImageUpload({ base64Image: base64String, mimeType: file.type, fileName: file.name }); // Notify App
      };
      reader.readAsDataURL(file);
    } else {
        setPreview(null);
        setFileName(null);
        setError(null);
        onImageUpload(null);
    }
  }, [onImageUpload, t]);

  const handleRemoveImage = () => {
    setPreview(null);
    setFileName(null);
    setError(null);
    onImageUpload(null); // Notify App
    const fileInput = document.getElementById(inputId) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  return (
    <div className="w-full bg-secondary-800 rounded-xl shadow-xl p-4 space-y-3">
      <h3 className="text-lg font-semibold text-primary-300 mb-2">{title}</h3>
      <label
        htmlFor={inputId}
        className="relative cursor-pointer group block w-full h-48 sm:h-64 border-2 border-dashed border-secondary-600 hover:border-primary-500 rounded-lg flex flex-col justify-center items-center transition-colors duration-200"
      >
        {preview ? (
          <img src={preview} alt={`${title} Preview`} className="max-h-full max-w-full object-contain rounded-md" />
        ) : (
          <div className="text-center">
            <UploadIcon className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-secondary-500 group-hover:text-primary-400 transition-colors" />
            <p className="mt-2 text-xs sm:text-sm text-secondary-400 group-hover:text-primary-300">
              <span className="font-semibold">{t('imageUploaderClickToUpload')}</span> {t('imageUploaderDragAndDrop')}
            </p>
            <p className="text-xs text-secondary-500">{t('imageUploaderFormatHint')}</p>
          </div>
        )}
        <input id={inputId} name={inputId} type="file" className="sr-only" onChange={handleFileChange} accept="image/png, image/jpeg, image/webp, image/gif" disabled={isLoading} />
      </label>
      
      {fileName && !error && (
        <div className="text-xs sm:text-sm text-secondary-300 text-center flex justify-between items-center">
          <span className="truncate pr-2">{fileName}</span>
          <button 
            onClick={handleRemoveImage} 
            className="text-red-400 hover:text-red-300 text-xs p-1 flex-shrink-0"
            aria-label={`${t('removeButtonLabel')} ${title} - ${fileName}`}
            disabled={isLoading}
          >
            {t('removeButtonLabel')}
          </button>
        </div>
      )}
      
      {error && (
        <div className="mt-1 text-xs sm:text-sm text-red-400 bg-red-900/30 p-2 rounded-md text-center">
          {error}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;