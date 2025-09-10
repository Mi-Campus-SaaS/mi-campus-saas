import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@tanstack/react-query';
import { listClassMaterials, uploadClassMaterial, type ClassMaterial, type PaginatedResponse } from '../api/materials';
import { queryClient } from '../queryClient';
import { useAuth } from '../auth/useAuth';
import { uploadMaterialSchema } from '../validation/schemas';
import { useZodForm } from '../hooks/useZodForm';
import Form, { ErrorSummary } from '../components/forms/Form';
import Field from '../components/forms/Field';
import { FileField, TextField } from '../components/forms/inputs';
import { FileText } from 'lucide-react';
import MaterialPreview from '../components/MaterialPreview';
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

  const form = useZodForm(uploadMaterialSchema, { title: '', description: '', file: undefined as unknown as File });

  // validation handled by useZodForm and button disabled from values

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
          <Form
            onSubmit={form.handleSubmit((data) => {
              if (!data.file) return;
              uploadMut.mutate({
                title: data.title.trim(),
                description: data.description || undefined,
                file: data.file,
              });
              form.setValues({ title: '', description: '', file: undefined as unknown as File });
            })}
            className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end"
          >
            <div className="md:col-span-3 space-y-3">
              <ErrorSummary
                errors={{
                  title: form.errors.title && t(form.errors.title),
                  description: form.errors.description && t(form.errors.description),
                  file: form.errors.file && t(form.errors.file),
                }}
              />
              <Field id="title" label={t('title')} error={form.errors.title && t(form.errors.title)}>
                <TextField
                  id="title"
                  value={form.values.title}
                  onChange={(v) => form.setField('title', v)}
                  placeholder={t('title')}
                  className={styles.input}
                />
              </Field>
              <Field
                id="description"
                label={t('description')}
                error={form.errors.description && t(form.errors.description)}
              >
                <TextField
                  id="description"
                  value={form.values.description as string}
                  onChange={(v) => form.setField('description', v)}
                  placeholder={t('description')}
                  className={styles.input}
                />
              </Field>
              <Field id="file" label={t('file')} error={form.errors.file && t(form.errors.file)}>
                <FileField
                  id="file"
                  onChange={(f) => form.setField('file', f as unknown as File)}
                  className={styles.input}
                  placeholder={t('file')}
                />
              </Field>
            </div>
            <div>
              <button
                disabled={uploadMut.isPending || !form.values.title || !form.values.file}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                type="submit"
              >
                {t('upload')}
              </button>
            </div>
          </Form>
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

      <div className="space-y-4">
        {materials.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">{t('no_materials')}</div>
        ) : (
          materials.map((material: ClassMaterial) => (
            <MaterialPreview key={material.id} material={material} classId={classId} />
          ))
        )}
      </div>
    </div>
  );
};

export default MaterialsPage;
