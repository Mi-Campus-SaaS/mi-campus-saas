import { api } from './client';
import type { Announcement, Paginated } from '../types/api';

export type CreateAnnouncementInput = {
  content: string;
  publishAt?: string;
  classId?: string;
};

export type UpdateAnnouncementInput = Partial<CreateAnnouncementInput>;

export async function listAnnouncements(): Promise<Announcement[]> {
  const res = await api.get<Paginated<Announcement>>('/announcements', {
    params: { page: 1, limit: 100, sortDir: 'desc' },
  });
  return res.data.data;
}

export async function createAnnouncement(input: CreateAnnouncementInput): Promise<Announcement> {
  const res = await api.post<Announcement>('/announcements', input);
  return res.data;
}

export async function updateAnnouncement(id: string, input: UpdateAnnouncementInput): Promise<Announcement> {
  const res = await api.patch<Announcement>(`/announcements/${id}`, input);
  return res.data;
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await api.delete(`/announcements/${id}`);
}
