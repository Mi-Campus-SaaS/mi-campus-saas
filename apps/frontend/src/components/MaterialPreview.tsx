import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, Download, FileText, Image, AlertCircle, X } from 'lucide-react';
import { getMaterialPreviewBlob, getMaterialDownloadBlob } from '../api/materials';
import type { ClassMaterial } from '../api/materials';

interface MaterialPreviewProps {
  material: ClassMaterial;
  classId: string;
}

const MaterialPreview: React.FC<MaterialPreviewProps> = ({ material, classId }) => {
  const { t } = useTranslation();
  const [previewError, setPreviewError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isImage = material.mimeType?.startsWith('image/');
  const isPDF = material.mimeType === 'application/pdf';
  const canPreview = isImage || isPDF;

  const handlePreview = async () => {
    if (!canPreview) return;

    setIsLoading(true);
    setPreviewError(false);

    try {
      const blob = await getMaterialPreviewBlob(classId, material.id);
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');

      // Clean up the blob URL after a delay
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 60000); // 1 minute
    } catch {
      setPreviewError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const blob = await getMaterialDownloadBlob(classId, material.id);
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = material.originalName || material.title;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the blob URL
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 1000);
    } catch (error) {
      console.error('Download failed:', error);
      setPreviewError(true);
    }
  };

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = () => {
    if (isImage) {
      return <Image className="w-5 h-5 text-blue-500" />;
    }
    if (isPDF) {
      return <FileText className="w-5 h-5 text-red-500" />;
    }
    return <FileText className="w-5 h-5 text-gray-500" />;
  };

  return (
    <div className="card rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {getFileIcon()}
          <h3 className="font-medium text-gray-900 dark:text-gray-100">{material.title}</h3>
        </div>
        <div className="flex items-center gap-2">
          {canPreview && (
            <button
              onClick={handlePreview}
              disabled={isLoading}
              className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors disabled:opacity-50"
              title={t('preview')}
            >
              <Eye className="w-4 h-4" />
              {isLoading ? t('loading') : t('preview')}
            </button>
          )}
          <button
            onClick={handleDownload}
            className="flex items-center gap-1 px-3 py-1 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors"
            title={t('download')}
          >
            <Download className="w-4 h-4" />
            {t('download')}
          </button>
        </div>
      </div>

      {material.description && <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{material.description}</p>}

      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-4">
          <span>{material.originalName || material.filePath}</span>
          {material.size && <span>{formatFileSize(material.size)}</span>}
        </div>
        <div className="flex items-center gap-1">
          <Download className="w-3 h-3" />
          <span>{material.downloadCount}</span>
        </div>
      </div>

      {previewError && (
        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{t('preview_error')}</span>
            <button onClick={() => setPreviewError(false)} className="ml-auto" title={t('close')}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialPreview;
