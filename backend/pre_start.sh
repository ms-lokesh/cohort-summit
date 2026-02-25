#!/bin/bash
# Pre-start script for Render deployment
# Runs database migrations and creates production users after build but before starting the application

set -e  # Exit on error

echo "========================================"
echo "Running pre-start database operations..."
echo "========================================"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL environment variable is not set!"
    exit 1
fi

# Wait for database to be ready (with timeout)
echo "Checking database connectivity..."
echo "DATABASE_URL host: $(echo $DATABASE_URL | sed 's|.*@\([^:/]*\).*|\1|')"

# Use python3 if python is not available (for local testing on macOS)
PYTHON_CMD=$(command -v python || command -v python3)

$PYTHON_CMD -c "
import os
import sys
import time
import psycopg
from urllib.parse import urlparse

max_retries = 3
retry_delay = 2
connect_timeout = 5

database_url = os.environ.get('DATABASE_URL')
print(f'Connecting to database...')

for i in range(max_retries):
    try:
        print(f'Attempt {i+1}/{max_retries}...')
        conn = psycopg.connect(database_url, connect_timeout=connect_timeout)
        conn.close()
        print(f'✓ Database connection successful')
        sys.exit(0)
    except Exception as e:
        print(f'Connection failed: {type(e).__name__}: {str(e)}')
        if i < max_retries - 1:
            print(f'Retrying in {retry_delay}s...')
            time.sleep(retry_delay)
        else:
            print(f'ERROR: Database connection failed after {max_retries} attempts')
            print(f'Please check:')
            print(f'  1. DATABASE_URL is correctly set in Render environment variables')
            print(f'  2. Supabase database is running and accessible')
            print(f'  3. Supabase allows connections from Render IP addresses')
            sys.exit(1)
"

if [ $? -ne 0 ]; then
    echo "Failed to connect to database - starting without migrations"
    echo "WARNING: Application may not work correctly!"
    exit 0  # Don't fail the deployment, just warn
fi

echo ""
echo "Running database migrations..."
$PYTHON_CMD manage.py migrate --no-input

if [ $? -eq 0 ]; then
    echo "✓ Migrations completed successfully"
else
    echo "ERROR: Migrations failed"
    exit 1
fi

echo ""
echo "Creating production users (if not exist)..."
$PYTHON_CMD manage.py create_production_users || true

echo ""
echo "Fixing user sequences..."
$PYTHON_CMD manage.py fix_user_sequence || true

echo ""
echo "Listing database users..."
$PYTHON_CMD manage.py list_users || true

echo ""
echo "========================================"
echo "Pre-start operations completed successfully"
echo "========================================"
