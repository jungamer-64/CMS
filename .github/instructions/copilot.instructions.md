---
applyTo: '**'
---
# AI Coding Agent Instructions: Next.js 15 CMS

## Project Overview
Modern headless CMS built with Next.js 15 (App Router), MongoDB, TypeScript, and Tailwind CSS. Uses Turbopack for fast development and pnpm for package management.

**Tech Stack**: Next.js 15.4.5 | React 19 | MongoDB 6.18 | TypeScript 5.9 | Tailwind CSS | bcryptjs | JWT

## Development Workflow with AI Tools

### Required Process for All Features
Follow this structured workflow using sequential thinking → code generation → verification → browser testing:

#### 1. Planning Phase (Sequential Thinking)
Before writing code, break down the task into numbered steps:

**Example - Adding Blog Categories Feature:**
```
Step 1: Define category schema in MongoDB (name, slug, description, postCount)
Step 2: Create CategoryRepository extending BaseRepository
Step 3: Add API routes: GET /api/categories (list), POST (create), PATCH (update), DELETE
Step 4: Create admin UI at /admin/categories with CRUD form
Step 5: Update post-repository.ts to link posts to categories
Step 6: Add category filter to /admin/posts listing
Step 7: Update public blog page to show category tags
```

**Planning Template:**
```markdown
Feature: [Name]
Step 1: [Data layer changes - schema, repository methods]
Step 2: [API layer - which endpoints, authentication needs]
Step 3: [Admin UI - forms, tables, validation]
Step 4: [Integration - link with existing features]
Step 5: [Testing points - edge cases, security checks]
```

#### 2. Code Generation (Serena/Copilot)
Use your AI assistant with specific context from this document:

**Prompt Pattern:**
```
Context: This is a Next.js 15 CMS using the Repository Pattern and API Factory.
Reference: [Relevant section from this instructions file]

Task: Implement Step [N] of my plan:
[Paste the specific step]

Requirements:
- Follow patterns in app/lib/data/repositories/post-repository.ts
- Use createGetHandler/createPostHandler from api-factory.ts
- Return ApiResponse<T> type
- Include TypeScript types
- Add authentication via withApiAuth
```

**For Repositories:**
```
Generate a CategoryRepository following the pattern in user-repository.ts.
Include: findAll with pagination, findById, create, update, delete.
Use buildPagination(), buildSearchRegex() from BaseRepository.
Collection name: 'categories'
```

**For API Routes:**
```
Generate API routes at app/api/categories/route.ts using api-factory.ts patterns.
- GET: List all categories with pagination
- POST: Create category (admin only, rate limit 10/min)
- Include proper ApiResponse<T> return types
```

#### 3. Verification (MCP-Gemini-CLI)
After code generation, verify with MCP-Gemini-CLI:

**Verification Prompts:**
```bash
# Security check
"Review this API route for security issues:
- Check authentication enforcement
- Verify input validation
- Check for MongoDB injection risks
- Confirm rate limiting is applied
- Verify ApiResponse format compliance"

# Pattern compliance
"Compare this repository implementation to the patterns in:
app/lib/data/repositories/post-repository.ts
Check for:
- Proper BaseRepository extension
- Correct ApiResponse usage
- MongoDB ObjectId to string conversion
- Error handling consistency"

# Type safety
"Verify TypeScript types in this code:
- All parameters properly typed
- No 'any' types used
- ApiResponse<T> generic correctly applied
- Import statements from correct paths"
```

**Specific Checks for This Codebase:**
- ✅ Uses `createGetHandler`/`createPostHandler` (not raw NextRequest)
- ✅ Returns `ApiResponse<T>` structure
- ✅ Converts MongoDB `_id` to string `id` field
- ✅ Uses bcrypt (12 rounds) for passwords
- ✅ JWT cookie name is `'auth-token'`
- ✅ Rate limiting configured on sensitive endpoints
- ✅ Admin routes check `user.role === 'admin'`
- ✅ i18n keys exist in JSON files
- ✅ No `any` types anywhere

#### 4. Browser Testing (Chrome DevTools)
Test implementation with DevTools open:

**DevTools Setup:**
```
1. Open Chrome DevTools (F12)
2. Enable tabs: Console, Network, Application
3. Set breakpoints in relevant files
4. Monitor for errors/warnings
```

**Testing Checklist for This CMS:**

**API Endpoints:**
- [ ] Network tab: Check response structure matches `ApiResponse<T>`
- [ ] Console: No errors during API calls
- [ ] Network: Verify `auth-token` cookie sent with requests
- [ ] Network: Check rate limiting (429 responses after threshold)
- [ ] Response: Verify pagination structure (`data`, `pagination`, `total`)

