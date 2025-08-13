import React, { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery } from '@tanstack/react-query'
import { listClassMaterials, uploadClassMaterial, type ClassMaterial } from '../api/materials'
import { queryClient } from '../queryClient'
import { useAuth } from '../auth/useAuth'

const MaterialsPage: React.FC = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { classId = '' } = useParams()

  const { data } = useQuery({
    queryKey: ['materials', 'class', classId],
    queryFn: () => listClassMaterials(classId),
    enabled: Boolean(classId),
  })

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)

  const canUpload = useMemo(() => Boolean(title.trim() && file), [title, file])

  const uploadMut = useMutation({
    mutationFn: (vars: { title: string; description?: string; file: File }) =>
      uploadClassMaterial(classId, vars),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['materials', 'class', classId] }),
  })

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">{t('materials')}</h1>

      {user && (user.role === 'admin' || user.role === 'teacher') && (
        <form
          className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end"
          onSubmit={(e) => {
            e.preventDefault()
            if (!file) return
            uploadMut.mutate({ title: title.trim(), description: description || undefined, file })
            setTitle('')
            setDescription('')
            setFile(null)
          }}
        >
          <div>
            <label className="block text-sm mb-1">{t('title') || 'Title'}</label>
            <input
              className="border rounded p-2 w-full"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('title') || 'Title'}
              aria-label={t('title') || 'Title'}
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1">{t('description') || 'Description'}</label>
            <input
              className="border rounded p-2 w-full"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('description') || 'Description'}
              aria-label={t('description') || 'Description'}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">{t('file') || 'File'}</label>
            <input
              type="file"
              className="border rounded p-2 w-full"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              aria-label={t('file') || 'File'}
              required
            />
          </div>
          <div>
            <button disabled={!canUpload || uploadMut.isPending} className="bg-blue-600 text-white px-4 py-2 rounded" type="submit">
              {t('upload') || 'Upload'}
            </button>
          </div>
        </form>
      )}

      <ul className="space-y-3">
        {data?.map((m: ClassMaterial) => (
          <li key={m.id} className="border rounded p-3 flex items-center justify-between">
            <div>
              <div className="font-medium">{m.title}</div>
              {m.description && <div className="text-sm text-gray-600">{m.description}</div>}
              <div className="text-xs text-gray-500">
                {(m.originalName || m.filePath)}
                {m.size ? ` • ${(m.size / 1024).toFixed(1)} KB` : ''}
              </div>
            </div>
            <a
              className="text-blue-600 underline"
              href={`/files/${m.filePath.replace(/^.*uploads[\\/]/, '')}`}
              target="_blank"
              rel="noreferrer"
            >
              {t('download') || 'Download'}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default MaterialsPage


