import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

const SchedulePage: React.FC = () => {
  const { t } = useTranslation();
  const { data } = useQuery({
    queryKey: ['schedule'],
    queryFn: async () => (await api.get('/schedule/student/demo')).data,
  });
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">{t('schedule')}</h1>
      <pre className="bg-gray-100 p-3 rounded text-sm">{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};

export default SchedulePage;
