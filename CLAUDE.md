# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

MoonCakeTV (月饼TV) is a Next.js 15 web application for video streaming aggregation and search. This is one of several independent repositories in the MoonCake TV multi-repository workspace.

**Tech Stack:**
- Next.js 15 with App Router and React 19
- TypeScript 5.x
- Tailwind CSS 4.x
- PostgreSQL (via pg) + Redis (via ioredis)
- Radix UI components with shadcn/ui
- Vidstack/HLS.js for video playback
- Zustand for state management
- Zod v4 for validation

**Node.js Requirement:** >=22.0.0

## Common Development Commands

```bash
# Development
npm install              # Install dependencies
npm run dev              # Start dev server on 0.0.0.0:3333
npm run build            # Production build
npm run start            # Start production server

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint errors and format code
npm run typecheck        # TypeScript type checking
npm run format           # Format code with Prettier
npm run format:check     # Check formatting without changes

# Testing
npm run test             # Run Jest tests
npm run test:watch       # Run tests in watch mode

# Database Migrations
make m-up                # Run pending migrations
make m-down              # Rollback last migration
make m-status            # Check migration status

# Docker Operations
make d-build             # Build Docker image
make d-run               # Run in Docker container on port 3333
make dc-up               # Docker Compose up (includes postgres, redis, caddy, pgweb)
make dc-down             # Docker Compose down

# Git Deployment
make origin              # Push to origin remote
make tea                 # Push to tea remote
make vercel              # Push to vercel remote
```

## Authentication Architecture

The application supports three authentication modes via `PASSWORD_MODE` environment variable:

1. **`local`** (default): No authentication required - for local development only
2. **`env`**: Simple password authentication using `MY_PASSWORD` environment variable
3. **`db`**: User database authentication with full user management

**Middleware flow (`src/middleware.ts`):**
- Checks `PASSWORD_MODE` to determine auth strategy
- Validates `mc-auth-token` cookie for protected routes
- Redirects to `/login` on authentication failure
- Skips auth for static files, login/signup pages, and specific API routes

**Protected vs Public paths:**
- Public: `/_next`, `/login`, `/signup`, `/api/login`, `/api/register`, `/api/logout`, static files
- Protected: All other routes

## Database Management

### Migration System

Uses custom migration wrapper around `node-pg-migrate` (not the CLI):

**Configuration:** `migrate/migrations.json`
- Migration files in `migrate/migrations/` directory
- Named with UTC timestamp format
- Files use `.js` extension

**Migration commands run via Docker Compose:**
```bash
./migrate/migrate.sh up          # Run pending migrations
./migrate/migrate.sh down        # Rollback last migration
./migrate/migrate.sh down 3      # Rollback last 3 migrations
./migrate/migrate.sh status      # Check migration status
```

**Creating new migrations:**
```bash
cd migrate
node create-migration.js my-migration-name
```

### Database Access Patterns

**PostgreSQL:**
```typescript
import { pool } from '@/utils/pg';
const result = await pool.query('SELECT * FROM users');
```

**Redis:**
```typescript
import { redis } from '@/utils/redis';
await redis.set('key', 'value');
```

## Project Structure

### Key Directories

- **`src/app/`** - Next.js App Router pages and layouts
  - `api/` - API route handlers (login, logout, signup, etc.)
  - `admin/` - Admin pages
  - `play/` - Video playback page
  - `search/` - Search results page

- **`src/components/`** - React components
  - `ui/` - shadcn/ui components (Radix UI primitives)
  - `common/` - Shared common components
  - `mc-play/` - Video player components (Vidstack-based)
  - `sidebar/` - Sidebar navigation components

- **`src/actions/`** - Server actions
  - `password.ts` - Authentication server actions

- **`src/utils/`** - Utility functions
  - `pg.ts` - PostgreSQL pool configuration
  - `redis.ts` - Redis client configuration
  - `jwt.ts` - JWT token utilities
  - `user.ts` - User management utilities

- **`src/schemas/`** - Zod validation schemas
  - `user.ts` - User-related schemas
  - `dazahui.ts` - Content/video schemas

