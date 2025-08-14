import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createAnnouncement, deleteAnnouncement, listAnnouncements, updateAnnouncement } from '../api/announcements';
import type { Announcement } from '../types/api';
import { queryClient } from '../queryClient';
import { useAuth } from '../auth/useAuth';

const AnnouncementsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [showScheduled, setShowScheduled] = useState(false);
  const [search, setSearch] = useState('');

  const { data } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => listAnnouncements(),
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

  const canCreate = useMemo(() => newContent.trim().length > 0, [newContent]);
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">{t('announcements')}</h1>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm mb-1">{t('search')}</label>
          <input
            className="border rounded p-2 w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('search')}
            aria-label={t('search')}
          />
        </div>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={showScheduled} onChange={(e) => setShowScheduled(e.target.checked)} />
          <span>{t('show_scheduled')}</span>
        </label>
      </div>

      {user && (user.role === 'admin' || user.role === 'teacher') && (
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          createMut.mutate({ content: newContent.trim(), publishAt: newPublishAt || undefined });
          setNewContent('');
          setNewPublishAt('');
        }}
      >
        <div className="flex-1 min-w-[240px]">
          <label className="block text-sm mb-1">{t('content')}</label>
          <input
            className="border rounded p-2 w-full"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder={t('content')}
            aria-label={t('content')}
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1">{t('publish_at')}</label>
          <input
            type="datetime-local"
            className="border rounded p-2"
            value={newPublishAt}
            onChange={(e) => setNewPublishAt(e.target.value)}
            aria-label={t('publish_at')}
          />
        </div>
        <button disabled={!canCreate || createMut.isPending} className="bg-blue-600 text-white px-4 py-2 rounded" type="submit">
          {t('create')}
        </button>
      </form>
      )}

      <ul className="space-y-3">
        {data?.map((a) => (
          <li key={a.id} className="card p-3 space-y-2">
            <div className="text-sm text-gray-600">
              {new Date(a.publishAt).toLocaleString()}
            </div>
            <div className="font-medium">{a.content}</div>
            {(user && (user.role === 'admin' || user.role === 'teacher')) && (
            <div className="flex gap-2">
              <button
                className="px-3 py-1 rounded border"
                onClick={() => {
                  const content = prompt(t('prompt_edit_content'), a.content) || ''
                  if (!content.trim()) return
                  const publishAt = prompt(t('prompt_edit_publish_at'), new Date(a.publishAt).toISOString()) || ''
                  updateMut.mutate({ id: a.id, input: { content: content.trim(), publishAt: publishAt || undefined } })
                }}
              >
                 {t('edit')}
              </button>
              <button
                className="px-3 py-1 rounded border border-red-300 text-red-700"
                onClick={() => {
                  if (!confirm(t('confirm_delete_announcement'))) return
                  deleteMut.mutate(a.id)
                }}
              >
                {t('delete')}
              </button>
            </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AnnouncementsPage;

