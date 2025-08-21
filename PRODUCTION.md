# DocOS Production Deployment Guide

This guide covers deploying DocOS to production with security, performance, and monitoring best practices.

## 🚀 Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- PostgreSQL 15+ database
- SSL certificate for your domain
- Domain name configured

## 🔐 Environment Setup

### 1. Production Environment Variables

Copy the production environment template:
```bash
cp env.production.template .env.production
```

Fill in your production values:
```env
NODE_ENV=production
NEXTAUTH_SECRET=your-super-secret-production-key
NEXTAUTH_URL=https://yourdomain.com
DATABASE_URL=postgresql://user:pass@host:5432/docos_db?sslmode=require
```

### 2. Generate Secure Secrets

```bash
# Generate NextAuth secret
openssl rand -base64 32

# Generate database password
openssl rand -base64 24
```

## 🗄️ Database Setup

### 1. Production PostgreSQL

```bash
# Create production database
createdb docos_production

# Run migrations
npx prisma db push --accept-data-loss

# Generate Prisma client
npx prisma generate
```

### 2. Database Security

- Enable SSL connections
- Use strong passwords
- Restrict network access
- Enable connection pooling
- Set up automated backups

## 🐳 Docker Deployment

### 1. Build Production Image

```bash
# Build the production image
docker build -t docos:production .

# Tag for registry (if using one)
docker tag docos:production your-registry/docos:latest
```

### 2. Run Production Container

```bash
docker run -d \
  --name docos-production \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file .env.production \
  docos:production
```

### 3. Using Docker Compose (Production)

```bash
# Create production compose file
cp docker-compose.yml docker-compose.prod.yml

# Edit for production settings
# Run production stack
docker-compose -f docker-compose.prod.yml up -d
```

## 🔒 Security Configuration

### 1. SSL/TLS Setup

```bash
# Install Certbot
sudo apt install certbot

# Get SSL certificate
sudo certbot certonly --standalone -d yourdomain.com

# Configure Nginx with SSL
```

### 2. Nginx Configuration

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📊 Monitoring & Health Checks

### 1. Health Check Endpoint

The application includes a health check at `/api/health` that:
- Checks database connectivity
- Reports application status
- Provides response time metrics
- Shows environment information

### 2. Logging

```bash
# View application logs
docker logs docos-production

# Follow logs in real-time
docker logs -f docos-production
```

### 3. Performance Monitoring

Consider integrating:
- Sentry for error tracking
- Google Analytics for usage metrics
- Uptime monitoring services
- Database performance monitoring

## 🔄 CI/CD Pipeline

### 1. GitHub Actions Example

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to server
        run: |
          # Your deployment commands here
```

### 2. Automated Deployment

```bash
# Make deployment script executable
chmod +x scripts/deploy.sh

# Run deployment
./scripts/deploy.sh
```

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check DATABASE_URL format
   - Verify SSL requirements
   - Check firewall settings

2. **Authentication Errors**
   - Verify NEXTAUTH_SECRET
   - Check NEXTAUTH_URL format
   - Ensure database tables exist

3. **Performance Issues**
   - Check database indexes
   - Monitor memory usage
   - Review query performance

### Debug Commands

```bash
# Check container status
docker ps -a

# View container logs
docker logs docos-production

# Access container shell
docker exec -it docos-production sh

# Check database connection
docker exec -it docos-production npx prisma db push
```

## 📈 Scaling Considerations

### 1. Load Balancing

- Use multiple application instances
- Implement Redis for session storage
- Consider CDN for static assets

### 2. Database Scaling

- Read replicas for read-heavy workloads
- Connection pooling
- Query optimization

### 3. Caching Strategy

- Redis for session storage
- CDN for static assets
- Application-level caching

## 🔄 Backup & Recovery

### 1. Database Backups

```bash
# Automated backup script
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
psql $DATABASE_URL < backup_file.sql
```

### 2. Application Backups

- Version control for code
- Environment configuration backups
- Docker image backups

## 📞 Support

For production deployment support:
- Check application logs
- Review health check endpoint
- Monitor database performance
- Verify environment configuration

---

**Remember**: Always test deployment procedures in a staging environment before applying to production.
