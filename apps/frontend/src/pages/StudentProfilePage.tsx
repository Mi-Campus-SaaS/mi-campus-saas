import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getStudent } from '../api/students';
import { queryKeys } from '../api/queryKeys';
import { Skeleton } from '../components/Skeleton';
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const StudentProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const { studentId } = useParams<{ studentId: string }>();

  const {
    data: student,
    isLoading,
    isError,
  } = useQuery({
    queryKey: queryKeys.students.detail(studentId!),
    queryFn: () => getStudent(studentId!),
    enabled: !!studentId,
  });

  const getGpaTrend = () => {
    if (!student?.gpaTrend || student.gpaTrend.length < 2) return 'stable';
    const recent = student.gpaTrend.slice(-2);
    const diff = recent[1].gpa - recent[0].gpa;
    if (diff > 0.1) return 'up';
    if (diff < -0.1) return 'down';
    return 'stable';
  };

  const getTrendIcon = () => {
    const trend = getGpaTrend();
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <Skeleton className="w-32 h-8" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Skeleton className="w-full h-64" />
          </div>
          <div>
            <Skeleton className="w-full h-48" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !student) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-red-600 mb-4">{t('error_loading_student')}</h1>
          <Link to="../students" className="text-blue-600 hover:underline">
            {t('back_to_students')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link to="../students" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4">
          <ArrowLeft className="w-4 h-4" />
          {t('back_to_students')}
        </Link>
        <h1 className="text-2xl font-bold">
          {student.firstName} {student.lastName}
        </h1>
        {student.enrollmentStatus && <p className="muted mt-1">{student.enrollmentStatus}</p>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">{t('gpa_trend')}</h2>
            {student.gpaTrend.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm muted">{t('current_gpa')}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{student.currentGpa.toFixed(2)}</span>
                    {getTrendIcon()}
                  </div>
                </div>
                <div className="h-48 bg-gray-50 border border-gray-200 rounded-lg p-4 dark:bg-gray-700 dark:border-gray-600">
                  <div className="flex items-end justify-between h-full">
                    {student.gpaTrend.map((point, index) => (
                      <div key={`gpa-${point.date}-${index}`} className="flex flex-col items-center">
                        <div
                          className="bg-blue-500 rounded-t w-8 transition-all duration-200 hover:opacity-80"
                          style={{
                            height: `${Math.max((point.gpa / 4) * 100, 10)}%`,
                          }}
                        />
                        <span className="text-xs mt-1 muted">{formatDate(point.date)}</span>
                        <span className="text-xs font-medium">{point.gpa.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 muted">{t('no_gpa_data_available')}</div>
            )}
          </div>
        </div>

        <div>
          <div className="card rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">{t('student_info')}</h2>
            <div className="space-y-3">
              <div>
                <span className="text-sm muted">{t('student_id')}</span>
                <p className="font-mono text-sm">{student.id}</p>
              </div>
              <div>
                <span className="text-sm muted">{t('enrollment_date')}</span>
                <p>{formatDate(student.createdAt)}</p>
              </div>
              <div>
                <span className="text-sm muted">{t('last_updated')}</span>
                <p>{student.updatedAt ? formatDate(student.updatedAt) : t('not_available')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfilePage;
