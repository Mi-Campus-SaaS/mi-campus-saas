import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Filter, Download, RefreshCw } from 'lucide-react';
import VirtualDataTable from './VirtualDataTable';
import type { Column } from './VirtualDataTable';
import { useVirtualTable } from '../hooks/useVirtualTable';
import styles from './AdvancedDataTable.module.css';

export interface AdvancedDataTableProps<T = unknown> {
  readonly data: T[];
  readonly columns: Column<T>[];
  readonly height?: number;
  readonly rowHeight?: number;
  readonly className?: string;
  readonly onRowClick?: (row: T, index: number) => void;
  readonly onRefresh?: () => void;
  readonly onExport?: (data: T[]) => void;
  readonly loading?: boolean;
  readonly emptyMessage?: string;
  readonly searchable?: boolean;
  readonly filterable?: boolean;
  readonly exportable?: boolean;
  readonly refreshable?: boolean;
  readonly searchPlaceholder?: string;
  readonly filterOptions?: Array<{
    readonly key: string;
    readonly label: string;
    readonly options: Array<{ readonly value: string; readonly label: string }>;
  }>;
  readonly onFilterChange?: (filters: Record<string, string>) => void;
  readonly stickyHeader?: boolean;
}

export function AdvancedDataTable<T = unknown>({
  data,
  columns,
  height = 400,
  rowHeight = 56,
  className = '',
  onRowClick,
  onRefresh,
  onExport,
  loading = false,
  emptyMessage,
  searchable = true,
  filterable = false,
  exportable = false,
  refreshable = true,
  searchPlaceholder,
  filterOptions = [],
  onFilterChange,
  stickyHeader = true,
}: AdvancedDataTableProps<T>) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);

  const { sortProps, sortData } = useVirtualTable<T>();

  const getColumnValue = useCallback((item: T, column: Column<T>) => {
    if (column.accessorFn) {
      return column.accessorFn(item);
    } else if (column.accessorKey) {
      return item[column.accessorKey];
    }
    return null;
  }, []);

  const safeStringify = useCallback((value: unknown): string => {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch {
        return '[Object]';
      }
    }
    return '[Unknown]';
  }, []);

  const matchesSearch = useCallback(
    (item: T) => {
      return columns.some((column) => {
        const value = getColumnValue(item, column);
        if (value == null) return false;
        return safeStringify(value).toLowerCase().includes(searchTerm.toLowerCase());
      });
    },
    [columns, searchTerm, getColumnValue, safeStringify],
  );

  const matchesFilters = useCallback(
    (item: T) => {
      return Object.entries(filters).every(([columnKey, filterValue]) => {
        if (!filterValue) return true;

        const column = columns.find((col) => col.key === columnKey);
        if (!column) return true;

        const value = getColumnValue(item, column);
        if (value == null) return false;
        return safeStringify(value).toLowerCase().includes(filterValue.toLowerCase());
      });
    },
    [filters, columns, getColumnValue, safeStringify],
  );

  const filteredData = useMemo(() => {
    let filtered = data;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(matchesSearch);
    }

    // Apply column filters
    if (Object.keys(filters).length > 0) {
      filtered = filtered.filter(matchesFilters);
    }

    return filtered;
  }, [data, searchTerm, filters, matchesSearch, matchesFilters]);

  const sortedData = useMemo(() => {
    return sortData(filteredData, (item, columnKey) => {
      const column = columns.find((col) => col.key === columnKey);
      if (!column) return null;

      if (column.accessorFn) {
        return column.accessorFn(item);
      } else if (column.accessorKey) {
        return item[column.accessorKey];
      }
      return null;
    });
  }, [filteredData, sortData, columns]);

  const handleFilterChange = useCallback(
    (columnKey: string, value: string) => {
      const newFilters = { ...filters, [columnKey]: value };
      setFilters(newFilters);
      onFilterChange?.(newFilters);
    },
    [filters, onFilterChange],
  );

  const clearFilters = useCallback(() => {
    setFilters({});
    setSearchTerm('');
    onFilterChange?.({});
  }, [onFilterChange]);

  const handleExport = useCallback(() => {
    if (onExport) {
      onExport(sortedData);
    }
  }, [onExport, sortedData]);

  const hasActiveFilters = searchTerm || Object.values(filters).some(Boolean);

  return (
    <div className={`advanced-data-table ${className}`}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          {searchable && (
            <div className={styles.searchContainer}>
              <label htmlFor="table-search" className="visually-hidden">
                {searchPlaceholder || t('search')}
              </label>
              <Search className={styles.searchIcon} aria-hidden="true" />
              <input
                id="table-search"
                type="search"
                placeholder={searchPlaceholder || t('search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>
          )}

          {filterable && filterOptions.length > 0 && (
            <button
              className={`${styles.filterButton} ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
              aria-expanded={showFilters}
              aria-label={t('filters')}
            >
              <Filter className={styles.filterIcon} aria-hidden="true" />
              {t('filters')}
              {hasActiveFilters && <span className={styles.filterBadge} aria-label={t('filters_active')} />}
            </button>
          )}
        </div>

        <div className={styles.toolbarRight}>
          {hasActiveFilters && (
            <button className={styles.clearButton} onClick={clearFilters}>
              {t('clear_filters')}
            </button>
          )}

          {refreshable && onRefresh && (
            <button
              className={styles.actionButton}
              onClick={onRefresh}
              disabled={loading}
              title={t('refresh')}
              aria-label={t('refresh')}
            >
              <RefreshCw className={`${styles.actionIcon} ${loading ? 'spinning' : ''}`} aria-hidden="true" />
            </button>
          )}

          {exportable && onExport && (
            <button className={styles.actionButton} onClick={handleExport} title={t('export')} aria-label={t('export')}>
              <Download className={styles.actionIcon} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && filterOptions.length > 0 && (
        <div className={styles.filterPanel} role="region" aria-label={t('filters')}>
          {filterOptions.map((filter) => (
            <div key={filter.key} className={styles.filterGroup}>
              <label htmlFor={`filter-${filter.key}`} className={styles.filterLabel}>
                {filter.label}
              </label>
              <select
                id={`filter-${filter.key}`}
                value={filters[filter.key] || ''}
                onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                className={styles.filterSelect}
              >
                <option value="">{t('all')}</option>
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      {/* Data Table */}
      <VirtualDataTable
        data={sortedData}
        columns={columns}
        height={height}
        rowHeight={rowHeight}
        onRowClick={onRowClick}
        loading={loading}
        emptyMessage={emptyMessage || t('no_data_available')}
        stickyHeader={stickyHeader}
        {...sortProps}
      />

      {/* Footer */}
      <div className={styles.footer}>
        <div className={styles.footerLeft}>
          <span className={styles.countText}>
            {t('showing')} {sortedData.length} {t('of')} {data.length} {t('items')}
          </span>
        </div>
        <div className={styles.footerRight}>
          {hasActiveFilters && <span className={styles.filteredText}>{t('filtered_results')}</span>}
        </div>
      </div>
    </div>
  );
}

export default AdvancedDataTable;
