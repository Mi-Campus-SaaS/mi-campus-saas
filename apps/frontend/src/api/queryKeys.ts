type Primitive = string | number | boolean | null | undefined;
type SerializableParams = Record<string, Primitive>;

function normalizeParams<T extends SerializableParams>(params: T): SerializableParams {
  const sortedEntries = Object.entries(params).sort(([a], [b]) => a.localeCompare(b));
  return Object.fromEntries(sortedEntries) as SerializableParams;
}

export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },

  users: {
    all: ['users'] as const,
    list: (params: { page: number; q?: string }) => ['users', 'list', normalizeParams(params)] as const,
    detail: (id: string) => ['users', 'detail', id] as const,
  },

  students: {
    all: ['students'] as const,
    list: (params: { page: number; q?: string }) => ['students', 'list', normalizeParams(params)] as const,
    detail: (id: string) => ['students', 'detail', id] as const,
  },

  teachers: {
    all: ['teachers'] as const,
    list: (params: { page: number; q?: string }) => ['teachers', 'list', normalizeParams(params)] as const,
    detail: (id: string) => ['teachers', 'detail', id] as const,
  },

  classes: {
    all: ['classes'] as const,
    list: (params: { page: number; grade?: string }) => ['classes', 'list', normalizeParams(params)] as const,
    detail: (id: string) => ['classes', 'detail', id] as const,
  },

  grades: {
    all: ['grades'] as const,
    student: (studentId: string) => ['grades', 'student', studentId] as const,
    class: (classId: string) => ['grades', 'class', classId] as const,
  },

  attendance: {
    all: ['attendance'] as const,
    student: (studentId: string) => ['attendance', 'student', studentId] as const,
    class: (classId: string) => ['attendance', 'class', classId] as const,
  },

  materials: {
    all: ['materials'] as const,
    class: (classId: string) => ['materials', 'class', classId] as const,
    detail: (id: string) => ['materials', 'detail', id] as const,
  },

  announcements: {
    all: ['announcements'] as const,
    list: (params: { page: number }) => ['announcements', 'list', normalizeParams(params)] as const,
    detail: (id: string) => ['announcements', 'detail', id] as const,
  },

  finance: {
    invoices: {
      all: ['finance', 'invoices'] as const,
      list: (params: { page: number; status?: 'paid' | 'unpaid' }) =>
        ['finance', 'invoices', 'list', normalizeParams(params)] as const,
      detail: (id: string) => ['finance', 'invoices', 'detail', id] as const,
    },
  },

  schedule: {
    all: ['schedule'] as const,
    class: (classId: string) => ['schedule', 'class', classId] as const,
    teacher: (teacherId: string) => ['schedule', 'teacher', teacherId] as const,
  },
} as const;

export type QueryKeys = typeof queryKeys;

