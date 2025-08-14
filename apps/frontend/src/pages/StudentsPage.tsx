import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { listStudents } from '../api/students';
import { useTranslation } from 'react-i18next';
import type { Paginated, Student } from '../types/api';
import { Skeleton } from '../components/Skeleton';
import { queryKeys } from '../api/queryKeys';

const StudentsPage: React.FC = () => {
  const { t } = useTranslation();
  const [sortBy, setSortBy] = React.useState<'lastName' | 'gpa'>('lastName');
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('asc');
  const [page, setPage] = React.useState(1);

  const { data, isLoading, isError, refetch } = useQuery<Paginated<Student>>({
    queryKey: queryKeys.students.list({ page, sortBy, sortDir }),
    queryFn: async () => listStudents({ page, sortBy, sortDir }),
    placeholderData: (prev) => prev,
  });
  const studentSkeletonKeys = React.useMemo(() => Array.from({ length: 6 }, (_, i) => `stud-sk-${i}`), []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">{t('students')}</h1>
      {isError && (
        <div className="mb-3 p-3 card bg-red-50 dark:bg-red-950 text-red-900 dark:text-red-100 flex items-center justify-between">
          <span className="text-sm">{t('error_loading') || 'Error loading data.'}</span>
          <button className="px-2 py-1 border rounded" onClick={() => refetch()}>{t('retry') || 'Retry'}</button>
        </div>
      )}
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
      <div>
        <div className="mb-3 flex items-center gap-2">
          <label className="text-sm">{t('sortBy')}</label>
          <select aria-label={t('sortBy')} className="border rounded px-2 py-1" value={sortBy} onChange={(e) => setSortBy(e.target.value as 'lastName' | 'gpa')}>
            <option value="lastName">{t('lastName')}</option>
            <option value="gpa">GPA</option>
          </select>
          <select aria-label={t('sortDirection')} className="border rounded px-2 py-1" value={sortDir} onChange={(e) => setSortDir(e.target.value as 'asc' | 'desc')}>
            <option value="asc">{t('ascending')}</option>
            <option value="desc">{t('descending')}</option>
          </select>
        </div>
        <ul className="space-y-2">
          {data?.data?.map((s: Student & { gpa?: number }) => (
            <li key={s.id} className="card p-3 flex justify-between">
              <span>{s.firstName} {s.lastName}</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">GPA: {typeof s.gpa === 'number' ? s.gpa.toFixed(2) : '-'}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-center gap-3">
          <button className="px-3 py-1 border rounded disabled:opacity-50" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>{t('prev')}</button>
          <span className="text-sm">{t('page')} {data?.page ?? page} / {Math.ceil((data?.total ?? 0) / (data?.limit ?? 20)) || 1}</span>
          <button className="px-3 py-1 border rounded disabled:opacity-50" disabled={(data?.page ?? 1) >= Math.ceil((data?.total ?? 0) / (data?.limit ?? 20))} onClick={() => setPage((p) => p + 1)}>{t('next')}</button>
        </div>
      </div>
      )}
    </div>
  );
};

export default StudentsPage;

