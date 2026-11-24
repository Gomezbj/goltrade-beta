import React, { useState, useCallback, ChangeEvent, useEffect, useRef } from 'react';
import UploadIcon from './icons/UploadIcon';
import { useTranslations } from '../hooks/useTranslations';
import { ImageFileData } from '../types'; // Import ImageFileData

interface ImageUploaderProps {
  onImageUpload: (fileData: ImageFileData | null) => void;
  isLoading: boolean;
  title: string; // Title will be passed already translated
  inputId: string;
  initialImage?: ImageFileData | null;
  topContent?: React.ReactNode; // New prop for content at the top
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, isLoading, title, inputId, initialImage, topContent }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { t } = useTranslations();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialImage) {
      const newPreview = `data:${initialImage.mimeType};base64,${initialImage.base64Image}`;
      if (newPreview !== preview || initialImage.fileName !== fileName) {
        setPreview(newPreview);
        setFileName(initialImage.fileName);
        setError(null);
      }
    } else {
      if (preview !== null || fileName !== null) {
        setPreview(null);
        setFileName(null);
        setError(null);
      }
    }
  }, [initialImage, preview, fileName]);

  const processFile = useCallback((file: File) => {
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
      const uploadedFileName = file.name || `pasted-image-${Date.now()}.${file.type.split('/')[1]}`;
      setPreview(reader.result as string);
      setFileName(uploadedFileName);
      onImageUpload({ base64Image: base64String, mimeType: file.type, fileName: uploadedFileName });
    };
    reader.readAsDataURL(file);
  }, [onImageUpload, t]);

  const handleFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    } else {
        setPreview(null);
        setFileName(null);
        setError(null);
        onImageUpload(null);
    }
  }, [processFile]);

  const handlePaste = useCallback((event: React.ClipboardEvent<HTMLDivElement>) => {
    if (isLoading) return;
    const items = event.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        event.preventDefault();
        const file = item.getAsFile();
        if (file) {
          processFile(file);
        }
        return; // Handle first image file
      }
    }
  }, [processFile, isLoading]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (isLoading) return;
    setIsDragging(true);
  }, [isLoading]);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (isLoading) return;
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile, isLoading]);
  
  const handleDoubleClick = () => {
    if (!isLoading) {
      fileInputRef.current?.click();
    }
  };

  const handleRemoveImage = () => {
    setPreview(null);
    setFileName(null);
    setError(null);
    onImageUpload(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploaderClasses = `relative cursor-pointer group block w-full h-48 sm:h-64 border-2 border-dashed rounded-lg flex flex-col justify-center items-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-secondary-800 focus:ring-primary-500 ${
    isDragging ? 'border-primary-500 bg-secondary-700/50' : 'border-secondary-600 hover:border-primary-500'
  }`;

  return (
    <div className="w-full bg-secondary-800 rounded-xl shadow-xl p-4 space-y-3">
      <h3 className="text-lg font-semibold text-primary-300 mb-2">{title}</h3>
      {topContent} {/* Render injected top content here */}
      <div
        onDoubleClick={handleDoubleClick}
        onPaste={handlePaste}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        tabIndex={0}
        role="button"
        aria-label={`${title}, ${t('imageUploaderDoubleClickToUpload')}${t('imageUploaderPasteOrDrag')}`}
        className={uploaderClasses}
      >
        {preview ? (
          <img src={preview} alt={`${title} Preview`} className="max-h-full max-w-full object-contain rounded-md" />
        ) : (
          <div className="text-center">
            <UploadIcon className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-secondary-500 group-hover:text-primary-400 transition-colors" />
            <p className="mt-2 text-xs sm:text-sm text-secondary-400 group-hover:text-primary-300">
              <span className="font-semibold">{t('imageUploaderDoubleClickToUpload')}</span>{t('imageUploaderPasteOrDrag')}
            </p>
            <p className="text-xs text-secondary-500">{t('imageUploaderFormatHint')}</p>
          </div>
        )}
        <input ref={fileInputRef} id={inputId} name={inputId} type="file" className="sr-only" onChange={handleFileChange} accept="image/png, image/jpeg, image/webp, image/gif" disabled={isLoading} />
      </div>
      
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
