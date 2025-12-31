#!/bin/bash
# Helper script to add DATABASE_URL to .env.local
# Usage: ./scripts/add-db-url.sh

ENV_FILE=".env.local"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ .env.local file not found"
  exit 1
fi

# Check if DATABASE_URL already exists
if grep -q "^DATABASE_URL=" "$ENV_FILE"; then
  echo "✅ DATABASE_URL already exists in .env.local"
  exit 0
fi

echo ""
echo "Please add the following to your .env.local file:"
echo ""
echo "# Neon Database"
echo "DATABASE_URL=postgresql://neondb_owner:npg_mbq8EgGOK9jc@ep-square-band-a49a8gmq-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"
echo ""
echo "Or run this command to append it:"
echo "echo '' >> .env.local"
echo "echo '# Neon Database' >> .env.local"
echo "echo 'DATABASE_URL=postgresql://neondb_owner:npg_mbq8EgGOK9jc@ep-square-band-a49a8gmq-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require' >> .env.local"