**Admin UI:**
- [ ] Console: No React errors or warnings
- [ ] Console: Check i18n keys loaded (`useCMSI18n()` returns translations)
- [ ] Application tab: Verify `theme` localStorage for dark mode
- [ ] Network: Check API calls use proper error handling
- [ ] Elements: Verify Tailwind classes applied correctly

**Authentication:**
- [ ] Application → Cookies: `auth-token` present and HTTP-only
- [ ] Network: 401 responses redirect to login
- [ ] Console: No JWT decode errors
- [ ] Application: Cookie expires in 7 days

**Performance:**
- [ ] Network: No redundant API calls (check for re-renders)
- [ ] Performance tab: Time to Interactive < 3s
- [ ] Network: Check if MongoDB queries optimized (no N+1)

**Security Testing:**
```javascript
// Console tests for this CMS

// Test 1: Verify authentication
fetch('/api/posts', {
  credentials: 'include' // Should use existing auth-token
}).then(r => r.json()).then(console.log);

// Test 2: Check rate limiting
for(let i=0; i<10; i++) {
  fetch('/api/auth/login', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({username: 'test', password: 'wrong'})
  }).then(r => console.log(i, r.status)); // Should hit 429
}

// Test 3: Verify ApiResponse structure
fetch('/api/posts').then(r => r.json()).then(data => {
  console.assert(typeof data.success === 'boolean', 'Missing success field');
  console.assert(data.data || data.error, 'Missing data or error');
});
```

#### 5. Iteration
Based on verification and testing results:

**If Issues Found:**
1. Document the specific error/issue
2. Use MCP-Gemini-CLI to analyze root cause
3. Generate fix using Serena with updated context
4. Re-verify and re-test

**Common Iteration Scenarios:**

**MongoDB ObjectId Error:**
```typescript
// ❌ Wrong (from generation)
const user = await collection.findOne({ id: userId });

// ✅ Fixed (after verification)
const user = await collection.findOne({ _id: new ObjectId(userId) });
// Then convert: { id: user._id.toString(), ...user }
```

**Missing Rate Limit:**
```typescript
// ❌ Generated without rate limit
export const POST = createPostHandler<Input, Output>(handler);

// ✅ After verification feedback
export const POST = createPostHandler<Input, Output>(handler, {
  rateLimit: { maxRequests: 5, windowMs: 60000 }
});
```

**Wrong ApiResponse Format:**
```typescript
// ❌ Generated
return { data: results };

// ✅ After verification
return createSuccessResponse(results);
// or
return { success: true, data: results };
```

### Workflow Summary Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. PLAN (Sequential Thinking)                                   │
│    ├─ Break feature into 5-8 numbered steps                     │
│    ├─ Identify: data layer → API → UI → integration             │
│    └─ Note security/edge cases                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. GENERATE (Serena/Copilot)                                    │
│    ├─ Provide context from this instructions file               │
│    ├─ Reference similar files as examples                       │
│    └─ Request specific patterns (api-factory, repositories)     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. VERIFY (MCP-Gemini-CLI)                                      │
│    ├─ Security: auth, validation, injection risks               │
│    ├─ Patterns: api-factory usage, ApiResponse format           │
│    ├─ Types: No 'any', proper generics                          │
│    └─ CMS-specific: ObjectId conversion, bcrypt, JWT cookies    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. TEST (Chrome DevTools)                                       │
│    ├─ Network: API responses, rate limiting, cookies            │
│    ├─ Console: No errors, i18n loaded, auth working             │
│    ├─ Application: localStorage theme, JWT cookie               │
│    └─ Performance: Query optimization, no N+1                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    ┌──────────────────┐
                    │ Issues Found?    │
                    └────────┬─────────┘
                          Yes│    │No
                ┌─────────────┘    └─────────┐
                ↓                            ↓
        ┌──────────────┐            ┌──────────────┐
        │ 5. ITERATE   │            │ ✅ COMPLETE  │
        │ Return to #2 │            │ Move to next │
        │ with fixes   │            │ plan step    │
        └──────────────┘            └──────────────┘
```

### Real-World Example: Adding Comment Moderation Feature

**1. Plan**
```
Feature: Comment approval workflow
Step 1: Add 'status' field to comment-repository.ts (pending/approved/rejected)
Step 2: Create GET /api/admin/comments/pending endpoint
Step 3: Create PATCH /api/admin/comments/[id]/approve endpoint
Step 4: Add admin UI at /admin/comments with approval buttons
Step 5: Update public comment display to filter status='approved' only
```

**2. Generate (Serena Prompt)**
```
Context: Next.js 15 CMS using Repository Pattern
Reference: app/lib/data/repositories/comment-repository.ts

