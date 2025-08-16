# Announcements Background Jobs

This module implements background job processing for scheduled announcements using BullMQ and Redis.

## Features

- **Scheduled Publishing**: Announcements with future `publishAt` dates are automatically scheduled for publication
- **Retry Logic**: Failed jobs are retried with exponential backoff (3 attempts, 2s initial delay)
- **Job Management**: Queue metrics, job status tracking, and cleanup operations
- **Reliability**: Jobs persist across application restarts

## Architecture

### Components

- **`AnnouncementsProcessor`**: Handles job execution with retry logic
- **`AnnouncementsQueueService`**: Manages job scheduling and queue operations
- **`AnnouncementsSchedulerService`**: Reschedules existing announcements on startup

### Job Flow

1. **Creation**: When an announcement is created with a future `publishAt` date, it's automatically scheduled
2. **Execution**: At the scheduled time, the job processor publishes the announcement
3. **Retry**: Failed jobs are retried with exponential backoff
4. **Cleanup**: Completed/failed jobs are automatically cleaned up

## API Endpoints

### Queue Management (Admin only)

- `GET /api/announcements/queue/metrics` - Get queue statistics
- `DELETE /api/announcements/queue/completed` - Clear completed jobs
- `DELETE /api/announcements/queue/failed` - Clear failed jobs

### Job Status (Admin/Teacher)

- `GET /api/announcements/:id/queue/status` - Get job status for specific announcement

## Configuration

### Environment Variables

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

### Job Settings

- **Retry Attempts**: 3
- **Backoff Strategy**: Exponential (2s initial delay)
- **Job Cleanup**: 100 completed jobs, 50 failed jobs retained

## Monitoring

### Queue Metrics

```json
{
  "waiting": 5,
  "active": 1,
  "completed": 150,
  "failed": 2,
  "delayed": 3,
  "total": 161
}
```

### Job Status

```json
{
  "id": "job-123",
  "status": "waiting",
  "data": {
    "announcementId": "announcement-uuid",
    "publishAt": "2025-08-16T10:00:00.000Z"
  },
  "progress": 0,
  "attempts": 0,
  "timestamp": 1734345600000
}
```

## Testing

Run the queue service tests:

```bash
yarn test announcements-queue.service.spec.ts
```

## Dependencies

- `@nestjs/bull` - NestJS Bull integration
- `bullmq` - Job queue implementation
- `ioredis` - Redis client
- `bull` - Legacy Bull compatibility
