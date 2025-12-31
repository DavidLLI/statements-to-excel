# Migration Guide: File System to Neon Database

This guide explains how to migrate from file-based storage to Neon Postgres database.

## What Changed

- **Storage**: Migrated from `data/jobs.json` file system storage to Neon Postgres database
- **No file storage**: Files are still processed in-memory and not stored (current behavior maintained)
- **Automatic schema**: Database schema is automatically created on first connection

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

This will install `@neondatabase/serverless` package.

### 2. Create Neon Database

1. Sign up at [https://neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string (it looks like: `postgresql://user:password@host.neon.tech/dbname?sslmode=require`)

### 3. Configure Environment Variables

Add to your `.env.local`:

```env
DATABASE_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require
```

### 4. Initialize Database Schema

The schema will be automatically created on first use. However, you can also manually initialize it:

```bash
npx tsx scripts/init-db.ts
```

### 5. Migrate Existing Data (Optional)

If you have existing data in `data/jobs.json`, you can migrate it:

```bash
# Create a migration script (optional)
# The app will work without migration - old data will just not be accessible
```

**Note**: The app will work immediately after setup. Old file-based data in `data/jobs.json` will not be automatically migrated, but new uploads will be stored in Neon.

## Database Schema

The `file_jobs` table has the following structure:

```sql
CREATE TABLE file_jobs (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  filename VARCHAR(500) NOT NULL,
  status VARCHAR(50) NOT NULL,
  result JSONB,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_file_jobs_user_id ON file_jobs(user_id);
CREATE INDEX idx_file_jobs_created_at ON file_jobs(created_at DESC);
```

## Vercel Deployment

1. Add `DATABASE_URL` to your Vercel environment variables
2. Deploy - the schema will be automatically created on first connection
3. No additional configuration needed

## Troubleshooting

### "DATABASE_URL environment variable is not set"

Make sure you've added `DATABASE_URL` to your `.env.local` file and restarted your dev server.

### "relation 'file_jobs' does not exist"

The schema will be automatically created on first use. If you see this error, wait a moment and try again, or manually run the init script.

### Connection Issues

- Ensure your Neon database is active (not paused)
- Check that the connection string is correct
- Verify SSL mode is set to `require` in the connection string

