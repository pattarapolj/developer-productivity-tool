# Deployment Guide

This guide covers deploying the Developer Productivity Tool to production environments, from single-user SQLite setups to scalable multi-user PostgreSQL deployments.

## Table of Contents

- [Deployment Options](#deployment-options)
- [SQLite (Single-User/Development)](#sqlite-single-userdevelopment)
- [PostgreSQL (Production/Multi-User)](#postgresql-productionmulti-user)
- [Environment Variables](#environment-variables)
- [Hosting Platforms](#hosting-platforms)
- [Database Connection Pooling](#database-connection-pooling)
- [Backup & Recovery](#backup--recovery)
- [Production Readiness Checklist](#production-readiness-checklist)
- [Troubleshooting](#troubleshooting)

---

## Deployment Options

| Option | Use Case | Scalability | Cost | Complexity |
|--------|----------|-----------|------|-----------|
| **SQLite (Local)** | Single user, development | None | $0 | Low |
| **SQLite (File Storage)** | Team sharing via file sync | Limited | $0-50/mo | Medium |
| **SQLite + Vercel** | Small teams, hobby projects | Limited | $0-20/mo | Low-Medium |
| **PostgreSQL + Vercel** | Small-medium teams | Good | $20-40/mo | Medium |
| **PostgreSQL + Railway** | Growing teams | Excellent | $10-100+/mo | Medium |
| **PostgreSQL + Digital Ocean** | Full control required | Excellent | $15-200+/mo | High |

---

## SQLite (Single-User/Development)

### Setup

SQLite is the default database for local development:

```bash
# Initialize SQLite database
pnpm db:push

# Verify database exists
ls -la prisma/dev.db
```

### Characteristics

- ✅ Zero setup required
- ✅ Stores in `prisma/dev.db` (SQLite file)
- ✅ Perfect for single user, local machine
- ⚠️ Not suitable for multiple users or remote access
- ⚠️ Not suitable for high concurrency

### Backup & Restore

```bash
# Backup
cp prisma/dev.db prisma/dev.db.backup

# Restore
cp prisma/dev.db.backup prisma/dev.db
```

### Shared Team Setup (Via File Sync)

For small teams sharing via Dropbox/Google Drive/OneDrive:

```bash
# Move database to shared folder
mv prisma/dev.db /path/to/shared/folder/dev.db

# Create symlink
ln -s /path/to/shared/folder/dev.db prisma/dev.db

# On other computers, create same symlink
ln -s /path/to/shared/folder/dev.db prisma/dev.db
```

**⚠️ Warning**: This approach has **no locking** - concurrent edits can corrupt data. Use only for teams where one person edits at a time.

---

## PostgreSQL (Production/Multi-User)

### Migration from SQLite

If you have existing SQLite data and need to migrate to PostgreSQL:

#### Step 1: Export Data from SQLite

```bash
# Backup SQLite database
cp prisma/dev.db prisma/dev.db.backup

# Export to JSON
pnpm exec prisma db execute --stdin <<EOF
SELECT json_object(
  'projects', (SELECT json_group_array(json_object('id', id, 'name', name)) FROM Project),
  'tasks', (SELECT json_group_array(json_object('id', id, 'title', title)) FROM Task)
) as data
EOF
```

#### Step 2: Set Up PostgreSQL Database

```bash
# Create PostgreSQL database
createdb productivity_tracker

# Set connection string
export DATABASE_URL="postgresql://user:password@localhost:5432/productivity_tracker"
```

#### Step 3: Update Prisma Schema

Edit `prisma/schema.prisma`:

```prisma
// CHANGE FROM:
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// CHANGE TO:
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

#### Step 4: Migrate Schema & Data

```bash
# Apply schema to PostgreSQL
pnpm db:push

# For large datasets, consider using pg_dump for data migration
pg_dump -h source_host -U source_user source_db | psql -h target_host -U target_user target_db
```

### PostgreSQL Setup

#### Local PostgreSQL

```bash
# Install PostgreSQL
# macOS: brew install postgresql
# Linux: apt-get install postgresql
# Windows: Download from https://www.postgresql.org/download/windows/

# Start PostgreSQL service
# macOS: brew services start postgresql
# Linux: sudo systemctl start postgresql
# Windows: Use Services manager

# Create database
createdb productivity_tracker

# Create user with password
psql postgres -c "CREATE USER prod_user WITH PASSWORD 'securepassword123';"
psql postgres -c "ALTER USER prod_user CREATEDB;"
psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE productivity_tracker TO prod_user;"

# Set environment variable
export DATABASE_URL="postgresql://prod_user:securepassword123@localhost:5432/productivity_tracker"

# Apply migrations
pnpm db:push
```

#### Connection String Format

```
postgresql://[user[:password]@][netloc][:port][/dbname][?param1=value1&...]

Examples:
postgresql://user:password@localhost:5432/mydb
postgresql://postgres:password@db.example.com:5432/prod_db
postgresql://user@supabase.co/db?sslmode=require
```

---

## Environment Variables

### Required Variables

Create a `.env.local` file in the project root:

```bash
# Database connection (required for production)
DATABASE_URL="postgresql://user:password@host:5432/database"

# Next.js configuration
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-domain.com

# Optional: Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your-analytics-id
```

### Optional Variables

```bash
# Email notifications (future feature)
SMTP_FROM=noreply@example.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Sentry error tracking
SENTRY_DSN=https://your-sentry-dsn

# Feature flags
NEXT_PUBLIC_ENABLE_SSO=false
NEXT_PUBLIC_ENABLE_TEAMS=false
```

### Development vs Production

**.env.local (Development)**
```bash
DATABASE_URL="sqlite://:memory:"
NODE_ENV=development
```

**.env.production (Production)**
```bash
DATABASE_URL="postgresql://user:pass@db.example.com:5432/db"
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://app.example.com
```

---

## Hosting Platforms

### Vercel + Neon Database (Recommended for Small Teams)

**Features**: Easy deployment, serverless PostgreSQL, free tier available

```bash
# 1. Push to GitHub
git push origin main

# 2. Connect to Vercel
# Go to https://vercel.com/new → Import Git repo

# 3. Set environment variables in Vercel dashboard
# Project Settings → Environment Variables
DATABASE_URL=postgresql://user:pass@[neon-endpoint]

# 4. Deploy
# Automatic on every push to main
```

**Neon Setup:**
- Sign up at https://neon.tech
- Create new project
- Copy connection string to DATABASE_URL
- Database auto-scales, $5/month for typical usage

### Railway (Great Alternative)

**Features**: Simple UI, PostgreSQL included, GitHub auto-deploy

```bash
# 1. Sign up at https://railway.app
# 2. Create new project
# 3. Add PostgreSQL plugin
# 4. Connect GitHub repo
# 5. Set DATABASE_URL from Railway dashboard
# 6. Deploy automatic on push
```

**Pricing**: $5/month free plan, ~$20/month for production workloads

### Self-Hosted (Digital Ocean, AWS, DigitalOcean)

```bash
# 1. Create VPS (Ubuntu 22.04 recommended)
# 2. Install Docker and Docker Compose
# 3. Create docker-compose.yml:

version: '3.8'
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: productivity_tracker
      POSTGRES_USER: prod_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
  
  app:
    build: .
    environment:
      DATABASE_URL: postgresql://prod_user:${DB_PASSWORD}@postgres:5432/productivity_tracker
      NODE_ENV: production
    ports:
      - "3000:3000"
    depends_on:
      - postgres

volumes:
  postgres_data:

# 4. Deploy
docker-compose up -d

# 5. Run migrations
docker-compose exec app pnpm db:push
```

---

## Database Connection Pooling

For production deployments, use connection pooling to handle multiple concurrent connections efficiently.

### PgBouncer (Production Standard)

```bash
# Install PgBouncer
apt-get install pgbouncer

# Edit /etc/pgbouncer/pgbouncer.ini
[databases]
productivity_tracker = host=db.example.com port=5432 user=prod_user password=securepass

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
min_pool_size = 10

# Update DATABASE_URL
DATABASE_URL="postgresql://user:pass@pgbouncer_host:6432/productivity_tracker"

# Start PgBouncer
service pgbouncer start
```

### Prisma Connection Pooling

Update `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  
  // Connection pooling settings
  // Works with PgBouncer or Neon's built-in pooling
}
```

### Neon Connection Pooling (Easiest)

Neon provides built-in pooling. Use the pooling connection string:

```bash
# Regular connection (not pooled)
DATABASE_URL="postgresql://user:pass@ep-XXX.use2.aws.neon.tech/dbname"

# Pooling connection string (use this for serverless)
DATABASE_URL="postgresql://user:pass@ep-XXX.use2.aws.neon.tech/dbname?pgbouncer=true"
```

---

## Backup & Recovery

### Automated Backups (PostgreSQL)

**pg_dump-based backup:**

```bash
#!/bin/bash
# backup.sh

DB_NAME="productivity_tracker"
DB_USER="prod_user"
DB_HOST="db.example.com"
BACKUP_DIR="/backups/productivity"
DATE=$(date -I)

mkdir -p $BACKUP_DIR

pg_dump \
  -h $DB_HOST \
  -U $DB_USER \
  -d $DB_NAME \
  > $BACKUP_DIR/backup_$DATE.sql

# Compress
gzip $BACKUP_DIR/backup_$DATE.sql

# Keep only last 30 days
find $BACKUP_DIR -mtime +30 -delete

echo "Backup completed: $BACKUP_DIR/backup_$DATE.sql.gz"
```

**Set up cron job:**

```bash
# Monthly backups at 2 AM
0 2 1 * * /path/to/backup.sh

# Weekly backups
0 2 * * 0 /path/to/backup.sh
```

### Point-in-Time Recovery

PostgreSQL WAL (Write-Ahead Logging) enables recovery to specific timestamps:

```bash
# Restore to specific time
pg_restore -d productivity_tracker /backups/productivity/backup_2026-02-08.sql.gz
```

### S3 Backup (AWS)

```bash
#!/bin/bash
# s3-backup.sh

pg_dump -h $DB_HOST -U $DB_USER $DB_NAME | \
  gzip | \
  aws s3 cp - s3://my-backups/productivity_tracker_$(date -I).sql.gz

# List backups
aws s3 ls s3://my-backups/ --recursive

# Restore from S3
aws s3 cp s3://my-backups/backup_2026-02-08.sql.gz - | \
  gunzip | \
  psql -h $DB_HOST -U $DB_USER -d $DB_NAME
```

---

## Production Readiness Checklist

- [ ] **Database**
  - [ ] PostgreSQL (not SQLite) in production
  - [ ] Daily automated backups configured
  - [ ] Backup tested (restore from backup works)
  - [ ] Connection pooling configured
  - [ ] SSL/TLS enabled for connections
  - [ ] Database user has minimal required permissions

- [ ] **Environment**
  - [ ] `.env.local` never committed to git
  - [ ] `DATABASE_URL` set in production environment
  - [ ] `NODE_ENV=production`
  - [ ] All required env variables documented

- [ ] **Security**
  - [ ] HTTPS enabled on all endpoints
  - [ ] Strong database password (16+ chars, mixed case, numbers, symbols)
  - [ ] Database firewall restricts access to app only
  - [ ] API endpoints authenticated (prepare for Phase 7)
  - [ ] No credentials in code/git history
  - [ ] Regular security updates for dependencies

- [ ] **Performance**
  - [ ] Build succeeds: `pnpm build`
  - [ ] No console errors in production
  - [ ] Database queries optimized (check slow query logs)
  - [ ] Connection pooling active
  - [ ] CDN configured for static assets
  - [ ] Monitoring/alerting configured

- [ ] **Testing**
  - [ ] E2E tests pass: `pnpm exec playwright test`
  - [ ] Unit tests pass: `pnpm test:run`
  - [ ] Production data migrated successfully
  - [ ] Rollback plan documented

- [ ] **Monitoring & Logs**
  - [ ] Application error logging configured
  - [ ] Database slow query logging enabled
  - [ ] Disk space monitoring active
  - [ ] Backup success verification automated
  - [ ] Alert notifications configured

- [ ] **Documentation**
  - [ ] Deployment process documented
  - [ ] Emergency contacts listed
  - [ ] Recovery procedures tested
  - [ ] Team trained on deployment

---

## Troubleshooting

### Connection Issues

**Error: "ECONNREFUSED - Connection refused"**
```bash
# Verify database is running
psql -h localhost -U prod_user -d productivity_tracker

# Check DATABASE_URL is correct
echo $DATABASE_URL

# Verify firewall allows connection
telnet db.example.com 5432
```

### Performance Issues

**Slow Queries:**
```bash
# Enable slow query logging (PostgreSQL)
ALTER SYSTEM SET log_min_duration_statement = 1000; -- log queries > 1 second
SELECT pg_reload_conf();

# Check logs
SELECT * FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;
```

**High Memory Usage:**
- Increase `max_connections` in PostgreSQL config if needed
- Use connection pooling (PgBouncer)
- Monitor with `EXPLAIN ANALYZE` for problematic queries

### Migration Issues

**Stuck migrations:**
```bash
# Reset Prisma migrations (development only!)
rm -rf prisma/migrations
pnpm db:push --force-reset

# Create new migration
pnpm exec prisma migrate dev --name add_feature
```

**Data loss protection:**
```bash
# Always backup before major changes
pg_dump $DATABASE_URL > backup_before_migration.sql

# Run migrations in transaction
psql -f migration.sql --set ON_ERROR_STOP=on
```

### Backup Restore Issues

```bash
# Restore from backup
psql -U prod_user -d productivity_tracker < backup.sql

# If database locked, terminate connections
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'productivity_tracker';

# Restore again
psql -U prod_user -d productivity_tracker < backup.sql
```

---

## Next Steps

1. **Choose hosting platform** from options above
2. **Set up PostgreSQL** database
3. **Configure environment variables**
4. **Run database migrations** with `pnpm db:push`
5. **Test full workflow** locally with production database
6. **Deploy** following platform-specific instructions
7. **Monitor** database and application health
8. **Set up automated backups** immediately after deployment

For multi-user deployments and SSO integration, see [MULTI_USER_SSO.md](MULTI_USER_SSO.md).
