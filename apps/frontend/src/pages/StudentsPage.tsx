import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { useTranslation } from 'react-i18next';
import type { AxiosResponse } from 'axios';
import type { Student } from '../types/api';

const StudentsPage: React.FC = () => {
  const { t } = useTranslation();
  const { data } = useQuery({
    queryKey: ['students'],
    queryFn: async (): Promise<Student[]> => {
      const res: AxiosResponse<Student[]> = await api.get('/students');
      return res.data;
    },
  });
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">{t('students')}</h1>
      <ul className="space-y-2">
        {data?.map((s) => (
          <li key={s.id} className="border p-3 rounded">{s.firstName} {s.lastName}</li>
        ))}
      </ul>
    </div>
  );
};

export default StudentsPage;

