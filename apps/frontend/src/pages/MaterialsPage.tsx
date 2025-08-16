import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@tanstack/react-query';
import { listClassMaterials, uploadClassMaterial, type ClassMaterial, type PaginatedResponse } from '../api/materials';
import { queryClient } from '../queryClient';
import { useAuth } from '../auth/useAuth';
import { uploadMaterialSchema } from '../validation/schemas';
import { FileText } from 'lucide-react';
import styles from './MaterialsPage.module.css';

const MaterialsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { classId = '' } = useParams();

  const { data, refetch, isError } = useQuery({
    queryKey: ['materials', 'class', classId],
    queryFn: () => listClassMaterials(classId),
    enabled: Boolean(classId),
  });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<{ title?: string; description?: string; file?: string }>({});

  const canUpload = useMemo(() => Boolean(title.trim() && file), [title, file]);

  const uploadMut = useMutation({
    mutationFn: (vars: { title: string; description?: string; file: File }) => uploadClassMaterial(classId, vars),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['materials', 'class', classId] }),
  });

  // Handle both array and paginated response formats
  const materials = useMemo(() => {
    if (!data) return [];
    // If data is an array, use it directly
    if (Array.isArray(data)) return data;
    // If data has a data property (paginated response), use that
    if (data && typeof data === 'object' && 'data' in data) {
      const paginatedData = data as PaginatedResponse<ClassMaterial>;
      return paginatedData.data || [];
    }
    return [];
  }, [data]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <FileText className={`w-6 h-6 ${styles.icon}`} />
        <h1 className={`text-xl font-semibold ${styles.title}`}>{t('materials')}</h1>
      </div>

      {user && (user.role === 'admin' || user.role === 'teacher') && (
        <div className="card rounded-lg shadow-sm p-4">
          <form
            className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end"
            onSubmit={(e) => {
              e.preventDefault();
              const parsed = uploadMaterialSchema.safeParse({ title, description: description || undefined, file });
              if (!parsed.success) {
                const errs: { title?: string; description?: string; file?: string } = {};
                for (const issue of parsed.error.issues) {
                  if (issue.path[0] === 'title') errs.title = t(issue.message);
                  if (issue.path[0] === 'description') errs.description = t(issue.message);
                  if (issue.path[0] === 'file') errs.file = t(issue.message);
                }
                setErrors(errs);
                return;
              }
              setErrors({});
              if (!file) return;
              uploadMut.mutate({ title: title.trim(), description: description || undefined, file });
              setTitle('');
              setDescription('');
              setFile(null);
            }}
          >
            <div>
              <label className={`block text-sm mb-1 ${styles.label}`}>{t('title')}</label>
              <input
                className={`border rounded p-2 w-full ${styles.input}`}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('title')}
                aria-label={t('title')}
                required
              />
              {errors.title && <div className="text-xs text-red-600 dark:text-red-400">{errors.title}</div>}
            </div>
            <div>
              <label className={`block text-sm mb-1 ${styles.label}`}>{t('description')}</label>
              <input
                className={`border rounded p-2 w-full ${styles.input}`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('description')}
                aria-label={t('description')}
              />
              {errors.description && <div className="text-xs text-red-600 dark:text-red-400">{errors.description}</div>}
            </div>
            <div>
              <label className={`block text-sm mb-1 ${styles.label}`}>{t('file')}</label>
              <input
                type="file"
                className={`border rounded p-2 w-full ${styles.input}`}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                aria-label={t('file')}
                required
              />
              {errors.file && <div className="text-xs text-red-600 dark:text-red-400">{errors.file}</div>}
            </div>
            <div>
              <button
                disabled={!canUpload || uploadMut.isPending}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                type="submit"
              >
                {t('upload')}
              </button>
            </div>
          </form>
        </div>
      )}

      {isError && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-red-700 dark:text-red-400">{t('error_loading')}</span>
            <button
              className="px-3 py-1 border border-red-300 dark:border-red-600 rounded text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
              onClick={() => refetch()}
            >
              {t('retry')}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {materials.map((m: ClassMaterial) => (
          <div key={m.id} className="card rounded-lg shadow-sm p-4 flex items-center justify-between">
            <div>
              <div className={`font-medium ${styles.materialTitle}`}>{m.title}</div>
              {m.description && <div className={`text-sm ${styles.materialDescription}`}>{m.description}</div>}
              <div className={`text-xs ${styles.materialInfo}`}>
                {m.originalName || m.filePath}
                {m.size ? ` • ${(m.size / 1024).toFixed(1)} KB` : ''}
              </div>
            </div>
            <a
              className="text-blue-600 dark:text-blue-400 underline hover:text-blue-700 dark:hover:text-blue-300"
              href={`/files/${m.filePath.replace(/^.*uploads[\\/]/, '')}`}
              target="_blank"
              rel="noreferrer"
            >
              {t('download')}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MaterialsPage;
