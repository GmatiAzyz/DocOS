#!/bin/bash

# DocOS Production Deployment Script
set -e

echo "🚀 Starting DocOS production deployment..."

# Check if required environment variables are set
if [ -z "$PRODUCTION_DATABASE_URL" ]; then
    echo "❌ PRODUCTION_DATABASE_URL is not set"
    exit 1
fi

if [ -z "$NEXTAUTH_SECRET" ]; then
    echo "❌ NEXTAUTH_SECRET is not set"
    exit 1
fi

if [ -z "$NEXTAUTH_URL" ]; then
    echo "❌ NEXTAUTH_URL is not set"
    exit 1
fi

# Validate database URL format
if [[ ! "$PRODUCTION_DATABASE_URL" =~ ^postgresql:// ]]; then
    echo "❌ PRODUCTION_DATABASE_URL must be a PostgreSQL URL"
    exit 1
fi

# Validate NEXTAUTH_URL format
if [[ ! "$NEXTAUTH_URL" =~ ^https:// ]]; then
    echo "⚠️  NEXTAUTH_URL should be HTTPS in production"
fi

# Build the application
echo "📦 Building application..."
npm run build

# Run database migrations
echo "🗄️  Running database migrations..."
npx prisma db push --accept-data-loss

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Build Docker image
echo "🐳 Building Docker image..."
docker build -t docos:latest .

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker stop docos-app || true
docker rm docos-app || true

# Run the new container
echo "🚀 Starting new container..."
docker run -d \
    --name docos-app \
    --restart unless-stopped \
    -p 3000:3000 \
    -e NODE_ENV=production \
    -e DATABASE_URL="$PRODUCTION_DATABASE_URL" \
    -e NEXTAUTH_SECRET="$NEXTAUTH_SECRET" \
    -e NEXTAUTH_URL="$NEXTAUTH_URL" \
    docos:latest

# Wait for application to be ready
echo "⏳ Waiting for application to be ready..."
sleep 10

# Health check
echo "🏥 Performing health check..."
if curl -f http://localhost:3000/api/health; then
    echo "✅ Application is healthy!"
else
    echo "❌ Health check failed!"
    docker logs docos-app
    exit 1
fi

echo "🎉 Deployment completed successfully!"
echo "📱 Application is running at: $NEXTAUTH_URL"
