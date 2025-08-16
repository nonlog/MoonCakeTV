# Dockerfile for database migrations
FROM node:22-slim

WORKDIR /app

# Install only the packages needed for migrations
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --only=production

# Install node-pg-migrate globally and bcrypt for password hashing
RUN npm install -g node-pg-migrate bcryptjs

# Copy migration files
COPY migrations ./migrations

# Default command - run all pending migrations with hardcoded config
CMD [
  "node-pg-migrate",
  "up",
  "--migrations-dir",
  "migrations",
  "--migrations-table",
  "pgmigrations",
  "--schema",
  "public",
  "--check-order",
  "--verbose",
  "--migration-filename-format",
  "utc",
  "--migration-file-language",
  "js",
]