Task: Implement Step 2 - Create endpoint to list pending comments

Requirements:
- Use createGetHandler from api-factory.ts
- Return ApiResponse<Comment[]> type
- Filter comments where status='pending'
- Include pagination using buildPagination()
- Require admin role authentication
- Apply rate limit: 30 requests/min

Example pattern from post-repository.ts:
[paste relevant code]
```

**3. Verify (MCP-Gemini-CLI)**
```
Review this API route for:
1. Does it use createGetHandler correctly?
2. Is admin role check present (user.role === 'admin')?
3. Is rate limiting configured?
4. Does it return ApiResponse<Comment[]>?
5. Are MongoDB queries safe from injection?
6. Is pagination implemented correctly?
```

**4. Test (DevTools)**
```javascript
// In browser console
fetch('/api/admin/comments/pending', { credentials: 'include' })
  .then(r => r.json())
  .then(data => {
    console.log('Response structure:', {
      hasSuccess: 'success' in data,
      hasData: 'data' in data,
      hasPagination: data.data?.pagination !== undefined,
      commentStatus: data.data?.data[0]?.status
    });
  });
```

**Check:**
- [ ] Network: 200 response with ApiResponse structure
- [ ] Console: No errors
- [ ] Network: auth-token cookie sent
- [ ] Response: All comments have status='pending'
- [ ] Response: Pagination object present

**5. Iterate (if needed)**
**Issue Found:** Missing admin role check
**Fix:** Add to handler:
```typescript
if (user.role !== 'admin') {
  return createErrorResponse('Forbidden', 'FORBIDDEN');
}
```
**Re-verify → Re-test**

### Quick Workflow Reference Card

**Every feature implementation:**
1. ✍️ Write numbered plan (5-8 steps)
2. 🤖 Generate code (reference this doc + similar files)
3. 🔍 Verify patterns (security, types, CMS-specific checks)
4. 🌐 Test in DevTools (API, UI, auth, performance)
5. 🔄 Iterate if issues found

**Always verify these in Step 3:**
- Uses api-factory handlers
- Returns ApiResponse<T>
- Converts _id → id string
- Admin routes check role
- Rate limiting on sensitive endpoints
- No 'any' types

**Always test these in Step 4:**
- API response structure
- Authentication cookies
- Rate limiting (429 responses)
- Console has no errors
- i18n translations loaded

## Core Architecture Patterns

### 1. Repository Pattern (app/lib/data/repositories/)
All data access goes through typed repositories extending `BaseRepository<TEntity, TCreateInput, TUpdateInput>`:
- `user-repository.ts` - User CRUD, authentication via bcrypt
- `post-repository.ts` - Blog posts with status workflow (draft/published)
- `page-repository.ts` - Static pages management
- `settings-repository.ts` - System settings
- `comment-repository.ts` - Comment moderation

**Key Methods**: `findAll()`, `findById()`, `create()`, `update()`, `delete()`
**Always**: Return `ApiResponse<T>` type, use `buildPagination()` for lists, `buildSearchRegex()` for search

### 2. API Factory Pattern (app/lib/api-factory.ts)
Create type-safe API routes using handler factories:
```typescript
// Use these instead of raw NextRequest handlers
export const GET = createGetHandler<ResponseType>(async (request, user, params) => {
  // user is pre-authenticated, params from URL
  return createSuccessResponse(data);
});

