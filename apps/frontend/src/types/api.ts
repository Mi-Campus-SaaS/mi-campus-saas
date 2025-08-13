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
};


