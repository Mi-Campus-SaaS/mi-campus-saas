import React, { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { listStudents } from '../api/students';
import { useTranslation } from 'react-i18next';
import type { Student } from '../types/api';
import { FeatureGate, FeatureButton } from '../components/FeatureGate';
import { queryKeys } from '../api/queryKeys';
import { Plus, Edit, Users, Eye } from 'lucide-react';
import AdvancedDataTable from '../components/AdvancedDataTable';
import type { Column } from '../components/VirtualDataTable';
import styles from './StudentsPage.module.css';

type StudentWithExtras = Student & {
  gpa?: number;
  enrollmentStatus?: string;
  schoolLevel?: 'primary' | 'secondary';
  currentYear?: number;
  birthDate?: string;
};

const getGpaColor = (gpa: number): string => {
  if (gpa >= 3.5) return 'bg-green-500';
  if (gpa >= 3.0) return 'bg-yellow-500';
  if (gpa >= 2.0) return 'bg-orange-500';
  return 'bg-red-500';
};

const NameCell = ({ row }: { row: StudentWithExtras }) => (
  <div className="flex items-center justify-center w-full">
    <button
      onClick={() => (window.location.href = `./students/${row.id}`)}
      className="font-medium hover:text-blue-600 transition-colors"
    >
      {row.firstName} {row.lastName}
    </button>
  </div>
);

const BirthDateCell = ({ row }: { row: StudentWithExtras }) => (
  <div className="flex items-center justify-center w-full">
    <span className="text-sm">{row.birthDate ? new Date(row.birthDate).toLocaleDateString() : '-'}</span>
  </div>
);

const CurrentYearCell = ({ row, t }: { row: StudentWithExtras; t: (key: string) => string }) => (
  <div className="flex items-center justify-center w-full">
    <span className="text-sm font-medium">{row.currentYear ? `${t('year')} ${row.currentYear}` : '-'}</span>
  </div>
);

const SchoolLevelCell = ({ row, t }: { row: StudentWithExtras; t: (key: string) => string }) => {
  const getSchoolLevelColor = (level: string) => {
    if (level === 'primary') return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    if (level === 'secondary') return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  const getSchoolLevelText = (level: string) => {
    if (level === 'primary') return t('primary');
    if (level === 'secondary') return t('secondary');
    return '-';
  };

  return (
    <div className="flex items-center justify-center w-full">
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSchoolLevelColor(row.schoolLevel || '')}`}>
        {getSchoolLevelText(row.schoolLevel || '')}
      </span>
    </div>
  );
};

const EnrollmentStatusCell = ({ row }: { row: StudentWithExtras }) => {
  const getStatusColor = (status: string) => {
    if (status === 'Active') return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (status === 'Pending') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    if (status === 'Graduated') return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  return (
    <div className="flex items-center justify-center w-full">
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(row.enrollmentStatus || '')}`}>
        {row.enrollmentStatus || '-'}
      </span>
    </div>
  );
};

const GpaCell = ({ row }: { row: StudentWithExtras }) => (
  <div className="flex flex-col items-center gap-2 w-full">
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div
        className={`h-2 rounded-full ${getGpaColor(row.gpa || 0)}`}
        style={{ width: `${Math.min(((row.gpa || 0) / 4.0) * 100, 100)}%` }} // Dynamic width based on GPA value - cannot be moved to CSS
      />
    </div>
    <span className="font-mono text-sm font-medium">{typeof row.gpa === 'number' ? row.gpa.toFixed(2) : '-'}</span>
  </div>
);

const ActionsCell = ({ row, t }: { row: StudentWithExtras; t: (key: string) => string }) => (
  <div className="flex items-center justify-center gap-2 w-full">
    <FeatureGate feature="students.view">
      <FeatureButton
        feature="students.view"
        onClick={() => (window.location.href = `./students/${row.id}`)}
        variant="outline"
        size="sm"
        className="flex items-center gap-1"
      >
        <Eye className="w-3 h-3" />
        {t('view')}
      </FeatureButton>
    </FeatureGate>
    <FeatureGate feature="students.edit">
      <FeatureButton
        feature="students.edit"
        onClick={() => console.log('Edit student', row.id)}
        variant="outline"
        size="sm"
        className="flex items-center gap-1"
      >
        <Edit className="w-3 h-3" />
        {t('edit')}
      </FeatureButton>
    </FeatureGate>
  </div>
);

const CurrentYearCellWrapper = ({ row }: { row: StudentWithExtras }) => {
  const { t } = useTranslation();
  return <CurrentYearCell row={row} t={t} />;
};

const SchoolLevelCellWrapper = ({ row }: { row: StudentWithExtras }) => {
  const { t } = useTranslation();
  return <SchoolLevelCell row={row} t={t} />;
};

const ActionsCellWrapper = ({ row }: { row: StudentWithExtras }) => {
  const { t } = useTranslation();
  return <ActionsCell row={row} t={t} />;
};

