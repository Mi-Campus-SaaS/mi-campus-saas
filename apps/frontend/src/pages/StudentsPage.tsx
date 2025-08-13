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
  const studentSkeletonKeys = React.useMemo(() => Array.from({ length: 6 }, (_, i) => `stud-sk-${i}`), []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">{t('students')}</h1>
      {isLoading ? (
        <div className="space-y-3">
          {studentSkeletonKeys.map((key) => (
            <div key={key} className="border p-3 rounded">
              <Skeleton className="w-48 h-3" />
              <Skeleton className="w-36 h-3 mt-2" />
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

