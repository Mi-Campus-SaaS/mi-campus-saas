import React from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { listStudents } from '../api/students';
import { useTranslation } from 'react-i18next';
import type { Student } from '../types/api';
import { Skeleton } from '../components/Skeleton';
import { FeatureGate, FeatureButton } from '../components/FeatureGate';
import { queryKeys } from '../api/queryKeys';
import { Plus, Edit, Trash2 } from 'lucide-react';

const StudentsPage: React.FC = () => {
  const { t } = useTranslation();
  const [sortBy, setSortBy] = React.useState<'lastName' | 'gpa'>('lastName');
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('asc');
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: queryKeys.students.list({ page: 1, sortBy, sortDir }),
    queryFn: async ({ pageParam = 1 }) => listStudents({ page: Number(pageParam), limit: 50, sortBy, sortDir }),
    getNextPageParam: (lastPage) => {
      const totalPages = Math.ceil((lastPage.total ?? 0) / (lastPage.limit ?? 50)) || 1;
      const next = lastPage.page + 1;
      return next <= totalPages ? next : undefined;
    },
    initialPageParam: 1,
  });

  const flatRows = React.useMemo(() => (data?.pages ?? []).flatMap((p) => p.data ?? []), [data]);
  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? flatRows.length + 1 : flatRows.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 56,
    overscan: 10,
  });

  type YStyle = React.CSSProperties & { ['--y']?: string };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold dark:text-white">{t('students')}</h1>
        <FeatureGate feature="students.create">
          <FeatureButton
            feature="students.create"
            onClick={() => console.log('Create student')}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {t('create')}
          </FeatureButton>
        </FeatureGate>
      </div>

      {isError && (
        <div className="mb-3 p-3 card bg-red-50 dark:bg-red-950 text-red-900 dark:text-red-100 flex items-center justify-between">
          <span className="text-sm">{t('error_loading')}</span>
          <button className="px-2 py-1 border rounded" onClick={() => refetch()}>
            {t('retry')}
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 12 }, (_, i) => (
            <div key={`stud-sk-${i}`} className="border p-3 rounded">
              <Skeleton className="w-48 h-3" />
              <Skeleton className="w-36 h-3 mt-2" />
            </div>
          ))}
        </div>
      ) : (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <label className="text-sm dark:text-gray-300">{t('sortBy')}</label>
            <select
              aria-label={t('sortBy')}
              className="border rounded px-2 py-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'lastName' | 'gpa')}
            >
              <option value="lastName">{t('lastName')}</option>
              <option value="gpa">{t('gpa')}</option>
            </select>
            <select
              aria-label={t('sortDirection')}
              className="border rounded px-2 py-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={sortDir}
              onChange={(e) => setSortDir(e.target.value as 'asc' | 'desc')}
            >
              <option value="asc">{t('ascending')}</option>
              <option value="desc">{t('descending')}</option>
            </select>
          </div>
          <div ref={containerRef} className="relative border rounded vh-600 overflow-auto dark:border-gray-600">
            <div className="vlist-outer" style={{ height: rowVirtualizer.getTotalSize() } as React.CSSProperties}>
              {rowVirtualizer.getVirtualItems().map((vi) => {
                if (vi.index > flatRows.length - 1) {
                  if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
                  return (
                    <div
                      key={vi.key}
                      className="p-3 flex items-center justify-center vlist-abs vlist-item"
                      style={{ ['--y']: `${vi.start}px` } as YStyle}
                    >
                      <Skeleton className="w-32 h-4" />
                    </div>
                  );
                }
                const s = flatRows[vi.index] as Student & { gpa?: number };
                return (
                  <div
                    key={vi.key}
                    className="card p-3 flex justify-between items-center m-2 vlist-abs-narrow vlist-item dark:bg-gray-800 dark:border-gray-700"
                    style={{ ['--y']: `${vi.start}px` } as YStyle}
                  >
                    <div className="flex-1">
                      <span className="dark:text-white">
                        {s.firstName} {s.lastName}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400 ml-4">
                        {t('gpa')}: {typeof s.gpa === 'number' ? s.gpa.toFixed(2) : '-'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FeatureGate feature="students.edit">
                        <FeatureButton
                          feature="students.edit"
                          onClick={() => console.log('Edit student', s.id)}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <Edit className="w-3 h-3" />
                          {t('edit')}
                        </FeatureButton>
                      </FeatureGate>
                      <FeatureGate feature="students.delete">
                        <FeatureButton
                          feature="students.delete"
                          onClick={() => console.log('Delete student', s.id)}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="w-3 h-3" />
                          {t('delete')}
                        </FeatureButton>
                      </FeatureGate>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsPage;