const StudentsPage: React.FC = () => {
  const { t } = useTranslation();

  const { data, isLoading, isError, refetch } = useInfiniteQuery({
    queryKey: queryKeys.students.list({ page: 1 }),
    queryFn: async ({ pageParam = 1 }) => listStudents({ page: Number(pageParam), limit: 100 }),
    getNextPageParam: (lastPage) => {
      const totalPages = Math.ceil((lastPage.total ?? 0) / (lastPage.limit ?? 100)) || 1;
      const next = lastPage.page + 1;
      return next <= totalPages ? next : undefined;
    },
    initialPageParam: 1,
  });

  const flatRows = React.useMemo(() => (data?.pages ?? []).flatMap((p) => p.data ?? []), [data]);

  // Generate mock school year data for demonstration
  const enhancedStudents = useMemo(() => {
    return flatRows.map((student) => {
      // Generate realistic school level and year based on age simulation
      const isPrimary = Math.random() < 0.4; // 40% primary, 60% secondary
      const schoolLevel: 'primary' | 'secondary' = isPrimary ? 'primary' : 'secondary';
      const currentYear = Math.floor(Math.random() * 6) + 1; // 1-6 for both primary and secondary

      // Generate birth date based on school year (roughly 6 years old for primary year 1)
      const currentAge = isPrimary ? 6 + currentYear - 1 : 12 + currentYear - 1;
      const birthYear = new Date().getFullYear() - currentAge;
      const birthMonth = Math.floor(Math.random() * 12);
      const birthDay = Math.floor(Math.random() * 28) + 1;
      const birthDate = new Date(birthYear, birthMonth, birthDay).toISOString().split('T')[0];

      return {
        ...student,
        schoolLevel,
        currentYear,
        birthDate,
        enrollmentStatus: ['Active', 'Pending', 'Graduated'][Math.floor(Math.random() * 3)],
      };
    });
  }, [flatRows]);

  // Constants for repeated strings
  const CENTER_ALIGN = 'text-center';

  const columns: Column<
    Student & {
      gpa?: number;
      enrollmentStatus?: string;
      schoolLevel?: 'primary' | 'secondary';
      currentYear?: number;
      birthDate?: string;
    }
  >[] = [
    {
      key: 'id',
      header: t('student_id'),
      accessorKey: 'id',
      sortable: true,
      resizable: true,
      cellClassName: 'font-mono text-sm text-muted-foreground justify-center text-center',
      headerClassName: CENTER_ALIGN,
    },
    {
      key: 'name',
      header: t('name'),
      accessorFn: (row) => `${row.firstName} ${row.lastName}`,
      sortable: true,
      resizable: true,
      headerClassName: CENTER_ALIGN,
      cell: NameCell,
    },
    {
      key: 'birthDate',
      header: t('birth_date'),
      accessorKey: 'birthDate',
      sortable: true,
      resizable: true,
      headerClassName: CENTER_ALIGN,
      cell: BirthDateCell,
    },
    {
      key: 'currentYear',
      header: t('current_year'),
      accessorKey: 'currentYear',
      sortable: true,
      resizable: true,
      headerClassName: CENTER_ALIGN,
      cell: CurrentYearCellWrapper,
    },
    {
      key: 'schoolLevel',
      header: t('school_level'),
      accessorKey: 'schoolLevel',
      sortable: true,
      resizable: true,
      headerClassName: CENTER_ALIGN,
      cell: SchoolLevelCellWrapper,
    },
    {
      key: 'enrollmentStatus',
      header: t('enrollment_status'),
      accessorKey: 'enrollmentStatus',
      sortable: true,
      resizable: true,
      headerClassName: CENTER_ALIGN,
      cell: EnrollmentStatusCell,
    },
    {
      key: 'gpa',
      header: t('gpa'),
      accessorFn: (row) => row.gpa,
      sortable: true,
      resizable: true,
      headerClassName: CENTER_ALIGN,
      cell: GpaCell,
    },
    {
      key: 'actions',
      header: t('actions'),
      resizable: true,
      headerClassName: CENTER_ALIGN,
      cell: ActionsCellWrapper,
    },
  ];

  const handleRowClick = React.useCallback((row: Student & { gpa?: number }) => {
    window.location.href = `./students/${row.id}`;
  }, []);

  const handleExport = React.useCallback((data: (Student & { gpa?: number })[]) => {
    const csvContent = [
      ['Name', 'GPA', 'Student ID'].join(','),
      ...data.map((row) => [`"${row.firstName} ${row.lastName}"`, row.gpa?.toFixed(2) || '-', row.id].join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  if (isError) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Users className={`w-6 h-6 ${styles.icon}`} />
            <h1 className={`text-xl font-semibold ${styles.title}`}>{t('students')}</h1>
          </div>
        </div>
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
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className={`w-6 h-6 ${styles.icon}`} />
            <h1 className={`text-2xl font-bold ${styles.title}`}>{t('students')}</h1>
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
        <p className={`text-muted-foreground mt-2 ${styles.subtitle}`}>{t('students_management_subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <div className="card p-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="font-medium">{t('total_students')}</span>
          </div>
          <div className="text-2xl font-bold mt-1">{enhancedStudents.length.toLocaleString()}</div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="font-medium">{t('primary_students')}</span>
          </div>
          <div className="text-2xl font-bold mt-1">
            {enhancedStudents.filter((s) => s.schoolLevel === 'primary').length.toLocaleString()}
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span className="font-medium">{t('secondary_students')}</span>
          </div>
          <div className="text-2xl font-bold mt-1">
            {enhancedStudents.filter((s) => s.schoolLevel === 'secondary').length.toLocaleString()}
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="font-medium">{t('avg_gpa')}</span>
          </div>
          <div className="text-2xl font-bold mt-1">
            {enhancedStudents.length > 0
              ? (enhancedStudents.reduce((sum, s) => sum + (s.gpa || 0), 0) / enhancedStudents.length).toFixed(2)
              : '0.00'}
          </div>
        </div>
      </div>

      <AdvancedDataTable
        data={enhancedStudents}
        columns={columns}
        height={600}
        onRowClick={handleRowClick}
        onRefresh={refetch}
        onExport={handleExport}
        loading={isLoading}
        emptyMessage={t('no_students_found')}
        searchable={true}
        filterable={false}
        exportable={true}
        refreshable={true}
        searchPlaceholder={t('search_students')}
        stickyHeader={true}
      />
    </div>
  );
};

export default StudentsPage;
