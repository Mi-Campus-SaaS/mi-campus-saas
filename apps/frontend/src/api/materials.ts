import { api } from './client';

export type ClassMaterial = {
  id: string;
  title: string;
  description?: string | null;
  filePath: string;
  url?: string | null;
  originalName?: string | null;
  mimeType?: string | null;
  size?: number | null;
  createdAt?: string | Date | null;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};

export async function listClassMaterials(classId: string): Promise<ClassMaterial[]> {
  const res = await api.get<PaginatedResponse<ClassMaterial>>(`/classes/${classId}/materials`);
  return res.data.data || [];
}

export async function uploadClassMaterial(
  classId: string,
  input: { title: string; description?: string; file: File },
): Promise<ClassMaterial> {
  const form = new FormData();
  form.append('title', input.title);
  if (input.description) form.append('description', input.description);
  form.append('file', input.file);
  const res = await api.post<ClassMaterial>(`/classes/${classId}/materials`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}
