export type Announcement = {
  id: string;
  content: string;
  createdAt: string | Date;
  publishAt: string | Date;
  updatedAt?: string | Date | null;
  deletedAt?: string | Date | null;
};

export type Student = {
  id: string;
  firstName: string;
  lastName: string;
  gpa?: number;
  enrollmentStatus?: string;
  schoolLevel?: 'primary' | 'secondary';
  currentYear?: number;
  birthDate?: string;
  courses?: Course[];
  recentGrades?: Grade[];
};

export type Course = {
  id: string;
  subjectName: string;
  gradeLevel: string;
  teacher?: {
    firstName: string;
    lastName: string;
  };
};

export type Grade = {
  id: string;
  assignmentName: string;
  score: number;
  maxScore: number;
  date: string;
  courseName: string;
};

export type Paginated<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};
