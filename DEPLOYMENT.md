# STECHA Deployment Guide

## Prerequisites

- Docker & Docker Compose
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Git

## Local Development Setup

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Run migrations
alembic upgrade head

# Start development server
uvicorn app.main:app --reload
```

Backend will be available at: `http://localhost:8000`

### Frontend Setup

```bash
cd web

# Install dependencies
npm install

# Create .env.local
cp .env.example .env.local

# Start development server
npm run dev
```

Frontend will be available at: `http://localhost:3000`

## Docker Deployment

### Using Docker Compose

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Run migrations
docker-compose exec backend alembic upgrade head

# Stop services
docker-compose down
```

Services available at:
- Backend: `http://localhost:8000`
- Frontend: `http://localhost:3000`
- PostgreSQL: `localhost:5432`

## Production Deployment

### Environment Variables

```bash
# Backend (.env)
ENV=production
DEBUG=False
AUTO_CREATE_SCHEMA=False
DATABASE_URL=postgresql://user:password@db:5432/stecha
JWT_SECRET=<change-to-secure-key-min-32-chars>
STRIPE_SECRET_KEY=sk_live_your_key
AI_PROVIDER=anthropic
AI_PROVIDER_API_KEY=<your-api-key>

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_STRIPE_KEY=pk_live_your_key
```

### Database Migrations

```bash
# Run in production
docker-compose exec backend alembic upgrade head
```

### Verification

```bash
# Check backend health
curl http://localhost:8000/api/v1/auth/me -H "Authorization: Bearer token"

# Check frontend
curl http://localhost:3000

# Check database
docker-compose exec db psql -U postgres -d stecha -c "SELECT COUNT(*) FROM users;"
```

## CI/CD Pipeline

GitHub Actions workflows automatically:

1. **Backend Tests** (backend-tests.yml)
   - Runs pytest suite
   - Checks coverage
   - Uploads to Codecov

2. **Frontend Build** (frontend-build.yml)
   - Runs linting
   - Type checks
   - Builds optimized bundle

3. **Security Checks** (security-checks.yml)
   - Trivy vulnerability scanning
   - TruffleHog secret scanning
   - npm audit & pip safety

4. **Health Checks** (health-checks.yml)
   - Database migrations
   - API routes verification
   - Build cache validation

## Scaling Considerations

### Backend
- Use PostgreSQL for production (not SQLite)
- Configure connection pooling
- Enable caching with Redis
- Use CDN for static assets

### Frontend
- Enable Next.js ISR (Incremental Static Regeneration)
- Optimize images with next/image
- Use lazy loading for routes

### Database
- Regular backups
- Replication for HA
- Connection pooling (pgBouncer)

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker-compose ps db

# Check logs
docker-compose logs db

# Verify credentials in .env
```

### API Connection Issues

```bash
# Check backend logs
docker-compose logs backend

# Verify JWT_SECRET length (min 32 chars)
# Verify DATABASE_URL is correct
```

### Frontend Build Issues

```bash
# Clear cache
npm run clean

# Rebuild
npm run build

# Check build output
ls -la .next/
```

## Backup & Recovery

```bash
# Backup database
docker-compose exec db pg_dump -U postgres stecha > backup.sql

# Restore database
cat backup.sql | docker-compose exec -T db psql -U postgres
```

## Performance Monitoring

- Monitor API response times
- Track database query performance
- Use APM tools (Sentry, New Relic)
- Monitor disk usage and memory

## Update Procedure

```bash
# 1. Pull latest changes
git pull origin main

# 2. Update dependencies
cd backend && pip install --upgrade -r requirements.txt
cd ../web && npm update

# 3. Run migrations
docker-compose exec backend alembic upgrade head

# 4. Rebuild and restart
docker-compose down
docker-compose up -d --build

# 5. Verify
curl http://localhost:8000/api/v1/auth/me
```
