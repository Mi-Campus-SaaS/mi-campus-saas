import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createAnnouncement, deleteAnnouncement, listAnnouncements, updateAnnouncement } from '../api/announcements';
import type { Announcement } from '../types/api';
import { queryClient } from '../queryClient';

import { FeatureGate, FeatureButton } from '../components/FeatureGate';
import { createAnnouncementSchema } from '../validation/schemas';
import { useZodForm } from '../hooks/useZodForm';
import Form from '../components/forms/Form';
import Field from '../components/forms/Field';
import { TextField, DateTimeField } from '../components/forms/inputs';
import { Plus, Edit, Trash2, Megaphone } from 'lucide-react';
import styles from './AnnouncementsPage.module.css';

const AnnouncementsPage: React.FC = () => {
  const { t } = useTranslation();
  const [showScheduled, setShowScheduled] = useState(false);
  const [search, setSearch] = useState('');

  const { data } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => listAnnouncements(),
    refetchOnMount: 'always',
    staleTime: 0,
    select: (list: Announcement[]) => {
      const now = Date.now();
      const filtered = list.filter((a) => {
        const isPublished = new Date(a.publishAt).getTime() <= now;
        if (!showScheduled && !isPublished) return false;
        if (search && !a.content.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      });
      return filtered;
    },
  });

  const createMut = useMutation({
    mutationFn: createAnnouncement,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['announcements'] }),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, input }: { id: string; input: { content?: string; publishAt?: string } }) =>
      updateAnnouncement(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['announcements'] }),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteAnnouncement(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['announcements'] }),
  });

  const createForm = useZodForm(createAnnouncementSchema, { content: '', publishAt: '' });
  const canCreate = useMemo(() => createForm.values.content.trim().length > 0, [createForm.values.content]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Megaphone className={`w-6 h-6 ${styles.icon}`} />
          <h1 className={`text-xl font-semibold ${styles.title}`}>{t('announcements')}</h1>
        </div>
        <FeatureGate feature="announcements.create">
          <FeatureButton
            feature="announcements.create"
            onClick={() => console.log('Create announcement')}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {t('create')}
          </FeatureButton>
        </FeatureGate>
      </div>

      <div className="card rounded-lg shadow-sm p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className={`block text-sm mb-1 ${styles.label}`}>{t('search')}</label>
            <input
              className={`border rounded p-2 w-full ${styles.input}`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('search')}
              aria-label={t('search')}
            />
          </div>
          <label className={`inline-flex items-center gap-2 ${styles.label}`}>
            <input
              type="checkbox"
              checked={showScheduled}
              onChange={(e) => setShowScheduled(e.target.checked)}
              className={styles.checkbox}
            />
            <span>{t('show_scheduled')}</span>
          </label>
        </div>
      </div>

      <FeatureGate feature="announcements.create">
        <div className="card rounded-lg shadow-sm p-4">
          <Form
            className="flex flex-wrap items-end gap-3"
            onSubmit={createForm.handleSubmit((data) => {
              createMut.mutate({ content: data.content.trim(), publishAt: data.publishAt || undefined });
              createForm.setValues({ content: '', publishAt: '' });
            })}
          >
            <div className="flex-1 min-w-[240px]">
              <Field
                id="content"
                label={t('content')}
                error={createForm.errors.content && t(createForm.errors.content)}
              >
                <TextField
                  id="content"
                  className={styles.input}
                  value={createForm.values.content}
                  onChange={(v) => createForm.setField('content', v)}
                  placeholder={t('content')}
                />
              </Field>
            </div>
            <div>
              <Field
                id="publishAt"
                label={t('publish_at')}
                error={createForm.errors.publishAt && t(createForm.errors.publishAt)}
              >
                <DateTimeField
                  id="publishAt"
                  className={styles.input}
                  value={createForm.values.publishAt as string}
                  onChange={(v) => createForm.setField('publishAt', v)}
                  placeholder={t('publish_at')}
                />
              </Field>
            </div>
            <button
              disabled={!canCreate || createMut.isPending}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              type="submit"
            >
              {t('create')}
            </button>
          </Form>
        </div>
      </FeatureGate>

      <div className="space-y-3">
        {data?.map((a) => (
          <div key={a.id} className="card rounded-lg shadow-sm p-4 space-y-2">
            <div className={`text-sm ${styles.timestamp}`}>{new Date(a.publishAt).toLocaleString()}</div>
            <div className={`font-medium ${styles.content}`}>{a.content}</div>
            <div className="flex gap-2">
              <FeatureGate feature="announcements.edit">
                <FeatureButton
                  feature="announcements.edit"
                  onClick={() => {
                    const content = prompt(t('prompt_edit_content'), a.content) || '';
                    if (!content.trim()) return;
                    const publishAt = prompt(t('prompt_edit_publish_at'), new Date(a.publishAt).toISOString()) || '';
                    updateMut.mutate({
                      id: a.id,
                      input: {
                        content: content.trim(),
                        publishAt: publishAt || undefined,
                      },
                    });
                  }}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Edit className="w-3 h-3" />
                  {t('edit')}
                </FeatureButton>
              </FeatureGate>
              <FeatureGate feature="announcements.delete">
                <FeatureButton
                  feature="announcements.delete"
                  onClick={() => {
                    if (!confirm(t('confirm_delete_announcement'))) return;
                    deleteMut.mutate(a.id);
                  }}
                  variant="outline"
                  size="sm"
                  className={`flex items-center gap-1 ${styles.deleteButton}`}
                >
                  <Trash2 className="w-3 h-3" />
                  {t('delete')}
                </FeatureButton>
              </FeatureGate>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnnouncementsPage;
