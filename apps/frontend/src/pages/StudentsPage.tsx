import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { useTranslation } from 'react-i18next';

const StudentsPage: React.FC = () => {
  const { t } = useTranslation();
  const { data } = useQuery({ queryKey: ['students'], queryFn: async () => (await api.get('/students')).data });
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">{t('students')}</h1>
      <ul className="space-y-2">
        {data?.map((s: any) => (
          <li key={s.id} className="border p-3 rounded">{s.firstName} {s.lastName}</li>
        ))}
      </ul>
    </div>
  );
};

export default StudentsPage;

