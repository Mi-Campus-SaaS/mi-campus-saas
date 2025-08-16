import React from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { listClasses, type ClassItem } from '../api/classes';
import { Skeleton } from '../components/Skeleton';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import styles from './ClassesPage.module.css';

const ClassesPage: React.FC = () => {
  const { t } = useTranslation();
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['classes', 'list'],
    queryFn: async ({ pageParam = 1 }) => listClasses({ page: Number(pageParam), limit: 50 }),
    getNextPageParam: (last) => {
      const totalPages = Math.ceil((last.total ?? 0) / (last.limit ?? 50)) || 1;
      const next = last.page + 1;
      return next <= totalPages ? next : undefined;
    },
    initialPageParam: 1,
    staleTime: 30_000,
  });

  const flatRows = React.useMemo<ClassItem[]>(() => (data?.pages ?? []).flatMap((p) => p.data ?? []), [data]);

  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? flatRows.length + 1 : flatRows.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 64,
    overscan: 10,
  });

  const { locale = 'es' } = useParams();

  if (isError) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <BookOpen className={`w-6 h-6 ${styles.icon}`} />
          <h1 className={`text-xl font-semibold ${styles.title}`}>{t('classes')}</h1>
        </div>
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
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
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <BookOpen className={`w-6 h-6 ${styles.icon}`} />
        <h1 className={`text-xl font-semibold ${styles.title}`}>{t('classes')}</h1>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={`cls-sk-${i}`} className="card rounded-lg shadow-sm p-4">
              <Skeleton className="w-48 h-3" />
              <Skeleton className="w-36 h-3 mt-2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="card rounded-lg shadow-sm">
          <div ref={containerRef} className="relative overflow-auto max-h-96">
            <div
              className={`vlist-outer ${styles.vlistOuter}`}
              style={{ '--total-size': `${rowVirtualizer.getTotalSize()}px` } as React.CSSProperties}
            >
              {rowVirtualizer.getVirtualItems().map((vi) => {
                if (vi.index > flatRows.length - 1) {
                  if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
                  return (
                    <div
                      key={vi.key}
                      className={`p-4 flex items-center justify-center vlist-abs vlist-item ${styles.loaderStyle}`}
                      style={{ '--start-y': `${vi.start}px` } as React.CSSProperties}
                    >
                      <Skeleton className="w-32 h-4" />
                    </div>
                  );
                }
                const c = flatRows[vi.index];
                return (
                  <div
                    key={vi.key}
                    className={`p-4 border-b vlist-abs-narrow vlist-item transition-colors ${styles.virtualRow} ${styles.yStyle}`}
                    style={{ '--start-y': `${vi.start}px` } as React.CSSProperties}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className={`font-medium ${styles.subjectName}`}>{c.subjectName}</div>
                        <div className={`text-sm ${styles.classInfo}`}>
                          {t('classes')} • {c.gradeLevel}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`text-sm ${styles.teacherName}`}>
                          {c.teacher
                            ? `${c.teacher.firstName ?? ''} ${c.teacher.lastName ?? ''}`.trim()
                            : t('unassigned')}
                        </div>
                        <Link
                          className="text-blue-600 dark:text-blue-400 underline text-sm hover:text-blue-700 dark:hover:text-blue-300"
                          to={`/${locale}/classes/${c.id}/materials`}
                        >
                          {t('materials')}
                        </Link>
                      </div>
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

export default ClassesPage;
