import React from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { listStudents } from '../api/students';
import { submitSessionAttendance, type AttendanceRecordInput } from '../api/attendance';
import { queryClient } from '../queryClient';
import { queryKeys } from '../api/queryKeys';
import { ClipboardCheck } from 'lucide-react';

const AttendancePage: React.FC = () => {
  const { classId = '', sessionId = '' } = useParams();
  const { t } = useTranslation();
  const today = React.useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [present, setPresent] = React.useState(true);
  const studentsQ = useQuery({
    queryKey: queryKeys.students.list({ page: 1 }),
    queryFn: () => listStudents({ page: 1 }),
  });

  const mutation = useMutation({
    mutationFn: async (records: AttendanceRecordInput[]) => submitSessionAttendance(classId, sessionId, records),
    onMutate: async (records) => {
      await queryClient.cancelQueries();
      return { records };
    },
    onError: () => {
      // Nothing specific; global error handler will toast
    },
    onSettled: () => {
      queryClient.invalidateQueries();
    },
  });

  const toggleId = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const bulkMark = () => {
    if (selectedIds.size === 0) return;
    const records: AttendanceRecordInput[] = Array.from(selectedIds).map((studentId) => ({
      studentId,
      present,
      date: today,
    }));
    mutation.mutate(records);
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <ClipboardCheck className="w-6 h-6" style={{ color: 'var(--fg)' }} />
        <h1 className="text-xl font-semibold" style={{ color: 'var(--fg)' }}>
          {t('attendance')}
        </h1>
      </div>

      <div className="card rounded-lg shadow-sm p-4 mb-4">
        <div className="flex items-center gap-3">
          <button
            className="px-3 py-1 border rounded"
            style={{
              borderColor: 'var(--card-border)',
              color: 'var(--muted)',
              backgroundColor: 'var(--hover-bg)',
            }}
            onClick={() => setSelectedIds(new Set((studentsQ.data?.data ?? []).map((s) => s.id)))}
          >
            {t('select_all')}
          </button>
          <button
            className="px-3 py-1 border rounded"
            style={{
              borderColor: 'var(--card-border)',
              color: 'var(--muted)',
              backgroundColor: 'var(--hover-bg)',
            }}
            onClick={() => setSelectedIds(new Set())}
          >
            {t('clear')}
          </button>
          <select
            aria-label={t('mark_as')}
            className="border rounded px-3 py-1"
            style={{
              borderColor: 'var(--card-border)',
              backgroundColor: 'var(--card-bg)',
              color: 'var(--fg)',
            }}
            value={present ? 'present' : 'absent'}
            onChange={(e) => setPresent(e.target.value === 'present')}
          >
            <option value="present">{t('present')}</option>
            <option value="absent">{t('absent')}</option>
          </select>
          <button
            className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              borderColor: 'var(--card-border)',
              backgroundColor: 'var(--hover-bg)',
            }}
            disabled={selectedIds.size === 0 || mutation.isPending}
            onClick={bulkMark}
          >
            {mutation.isPending ? t('saving') : t('mark_selected')}
          </button>
        </div>
      </div>

      {studentsQ.isError && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-red-700 dark:text-red-400">{t('error_loading')}</span>
            <button
              className="px-3 py-1 border border-red-300 dark:border-red-600 rounded text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
              onClick={() => studentsQ.refetch()}
            >
              {t('retry')}
            </button>
          </div>
        </div>
      )}

      <div className="card rounded-lg shadow-sm">
        <div className="p-4 border-b" style={{ borderColor: 'var(--card-border)' }}>
          <h2 className="text-lg font-medium" style={{ color: 'var(--fg)' }}>
            {t('students')}
          </h2>
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--card-border)' }}>
          {(studentsQ.data?.data ?? []).map((s) => (
            <div
              key={s.id}
              className="p-4 flex items-center gap-3 transition-colors"
              style={{ backgroundColor: 'var(--hover-bg)' }}
            >
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  aria-label={t('select_name', { name: `${s.firstName} ${s.lastName}` })}
                  type="checkbox"
                  checked={selectedIds.has(s.id)}
                  onChange={() => toggleId(s.id)}
                  style={{ borderColor: 'var(--card-border)' }}
                />
                <span style={{ color: 'var(--fg)' }}>
                  {s.firstName} {s.lastName}
                </span>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;