export const POST = createPostHandler<BodyType, ResponseType>(async (request, body, user) => {
  // body is pre-parsed and type-safe
});
```

**Authentication**: All handlers use `withApiAuth()` automatically - `user` parameter is always authenticated
**Rate Limiting**: Configure via `options.rateLimit` in handler creation
**Error Handling**: Use `createErrorResponse(message, code)` from api-utils.ts

### 3. Unified Type System (app/lib/core/types/api-unified.ts)
Centralized type definitions for consistency:
```typescript
ApiResponse<T> = { success: boolean; data?: T; error?: string; code?: ApiErrorCode }
ApiSuccess<T> = { success: true; data: T; message?: string }
ApiError = { success: false; error: string; code?: ApiErrorCode }
```

**Entities**: User, Post, Page, Comment, Settings (all have `id`, `createdAt`, `updatedAt`)
**Error Codes**: VALIDATION_ERROR, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, INTERNAL_ERROR

### 4. Authentication & Security (app/lib/auth-middleware.ts)
JWT-based auth with rate limiting:
- Tokens stored in HTTP-only cookies (7-day expiration)
- `withApiAuth()` middleware validates JWT + user status
- Rate limiter: 5 login attempts per 15min window (configurable per-endpoint)
- Security events logged: LOGIN_SUCCESS, LOGIN_FAILURE, RATE_LIMIT, INVALID_TOKEN

**Password Hashing**: bcrypt with 12 salt rounds (see `user-repository.ts:authenticateUser()`)

### 5. Multi-Language Support (app/lib/contexts/)
Three-tier i18n system:
1. **AdvancedI18nProvider** (advanced-i18n-context.tsx) - Full-featured: 16 locales, RTL, plurals, date/currency formatting
2. **CMSI18nProvider** (cms-i18n-context.tsx) - Admin panel only (ja/en)
3. **ThemeProvider** (ui/contexts/theme-context.tsx) - Dark mode state management

**Usage**: `const { t, locale, setLocale } = useCMSI18n()` in admin, `useAdvancedI18n()` for public
**Translations**: JSON files in `public/locales/{locale}/cms/*.json`

## Development Workflow

### Setup & Running
```bash
pnpm install              # Install dependencies
pnpm dev                  # Start dev server (Turbopack, port 3000)
pnpm build                # Production build
pnpm type-check           # TypeScript validation
pnpm lint                 # ESLint check

# Database utilities
pnpm tsx scripts/init-admin-user.ts  # Create/reset admin user
pnpm tsx scripts/check-db-users.js   # List users
```

### Environment Variables (.env.local)
```env
MONGODB_URI=mongodb+srv://...           # MongoDB Atlas connection
MONGODB_DB_NAME=test-website            # Database name
JWT_SECRET=<64+ char random string>     # Token signing key
ADMIN_USERNAME=admin                    # Default admin username
ADMIN_PASSWORD=<secure password>        # Hashed in DB
```

### Admin Panel Structure (app/admin/)
Protected routes require `role: 'admin'`:
- `/admin` - Dashboard
- `/admin/posts` - Blog post management
- `/admin/pages` - Static pages
- `/admin/media` - File uploads
- `/admin/users` - User management
- `/admin/settings` - System config
- `/admin/api-keys` - API key management

**Layout**: `AdminLayout` (app/lib/ui/components/layouts/AdminLayout.tsx) provides sidebar nav + auth check

## Common Patterns & Conventions

### Creating New API Routes
```typescript
// app/api/resource/route.ts
import { createGetHandler, createPostHandler, createSuccessResponse } from '@/app/lib/api-factory';
import { ResourceRepository } from '@/app/lib/data/repositories/resource-repository';

const repository = new ResourceRepository();

export const GET = createGetHandler<ResourceType[]>(async (request, user, params) => {
  const { data } = await repository.findAll();
  return createSuccessResponse(data);
});

export const POST = createPostHandler<CreateInput, ResourceType>(
  async (request, body, user) => {
    const result = await repository.create({ ...body, authorId: user.id });
    return result; // Already ApiResponse format
  },
  {
    rateLimit: { maxRequests: 10, windowMs: 60000, message: 'Too many requests' }
  }
);
```

### Adding Repository
```typescript
// app/lib/data/repositories/my-repository.ts
import { BaseRepository, type RepositoryResult } from './base-repository';
import { connectToDatabase } from '../../database/connection';
import type { ApiResponse } from '../../core/types';

export class MyRepository extends BaseRepository<Entity, CreateInput, UpdateInput> {
  async findAll(filters?: Filters): Promise<ApiResponse<RepositoryResult<Entity>>> {
    const db = await connectToDatabase();
    const collection = db.collection('my_collection');

    // Use inherited: buildPagination(), buildSortQuery(), buildSearchRegex()
    const data = await collection.find(query).toArray();
    return { success: true, data: { data, pagination: this.buildPagination(total, page, limit) } };
  }
  // ... implement findById, create, update, delete
}
```

### Client Components with i18n
```tsx
'use client';
import { useCMSI18n } from '@/app/lib/contexts/cms-i18n-context';

export default function MyComponent() {
  const { t, locale, setLocale } = useCMSI18n();
  return <h1>{t('admin.dashboard.title')}</h1>;
}
```

## Critical Gotchas

1. **MongoDB ObjectId vs String ID**: Repositories use string `id` field, not `_id`. Always convert: `id: doc._id.toString()`
2. **Theme Context**: Use ThemeProvider's `setDarkMode()`, not direct DOM manipulation. localStorage key is `'theme'` (not `'darkMode'`)
3. **Auth Cookies**: JWT cookie name is `'auth-token'`. Must be HTTP-only, secure in production
4. **API Response Format**: Always return `ApiResponse<T>` - factories handle this, but raw fetch needs manual wrapping
5. **Rate Limiting**: Uses in-memory store (resets on server restart). Production should use Redis
6. **File Uploads**: Stored in `public/uploads/` with original filenames. No CDN integration yet

## Testing Checklist
- [ ] TypeScript compiles without errors (`pnpm type-check`)
- [ ] ESLint passes (`pnpm lint`)
- [ ] API returns proper `ApiResponse<T>` structure
- [ ] Authentication enforced on protected routes
- [ ] Rate limiting applied to sensitive endpoints
- [ ] Input validation using Zod or manual checks
- [ ] Database queries use indexes (check `setup-indexes.ts`)
- [ ] i18n keys exist in all supported locales
- [ ] Dark mode works in all admin pages
- [ ] Mobile responsive (Tailwind breakpoints)

## File Structure
```
app/
├── admin/                          # Protected admin panel (requires auth)
│   ├── layout.tsx                 # AdminLayout wrapper
│   ├── posts/, pages/, media/     # Content management
│   └── settings/                  # System configuration
├── api/                           # API routes (use api-factory.ts patterns)
│   ├── auth/login/                # JWT authentication
│   ├── posts/, pages/, users/     # CRUD endpoints
│   └── settings/                  # System settings
├── lib/                           # Core application logic
│   ├── api-factory.ts             # Handler factories (USE THIS)
│   ├── auth-middleware.ts         # JWT validation + rate limiting
│   ├── core/types/                # Unified type definitions
│   ├── data/repositories/         # Data access layer (Repository pattern)
│   ├── database/                  # MongoDB connection + models
│   ├── contexts/                  # React contexts (i18n, theme, auth)
│   ├── security/                  # Rate limiter, CSRF protection
│   └── ui/components/             # Shared UI components
├── components/                    # Public-facing components
└── [slug]/                        # Dynamic routes (posts, pages)

public/
├── locales/{locale}/cms/          # Translation JSON files
└── uploads/                       # User-uploaded media

scripts/
├── init-admin-user.ts             # Admin user creation (USE THIS)
└── check-db-users.js              # Database debugging
```

## Quick Reference

### MongoDB Collections
- `users` - User accounts (bcrypt hashed passwords)
- `posts` - Blog posts (status: draft/published/archived)
- `pages` - Static pages
- `comments` - Post comments (approval workflow)
- `settings` - System configuration (singleton)
- `apiKeys` - API key management

### Key Commands
```bash
# Development
pnpm dev                                    # Start Turbopack dev server
pnpm build && pnpm start                    # Production mode
pnpm tsx scripts/init-admin-user.ts         # Reset admin password

# Debugging
pnpm tsx scripts/check-db-users.js          # List all users
pnpm tsx scripts/check-existing-posts.ts    # Verify posts
mongo <MONGODB_URI> --eval "db.users.find()" # Direct DB query
```

### Importing Patterns
```typescript
// API routes
import { createGetHandler, createSuccessResponse } from '@/app/lib/api-factory';
import { withApiAuth, type User } from '@/app/lib/auth-middleware';

// Types
import type { ApiResponse, ApiErrorCode } from '@/app/lib/core/types/api-unified';

// i18n
import { useCMSI18n } from '@/app/lib/contexts/cms-i18n-context';

// Repositories
import { UserRepository } from '@/app/lib/data/repositories/user-repository';
```

## Security Best Practices
1. **Never** use `any` type - this codebase is strictly typed
2. **Always** validate input at API boundaries (use Zod schemas in `validation-schemas.ts`)
3. **Always** use `createGetHandler/PostHandler` - they include auth + rate limiting
4. **Never** return raw errors to client - use `createErrorResponse()` to sanitize
5. **Always** hash passwords with bcrypt (12 rounds) - see `user-repository.ts`
6. **Never** commit `.env.local` - contains secrets
7. **Always** check user role for admin endpoints: `if (user.role !== 'admin') return unauthorized()`

## Troubleshooting Common Issues

**MongoDB connection errors**: Check `MONGODB_URI` and `MONGODB_DB_NAME` in .env.local
**Login 401**: Run `pnpm tsx scripts/init-admin-user.ts` to reset password
**Translation missing**: Add key to `public/locales/{locale}/cms/*.json`
**Dark mode not working**: ThemeProvider uses localStorage key `'theme'` (not `'darkMode'`)
**TypeScript errors in api-unified.ts**: Run `pnpm type-check` to see full error context
