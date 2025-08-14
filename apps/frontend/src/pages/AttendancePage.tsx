import React from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { listStudents } from '../api/students'
import { submitSessionAttendance, type AttendanceRecordInput } from '../api/attendance'
import { queryClient } from '../queryClient'
import { queryKeys } from '../api/queryKeys'

const AttendancePage: React.FC = () => {
  const { classId = '', sessionId = '' } = useParams()
  const today = React.useMemo(() => new Date().toISOString().slice(0, 10), [])
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
  const [present, setPresent] = React.useState(true)
  const studentsQ = useQuery({ queryKey: queryKeys.students.list({ page: 1 }), queryFn: () => listStudents({ page: 1 }) })

  const mutation = useMutation({
    mutationFn: async (records: AttendanceRecordInput[]) => submitSessionAttendance(classId, sessionId, records),
    onMutate: async (records) => {
      // Optimistic update: we could update a session-specific cache key if exists
      await queryClient.cancelQueries()
      return { records }
    },
    onError: () => {
      // Nothing specific; global error handler will toast
    },
    onSettled: () => {
      queryClient.invalidateQueries()
    },
  })

  const toggleId = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const bulkMark = () => {
    if (selectedIds.size === 0) return
    const records: AttendanceRecordInput[] = Array.from(selectedIds).map((studentId) => ({
      studentId,
      present,
      date: today,
    }))
    // Optimistic UI by immediate cache effect (no specific list, so noop) and manual UI feedback
    mutation.mutate(records)
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Attendance</h1>
      <div className="mb-3 flex items-center gap-2">
        <button
          className="px-3 py-1 border rounded"
          onClick={() => setSelectedIds(new Set((studentsQ.data?.data ?? []).map((s) => s.id)))}
        >
          Select all
        </button>
        <button className="px-3 py-1 border rounded" onClick={() => setSelectedIds(new Set())}>Clear</button>
        <select aria-label="Mark as" className="border rounded px-2 py-1" value={present ? 'present' : 'absent'} onChange={(e) => setPresent(e.target.value === 'present')}>
          <option value="present">Present</option>
          <option value="absent">Absent</option>
        </select>
        <button
          className="px-3 py-1 border rounded disabled:opacity-50"
          disabled={selectedIds.size === 0 || mutation.isPending}
          onClick={bulkMark}
        >
          {mutation.isPending ? 'Saving...' : 'Mark selected'}
        </button>
      </div>

      <ul className="space-y-2">
        {(studentsQ.data?.data ?? []).map((s) => (
          <li key={s.id} className="border p-3 rounded flex items-center gap-3">
            <label className="flex items-center gap-3">
              <input aria-label={`Select ${s.firstName} ${s.lastName}`} type="checkbox" checked={selectedIds.has(s.id)} onChange={() => toggleId(s.id)} />
              <span>
                {s.firstName} {s.lastName}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default AttendancePage


