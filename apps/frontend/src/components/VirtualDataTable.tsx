import React, { useMemo, useRef, useState, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ChevronUp, ChevronDown, GripVertical } from 'lucide-react';
import './VirtualDataTable.css';

export interface Column<T = unknown> {
  key: string;
  header: string;
  accessorKey?: keyof T;
  accessorFn?: (row: T) => React.ReactNode;
  // Cell renderers may use React hooks. Treat them as components and render via JSX, not as plain functions.
  cell?: (props: { row: T; value?: React.ReactNode }) => React.ReactNode;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  sortable?: boolean;
  resizable?: boolean;
  className?: string;
  headerClassName?: string;
  cellClassName?: string;
}

export interface VirtualDataTableProps<T = unknown> {
  readonly data: T[];
  readonly columns: Column<T>[];
  readonly height?: number;
  readonly rowHeight?: number;
  readonly overscan?: number;
  readonly className?: string;
  readonly headerClassName?: string;
  readonly bodyClassName?: string;
  readonly rowClassName?: string | ((row: T, index: number) => string);
  readonly onRowClick?: (row: T, index: number) => void;
  readonly onSort?: (column: string, direction: 'asc' | 'desc') => void;
  readonly sortBy?: string;
  readonly sortDirection?: 'asc' | 'desc';
  readonly loading?: boolean;
  readonly emptyMessage?: string;
  readonly stickyHeader?: boolean;
}

