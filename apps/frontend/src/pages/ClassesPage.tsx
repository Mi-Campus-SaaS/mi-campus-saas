import React from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { listClasses, type ClassItem } from '../api/classes';
import { Skeleton } from '../components/Skeleton';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';

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
  type CSSVarStyle = React.CSSProperties & { ['--y']?: string };
  const { locale = 'es' } = useParams();

  if (isError) {
    return (
      <div className="p-6">
        <div className="mb-3 p-3 card bg-red-50 dark:bg-red-950 text-red-900 dark:text-red-100 flex items-center justify-between">
          <span className="text-sm">{t('error_loading')}</span>
          <button className="px-2 py-1 border rounded" onClick={() => refetch()}>
            {t('retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">{t('classes')}</h1>
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={`cls-sk-${i}`} className="border p-3 rounded">
              <Skeleton className="w-48 h-3" />
              <Skeleton className="w-36 h-3 mt-2" />
            </div>
          ))}
        </div>
      ) : (
        <div ref={containerRef} className="relative border rounded vh-600 overflow-auto">
          {/* Remaining inline height/var needed for performance */}
          <div className="vlist-outer" style={{ height: rowVirtualizer.getTotalSize() }}>
            {rowVirtualizer.getVirtualItems().map((vi) => {
              if (vi.index > flatRows.length - 1) {
                if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
                const loaderStyle: CSSVarStyle = { ['--y']: `${vi.start}px` };
                return (
                  <div
                    key={vi.key}
                    className="p-3 flex items-center justify-center vlist-abs vlist-item"
                    style={loaderStyle}
                  >
                    <Skeleton className="w-32 h-4" />
                  </div>
                );
              }
              const c = flatRows[vi.index];
              const yStyle: CSSVarStyle = { ['--y']: `${vi.start}px` };
              return (
                <div key={vi.key} className="card p-3 m-2 vlist-abs-narrow vlist-item" style={yStyle}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{c.subjectName}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {t('classes')} • {c.gradeLevel}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {c.teacher
                          ? `${c.teacher.firstName ?? ''} ${c.teacher.lastName ?? ''}`.trim()
                          : t('unassigned')}
                      </div>
                      <Link
                        className="text-blue-600 dark:text-blue-400 underline text-sm"
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
      )}
    </div>
  );
};

export default ClassesPage;
