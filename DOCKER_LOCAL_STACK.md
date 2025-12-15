# Local Docker stack (Postgres + Redis + MinIO)

This repo’s `docker-compose.yml` can bring up a local infrastructure stack in one command.

## One-command up

```bash
docker-compose up -d
```

Included services:

- **PostgreSQL**: `localhost:5432`
- **Redis**: `localhost:6379`
- **MinIO (S3-compatible)**:
  - API: `localhost:9000`
  - Console: `localhost:9001`

MinIO bucket initialization runs automatically via `minio-init` and creates `materials` by default (override with `S3_BUCKET`).

## Backend: use MinIO for uploads (S3 mode)

The backend supports local filesystem uploads or S3-compatible storage.

Set these env vars in `apps/backend/.env`:

```bash
STORAGE_MODE=s3
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_BUCKET=materials
S3_ACCESS_KEY_ID=minio
S3_SECRET_ACCESS_KEY=minio123456
S3_FORCE_PATH_STYLE=true
```

If you override MinIO credentials, also set:

```bash
MINIO_ROOT_USER=...
MINIO_ROOT_PASSWORD=...
```

## Tear down

```bash
docker-compose down
```