export function VirtualDataTable<T = unknown>({
  data,
  columns,
  height = 400,
  rowHeight = 56,
  overscan = 10,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  rowClassName = '',
  onRowClick,
  onSort,
  sortBy,
  sortDirection = 'asc',
  loading = false,
  emptyMessage = 'No data available',
  stickyHeader = true,
}: VirtualDataTableProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [isResizing, setIsResizing] = useState<string | null>(null);

  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => rowHeight,
    overscan,
  });

  const getColumnWidth = useCallback(
    (column: Column<T>) => {
      if (columnWidths[column.key]) {
        return columnWidths[column.key];
      }
      return column.width || 'auto';
    },
    [columnWidths],
  );

  const handleColumnResize = useCallback((columnKey: string, newWidth: number) => {
    setColumnWidths((prev) => ({
      ...prev,
      [columnKey]: Math.max(50, newWidth),
    }));
  }, []);

  const handleResizeStart = useCallback((columnKey: string) => {
    setIsResizing(columnKey);
  }, []);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(null);
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

  const handleSort = useCallback(
    (columnKey: string) => {
      if (!onSort) return;
      const newDirection = sortBy === columnKey && sortDirection === 'asc' ? 'desc' : 'asc';
      onSort(columnKey, newDirection);
    },
    [onSort, sortBy, sortDirection],
  );

  const getRowClassName = useCallback(
    (row: T, index: number) => {
      const baseClass = 'virtual-table-row';
      const customClass = typeof rowClassName === 'function' ? rowClassName(row, index) : rowClassName;
      return `${baseClass} ${customClass || ''}`.trim();
    },
    [rowClassName],
  );

  const renderRowCells = useCallback(
    (row: T) => {
      return columns.map((column) => {
        let rawValue: unknown = null;
        if (column.accessorFn) {
          rawValue = column.accessorFn(row);
        } else if (column.accessorKey) {
          rawValue = row[column.accessorKey] as unknown as React.ReactNode;
        }

        let rendered: React.ReactNode;
        if (column.cell) {
          const Cell = column.cell;
          rendered = <Cell row={row} value={rawValue as React.ReactNode} />;
        } else if (typeof rawValue === 'string' || typeof rawValue === 'number' || typeof rawValue === 'boolean') {
          rendered = String(rawValue);
        } else if (rawValue === null || rawValue === undefined) {
          rendered = '';
        } else if (React.isValidElement(rawValue)) {
          rendered = rawValue;
        } else {
          rendered = safeStringify(rawValue);
        }

        return (
          <div
            key={column.key}
            className={`virtual-table-cell ${column.cellClassName || ''}`}
            style={{ width: getColumnWidth(column) === 'auto' ? undefined : getColumnWidth(column) }} // Dynamic column width for virtualization - cannot be moved to CSS
          >
            {rendered}
          </div>
        );
      });
    },
    [columns, getColumnWidth, safeStringify],
  );

  const totalWidth = useMemo(() => {
    return columns.reduce((total, column) => {
      const width = getColumnWidth(column);
      return total + (typeof width === 'number' ? width : 150);
    }, 0);
  }, [columns, getColumnWidth]);

  if (loading) {
    return (
      <div className={`virtual-table ${className}`}>
        <div className={`virtual-table-header ${headerClassName}`}>
          {columns.map((column) => (
            <div
              key={column.key}
              className={`virtual-table-header-cell ${column.headerClassName || ''}`}
              style={{ width: getColumnWidth(column) === 'auto' ? undefined : getColumnWidth(column) }} // Dynamic column width for virtualization - cannot be moved to CSS
            >
              <div className="skeleton h-4 w-20" />
            </div>
          ))}
        </div>
        <div
          className="virtual-table-body"
          style={{ height }} // Dynamic height for virtualization - cannot be moved to CSS
        >
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="virtual-table-row">
              {columns.map((column) => (
                <div
                  key={column.key}
                  className={`virtual-table-cell ${column.cellClassName || ''}`}
                  style={{ width: getColumnWidth(column) === 'auto' ? undefined : getColumnWidth(column) }} // Dynamic column width for virtualization - cannot be moved to CSS
                >
                  <div className="skeleton h-4 w-16" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={`virtual-table ${className}`}>
        <div className={`virtual-table-header ${headerClassName}`}>
          {columns.map((column) => (
            <div
              key={column.key}
              className={`virtual-table-header-cell ${column.headerClassName || ''}`}
              style={{ width: getColumnWidth(column) === 'auto' ? undefined : getColumnWidth(column) }} // Dynamic column width for virtualization - cannot be moved to CSS
            >
              {column.header}
            </div>
          ))}
        </div>
        <div
          className="virtual-table-body"
          style={{ height }} // Dynamic height for virtualization - cannot be moved to CSS
        >
          <div className="virtual-table-empty">{emptyMessage}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`virtual-table ${className}`}>
      <div
        className={`virtual-table-header ${headerClassName} ${stickyHeader ? 'sticky' : ''}`}
        style={{ width: totalWidth }} // Dynamic total width for virtualization - cannot be moved to CSS
      >
        {columns.map((column) => (
          <button
            key={column.key}
            type="button"
            className={`virtual-table-header-cell ${column.headerClassName || ''} ${column.sortable ? 'sortable' : ''}`}
            style={{
              width: getColumnWidth(column) === 'auto' ? undefined : getColumnWidth(column),
              ['--col-width' as unknown as string]:
                getColumnWidth(column) === 'auto' ? 'auto' : `${getColumnWidth(column)}px`,
            }} // Dynamic column width and CSS variables for virtualization - cannot be moved to CSS
            onClick={() => column.sortable && handleSort(column.key)}
            aria-sort={
              column.sortable && sortBy === column.key
                ? sortDirection === 'asc'
                  ? 'ascending'
                  : 'descending'
                : undefined
            }
            disabled={!column.sortable}
          >
            <div className="virtual-table-header-content">
              <span>{column.header}</span>
              {column.sortable && (
                <div className="virtual-table-sort-icons" aria-hidden="true">
                  <ChevronUp
                    className={`virtual-table-sort-icon ${sortBy === column.key && sortDirection === 'asc' ? 'active' : ''}`}
                  />
                  <ChevronDown
                    className={`virtual-table-sort-icon ${sortBy === column.key && sortDirection === 'desc' ? 'active' : ''}`}
                  />
                </div>
              )}
            </div>
            {column.resizable && (
              <button
                type="button"
                className={`virtual-table-resize-handle ${isResizing === column.key ? 'resizing' : ''}`}
                aria-label={`Resize ${column.header} column`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleResizeStart(column.key);

                  const startX = e.clientX;
                  const startWidth = typeof getColumnWidth(column) === 'number' ? getColumnWidth(column) : 150;

                  const handleMouseMove = (e: MouseEvent) => {
                    const newWidth = Number(startWidth) + (e.clientX - startX);
                    handleColumnResize(column.key, Math.max(50, newWidth));
                  };

                  const handleMouseUp = () => {
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                    handleResizeEnd();
                  };

                  document.addEventListener('mousemove', handleMouseMove);
                  document.addEventListener('mouseup', handleMouseUp);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    // Toggle resize mode or provide alternative interaction
                  }
                }}
              >
                <GripVertical className="virtual-table-resize-icon" aria-hidden="true" />
              </button>
            )}
          </button>
        ))}
      </div>

      <div
        ref={containerRef}
        className={`virtual-table-body ${bodyClassName}`}
        style={{ height, overflow: 'auto' }} // Dynamic height for virtualization - cannot be moved to CSS
      >
        <div
          className="virtual-table-virtual-container"
          style={{
            height: rowVirtualizer.getTotalSize(),
            width: totalWidth,
            position: 'relative',
          }} // Dynamic dimensions for virtual scrolling - cannot be moved to CSS
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const row = data[virtualRow.index];
            const rowClass = getRowClassName(row, virtualRow.index);

            return onRowClick ? (
              <button
                key={virtualRow.key}
                type="button"
                className={rowClass}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                  display: 'flex',
                  border: 'none',
                  background: 'transparent',
                  padding: 0,
                  cursor: 'pointer',
                }} // Dynamic positioning for virtual scrolling - cannot be moved to CSS
                onClick={() => onRowClick(row, virtualRow.index)}
                aria-label={`Row ${virtualRow.index + 1}`}
              >
                {renderRowCells(row)}
              </button>
            ) : (
              <div
                key={virtualRow.key}
                className={rowClass}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                  display: 'flex',
                }} // Dynamic positioning for virtual scrolling - cannot be moved to CSS
              >
                {renderRowCells(row)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default VirtualDataTable;
