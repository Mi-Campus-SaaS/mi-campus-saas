import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { useTranslation } from 'react-i18next';
import type { AxiosResponse } from 'axios';
import type { Student } from '../types/api';
import { Skeleton } from '../components/Skeleton';

const StudentsPage: React.FC = () => {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ['students'],
    queryFn: async (): Promise<Student[]> => {
      const res: AxiosResponse<Student[]> = await api.get('/students');
      return res.data;
    },
  });
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">{t('students')}</h1>
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border p-3 rounded">
              <Skeleton width={200} height={14} />
              <Skeleton width={140} height={12} className="mt-2" />
            </div>
          ))}
        </div>
      ) : (
      <ul className="space-y-2">
        {data?.map((s) => (
          <li key={s.id} className="border p-3 rounded">{s.firstName} {s.lastName}</li>
        ))}
      </ul>
      )}
    </div>
  );
};

export default StudentsPage;

