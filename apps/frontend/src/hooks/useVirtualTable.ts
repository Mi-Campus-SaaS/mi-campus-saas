import { useState, useCallback, useMemo } from 'react';

export interface SortState {
  column: string;
  direction: 'asc' | 'desc';
}

export interface UseVirtualTableOptions {
  initialSort?: SortState;
  onSortChange?: (sort: SortState | null) => void;
}

export function useVirtualTable<T>({ initialSort, onSortChange }: UseVirtualTableOptions = {}) {
  const [sortState, setSortState] = useState<SortState | null>(initialSort || null);

  const handleSort = useCallback(
    (column: string, direction: 'asc' | 'desc') => {
      const newSort: SortState = { column, direction };
      setSortState(newSort);
      onSortChange?.(newSort);
    },
    [onSortChange],
  );

  const clearSort = useCallback(() => {
    setSortState(null);
    onSortChange?.(null);
  }, [onSortChange]);

  const sortData = useCallback(
    (data: T[], getValue: (item: T, column: string) => unknown) => {
      if (!sortState) return data;

      return [...data].sort((a, b) => {
        const aValue = getValue(a, sortState.column);
        const bValue = getValue(b, sortState.column);

        if (aValue === bValue) return 0;
        if (aValue == null) return sortState.direction === 'asc' ? 1 : -1;
        if (bValue == null) return sortState.direction === 'asc' ? -1 : 1;

        let comparison = 0;
        if (aValue < bValue) {
          comparison = -1;
        } else if (aValue > bValue) {
          comparison = 1;
        }
        return sortState.direction === 'asc' ? comparison : -comparison;
      });
    },
    [sortState],
  );

  const getSortDirection = useCallback(
    (column: string): 'asc' | 'desc' | null => {
      if (!sortState || sortState.column !== column) return null;
      return sortState.direction;
    },
    [sortState],
  );

  const isSorted = useCallback(
    (column: string): boolean => {
      return sortState?.column === column;
    },
    [sortState],
  );

  const sortProps = useMemo(
    () => ({
      sortBy: sortState?.column,
      sortDirection: sortState?.direction,
      onSort: handleSort,
    }),
    [sortState, handleSort],
  );

  return {
    sortState,
    handleSort,
    clearSort,
    sortData,
    getSortDirection,
    isSorted,
    sortProps,
  };
}

export default useVirtualTable;
