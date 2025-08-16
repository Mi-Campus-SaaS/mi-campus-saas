import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createAnnouncement, deleteAnnouncement, listAnnouncements, updateAnnouncement } from '../api/announcements';
import type { Announcement } from '../types/api';
import { queryClient } from '../queryClient';

import { FeatureGate, FeatureButton } from '../components/FeatureGate';
import { createAnnouncementSchema } from '../validation/schemas';
import { Plus, Edit, Trash2 } from 'lucide-react';

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

  const [newContent, setNewContent] = useState('');
  const [newPublishAt, setNewPublishAt] = useState<string>('');
  const [errors, setErrors] = useState<{
    content?: string;
    publishAt?: string;
  }>({});

  const canCreate = useMemo(() => newContent.trim().length > 0, [newContent]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold dark:text-white">{t('announcements')}</h1>
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

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm mb-1 dark:text-gray-300">{t('search')}</label>
          <input
            className="border rounded p-2 w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('search')}
            aria-label={t('search')}
          />
        </div>
        <label className="inline-flex items-center gap-2 dark:text-gray-300">
          <input
            type="checkbox"
            checked={showScheduled}
            onChange={(e) => setShowScheduled(e.target.checked)}
            className="dark:bg-gray-700 dark:border-gray-600"
          />
          <span>{t('show_scheduled')}</span>
        </label>
      </div>

      <FeatureGate feature="announcements.create">
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            const result = createAnnouncementSchema.safeParse({
              content: newContent,
              publishAt: newPublishAt || undefined,
            });
            if (!result.success) {
              const fieldErrors: { content?: string; publishAt?: string } = {};
              for (const issue of result.error.issues) {
                if (issue.path[0] === 'content') fieldErrors.content = t(issue.message);
                if (issue.path[0] === 'publishAt') fieldErrors.publishAt = t(issue.message);
              }
              setErrors(fieldErrors);
              return;
            }
            setErrors({});
            createMut.mutate({
              content: newContent.trim(),
              publishAt: newPublishAt || undefined,
            });
            setNewContent('');
            setNewPublishAt('');
          }}
        >
          <div className="flex-1 min-w-[240px]">
            <label className="block text-sm mb-1 dark:text-gray-300">{t('content')}</label>
            <input
              className="border rounded p-2 w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder={t('content')}
              aria-label={t('content')}
              required
            />
            {errors.content && <div className="text-xs text-red-600 dark:text-red-400">{errors.content}</div>}
          </div>
          <div>
            <label className="block text-sm mb-1 dark:text-gray-300">{t('publish_at')}</label>
            <input
              type="datetime-local"
              className="border rounded p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={newPublishAt}
              onChange={(e) => setNewPublishAt(e.target.value)}
              placeholder={t('publish_at')}
              aria-label={t('publish_at')}
            />
            {errors.publishAt && <div className="text-xs text-red-600 dark:text-red-400">{errors.publishAt}</div>}
          </div>
          <button
            disabled={!canCreate || createMut.isPending}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            type="submit"
          >
            {t('create')}
          </button>
        </form>
      </FeatureGate>

      <ul className="space-y-3">
        {data?.map((a) => (
          <li key={a.id} className="card p-3 space-y-2 dark:bg-gray-800 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">{new Date(a.publishAt).toLocaleString()}</div>
            <div className="font-medium dark:text-white">{a.content}</div>
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
                  className="flex items-center gap-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  <Trash2 className="w-3 h-3" />
                  {t('delete')}
                </FeatureButton>
              </FeatureGate>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AnnouncementsPage;
