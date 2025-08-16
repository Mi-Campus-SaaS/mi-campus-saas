import React from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { listStudents } from '../api/students';
import { useTranslation } from 'react-i18next';
import type { Student } from '../types/api';
import { Skeleton } from '../components/Skeleton';
import { FeatureGate, FeatureButton } from '../components/FeatureGate';
import { queryKeys } from '../api/queryKeys';
import { Plus, Edit, Trash2, Users } from 'lucide-react';
import styles from './StudentsPage.module.css';

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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users className={`w-6 h-6 ${styles.icon}`} />
          <h1 className={`text-xl font-semibold ${styles.title}`}>{t('students')}</h1>
        </div>
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
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-red-700 dark:text-red-400">{t('error_loading')}</span>
            <button
              className="px-3 py-1 border border-red-300 dark:border-red-600 rounded text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
              onClick={() => refetch()}
            >
              {t('retry')}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 12 }, (_, i) => (
            <div key={`stud-sk-${i}`} className="card rounded-lg shadow-sm p-4">
              <Skeleton className="w-48 h-3" />
              <Skeleton className="w-36 h-3 mt-2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="card rounded-lg shadow-sm">
          <div className={`p-4 border-b ${styles.cardHeader}`}>
            <div className="flex items-center gap-3">
              <label className={`text-sm ${styles.sortLabel}`}>{t('sortBy')}</label>
              <select
                aria-label={t('sortBy')}
                className={`border rounded px-3 py-1 ${styles.sortSelect}`}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'lastName' | 'gpa')}
              >
                <option value="lastName">{t('lastName')}</option>
                <option value="gpa">{t('gpa')}</option>
              </select>
              <select
                aria-label={t('sortDirection')}
                className={`border rounded px-3 py-1 ${styles.sortSelect}`}
                value={sortDir}
                onChange={(e) => setSortDir(e.target.value as 'asc' | 'desc')}
              >
                <option value="asc">{t('ascending')}</option>
                <option value="desc">{t('descending')}</option>
              </select>
            </div>
          </div>
          <div ref={containerRef} className="relative overflow-auto max-h-96">
            <div className="vlist-outer" style={{ height: rowVirtualizer.getTotalSize() } as React.CSSProperties}>
              {rowVirtualizer.getVirtualItems().map((vi) => {
                if (vi.index > flatRows.length - 1) {
                  if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
                  return (
                    <div
                      key={vi.key}
                      className="p-4 flex items-center justify-center vlist-abs vlist-item"
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
                    className={`p-4 flex justify-between items-center border-b vlist-abs-narrow vlist-item transition-colors ${styles.virtualItem}`}
                    style={
                      {
                        ['--y']: `${vi.start}px`,
                      } as YStyle
                    }
                  >
                    <div className="flex-1">
                      <span className={`font-medium ${styles.studentName}`}>
                        {s.firstName} {s.lastName}
                      </span>
                      <span className={`text-sm ml-4 ${styles.studentGpa}`}>
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
