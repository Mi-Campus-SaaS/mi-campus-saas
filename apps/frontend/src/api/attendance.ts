import { api } from './client';

export type AttendanceRecordInput = {
  studentId: string;
  present: boolean;
  date: string;
};

export async function submitClassAttendance(classId: string, records: AttendanceRecordInput[]): Promise<void> {
  await api.post(`/classes/${classId}/attendance`, { records });
}

export async function submitSessionAttendance(
  classId: string,
  sessionId: string,
  records: AttendanceRecordInput[],
): Promise<void> {
  await api.post(`/classes/${classId}/sessions/${sessionId}/attendance`, { records });
}
