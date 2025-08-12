import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

const AnnouncementsPage: React.FC = () => {
  const { t } = useTranslation();
  const { data } = useQuery({ queryKey: ['announcements'], queryFn: async () => (await api.get('/announcements')).data });
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">{t('announcements')}</h1>
      <ul className="space-y-3">
        {data?.map((a: any) => (
          <li key={a.id} className="border rounded p-3">{a.content}</li>
        ))}
      </ul>
    </div>
  );
};

export default AnnouncementsPage;

