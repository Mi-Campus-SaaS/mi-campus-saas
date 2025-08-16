/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bull';
import { AnnouncementsQueueService } from './announcements-queue.service';
import { Announcement } from './entities/announcement.entity';

describe('AnnouncementsQueueService', () => {
  let service: AnnouncementsQueueService;

  const mockQueue = {
    add: jest.fn(),
    getJobs: jest.fn(),
    clean: jest.fn(),
    getWaiting: jest.fn(),
    getActive: jest.fn(),
    getCompleted: jest.fn(),
    getFailed: jest.fn(),
    getDelayed: jest.fn(),
  };

  const mockAnnouncement: Announcement = {
    id: 'test-id',
    content: 'Test announcement',
    publishAt: new Date(Date.now() + 60000), // 1 minute from now
    createdAt: new Date(),
  } as Announcement;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnnouncementsQueueService,
        {
          provide: getQueueToken('announcements'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<AnnouncementsQueueService>(AnnouncementsQueueService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('scheduleAnnouncement', () => {
    it('should schedule an announcement for future publication', async () => {
      const mockJob = { id: 'job-1' } as any;
      mockQueue.add.mockResolvedValue(mockJob);

      const result = await service.scheduleAnnouncement(mockAnnouncement);

      expect(mockQueue.add).toHaveBeenCalledWith(
        'publish-scheduled',
        {
          announcementId: mockAnnouncement.id,
          publishAt: mockAnnouncement.publishAt,
        },
        expect.objectContaining({
          delay: expect.any(Number),
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        }),
      );
      expect(result).toBe(mockJob);
    });

    it('should publish immediately if publish time is in the past', async () => {
      const pastAnnouncement = {
        ...mockAnnouncement,
        publishAt: new Date(Date.now() - 60000), // 1 minute ago
      };

      const mockJob = { id: 'job-1' } as any;
      mockQueue.add.mockResolvedValue(mockJob);

      await service.scheduleAnnouncement(pastAnnouncement);

      expect(mockQueue.add).toHaveBeenCalledWith('publish-scheduled', {
        announcementId: pastAnnouncement.id,
        publishAt: pastAnnouncement.publishAt,
      });
    });
  });

  describe('cancelScheduledAnnouncement', () => {
    it('should cancel a scheduled announcement', async () => {
      const mockJob = {
        data: { announcementId: 'test-id' },
        remove: jest.fn(),
      };
      mockQueue.getJobs.mockResolvedValue([mockJob]);

      const result = await service.cancelScheduledAnnouncement('test-id');

      expect(mockJob.remove).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false if no job found', async () => {
      mockQueue.getJobs.mockResolvedValue([]);

      const result = await service.cancelScheduledAnnouncement('test-id');

      expect(result).toBe(false);
    });
  });

  describe('getQueueMetrics', () => {
    it('should return queue metrics', async () => {
      const mockJobs = {
        waiting: [{ id: 1 }, { id: 2 }],
        active: [{ id: 3 }],
        completed: [{ id: 4 }, { id: 5 }, { id: 6 }],
        failed: [{ id: 7 }],
        delayed: [{ id: 8 }],
      };

      mockQueue.getWaiting.mockResolvedValue(mockJobs.waiting);
      mockQueue.getActive.mockResolvedValue(mockJobs.active);
      mockQueue.getCompleted.mockResolvedValue(mockJobs.completed);
      mockQueue.getFailed.mockResolvedValue(mockJobs.failed);
      mockQueue.getDelayed.mockResolvedValue(mockJobs.delayed);

      const metrics = await service.getQueueMetrics();

      expect(metrics).toEqual({
        waiting: 2,
        active: 1,
        completed: 3,
        failed: 1,
        delayed: 1,
        total: 8,
      });
    });
  });

  describe('getJobStatus', () => {
    it('should return job status for existing job', async () => {
      const mockJob = {
        id: 'job-1',
        data: { announcementId: 'test-id' },
        getState: jest.fn().mockResolvedValue('waiting'),
        progress: jest.fn().mockReturnValue(0),
        attemptsMade: 0,
        timestamp: Date.now(),
      };
      mockQueue.getJobs.mockResolvedValue([mockJob]);

      const status = await service.getJobStatus('test-id');

      expect(status).toEqual({
        id: 'job-1',
        status: 'waiting',
        data: { announcementId: 'test-id' },
        progress: 0,
        attempts: 0,
        timestamp: expect.any(Number),
      });
    });

    it('should return not_found for non-existent job', async () => {
      mockQueue.getJobs.mockResolvedValue([]);

      const status = await service.getJobStatus('test-id');

      expect(status).toEqual({ status: 'not_found' });
    });
  });
});