- **`src/stores/`** - Zustand state stores
  - `global.ts` - Global application state
  - `user.ts` - User state management
  - `sidebar.ts` - Sidebar state

- **`migrate/`** - Database migration system
  - `migrations/` - Migration files
  - `migrate.sh` - Migration runner script
  - `create-migration.js` - Migration creation tool

## Common Patterns

### Adding a New API Route

Create a route handler in `src/app/api/{route-name}/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Handle GET request
  return NextResponse.json({ data: '...' });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  // Handle POST request
  return NextResponse.json({ success: true });
}
```

### Server Actions Pattern

Create server actions in `src/actions/`:

```typescript
'use server';

import { z } from 'zod';

const schema = z.object({
  field: z.string(),
});

export async function myAction(data: z.infer<typeof schema>) {
  const validated = schema.parse(data);
  // Perform server-side logic
  return { success: true };
}
```

### Schema Validation

Use Zod v4 with validation error formatting:

```typescript
import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';

const schema = z.object({
  email: z.string().email(),
});

try {
  const data = schema.parse(input);
} catch (error) {
  const validationError = fromZodError(error);
  console.error(validationError.toString());
}
```

### State Management with Zustand

```typescript
import { create } from 'zustand';

interface MyStore {
  value: string;
  setValue: (value: string) => void;
}

export const useMyStore = create<MyStore>((set) => ({
  value: '',
  setValue: (value) => set({ value }),
}));
```

## Docker Compose Stack

When running `make dc-up`, the following services start:

- **postgres** (port 5432): PostgreSQL 16 database
- **redis** (internal): Redis cache with LRU eviction
- **mcweb** (internal): Next.js application
- **caddy** (ports 80/443): Reverse proxy with automatic HTTPS
- **pgweb** (internal): PostgreSQL web admin interface

**Environment variables** are loaded from `.env` file (see `.env.example` for template).

**Docker networking:** All services communicate via `mooncake-web-network`.

## Environment Variables

Required environment variables (see `.env.example`):

```bash
# Authentication Mode
PASSWORD_MODE=db                    # local | env | db

# For PASSWORD_MODE=env
MY_PASSWORD=your_password           # Simple password auth

# For PASSWORD_MODE=db
JWT_SECRET=your_jwt_secret          # JWT signing key
MC_ADMIN_USERNAME=admin             # Initial admin username
MC_ADMIN_PASSWORD=admin_password    # Initial admin password

# Domain (for Caddy)
DOMAIN=your-domain.com

# PostgreSQL
POSTGRES_DB=mooncaketv
POSTGRES_USER=mooncaketv
POSTGRES_PASSWORD=your_db_password

# PGWeb Admin
PGWEB_AUTH_USER=admin
PGWEB_AUTH_PASS=admin_password
```

## Security Notes

**HTTPS Requirement for Production:**
- Pre-built Docker images run in production mode with secure cookies
- Cookies require HTTPS to be saved in browsers
- Use Caddy/Nginx reverse proxy with valid SSL certificates
- Direct HTTP access (e.g., `http://IP:3333`) will fail authentication

**Password Protection:**
- Always set `PASSWORD_MODE=env` or `PASSWORD_MODE=db` for deployments
- Never use `PASSWORD_MODE=local` in production
- Keep environment variables secure and never commit to git

## Video Player Components

The application uses Vidstack for video playback:

- **Vidstack** (`@vidstack/react`): Modern video player framework
- **HLS.js**: HLS streaming support in browsers
- **Video.js**: Alternative video player (legacy support)

Player components are in `src/components/mc-play/`.

## Deployment Options

1. **Docker**: Use `make d-build` and `make d-run`
2. **Docker Compose**: Use `make dc-up` for full stack
3. **Vercel**: Push to vercel remote with `make vercel`
   - Configure environment variables in Vercel dashboard
   - Supports serverless deployment with edge caching

## Development Tips

- Always run migrations before starting development: `make m-up`
- Use `npm run lint:fix` to auto-fix linting issues and format code
- Type-check before committing: `npm run typecheck`
- For video playback testing, ensure CORS is enabled on source URLs
- Redis is used for session storage and caching - flush if login issues occur
