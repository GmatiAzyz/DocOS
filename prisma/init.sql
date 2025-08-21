-- DocOS Database Initialization Script
-- This script runs when the PostgreSQL container starts

-- Create extensions if they don't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create indexes for better performance
-- (These will be created by Prisma, but we can add custom ones here)

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE docos_db TO docos_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO docos_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO docos_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO docos_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO docos_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO docos_user;

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'DocOS database initialized successfully';
END $$;
