# Multi-User & SSO Integration Planning

**Status**: Future enhancement (Phase 7+)  
**Current State**: Single-user application without authentication  
**Target**: Multi-team, multi-user deployment with SSO support

This document outlines the architectural roadmap for evolving the Developer Productivity Tool from a single-user application to a multi-user, team-based productivity platform with Single Sign-On (SSO) capabilities.

## Table of Contents

- [Current Architecture](#current-architecture)
- [Future Architecture](#future-architecture)
- [Data Model Enhancements](#data-model-enhancements)
- [SSO Integration Points](#sso-integration-points)
- [Authentication & Authorization](#authentication--authorization)
- [Data Isolation & Security](#data-isolation--security)
- [Migration Path](#migration-path)
- [Implementation Phases](#implementation-phases)
- [Security Considerations](#security-considerations)

---

## Current Architecture

### Single-User Limitations

```
┌─────────────────────────┐
│   Developer (User 1)    │
│  ┌───────────────────┐  │
│  │  Local SQLite DB  │  │
│  │  - Projects       │  │
│  │  - Tasks          │  │
│  │  - Time Entries   │  │
│  │  - Activities     │  │
│  └───────────────────┘  │
└─────────────────────────┘
```

**Current implementation:**
- ✅ All data in single SQLite/PostgreSQL database
- ✅ No user identification
- ✅ No data isolation between users
- ✅ No authentication required
- ⚠️ Cannot support team collaboration
- ⚠️ No shared workspaces
- ⚠️ No role-based access control

---

## Future Architecture

### Multi-User with Teams & SSO

```
┌──────────────────────────────────────────────────────────┐
│              SSO Provider (OAuth/SAML)                   │
│  - Okta, Azure AD, Google, GitHub, Auth0                │
└────────────────────┬─────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
    ┌───▼──────┐         ┌──────▼───┐
    │ Frontend  │         │  API     │
    │  (React)  │         │ (Next.js)│
    │         SessionAuth  │         │
    └───┬──────┘         └──────┬───┘
        │                       │
        │      ┌────────────────┴─────────────────┐
        │      │                                  │
    ┌───▼──────────────────────┐     ┌──────────▼──────────┐
    │  PostgreSQL Database      │     │  Auth Service       │
    │  - Users                  │     │  - Sessions         │
    │  - Teams                  │     │  - Permissions      │
    │  - Projects (Team-owned)  │     │  - Token management │
    │  - Tasks (Inherited from  │     │                     │
    │    Projects)              │     └─────────────────────┘
    │  - Time Entries (User)    │
    │  - Activities             │
    └──────────────────────────┘
```

---

## Data Model Enhancements

### User Model

```prisma
// User account model
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String?
  avatar        String?  // URL to profile picture
  role          UserRole @default(USER)
  
  // SSO fields
  ssoProvider   String?  // "google", "github", "okta", "azure", "saml"
  ssoId         String?  // Provider-specific user ID
  ssoEmail      String?  // Email from SSO provider
  
  // Local password (fallback)
  passwordHash  String?  // Optional for local auth
  
  // Account settings
  timezone      String   @default("UTC")
  language      String   @default("en")
  preferences   Json?    // User-specific settings
  
  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  lastLogin     DateTime?
  
  // Relations
  teams         Team[]                    // Teams user belongs to
  projects      Project[]                 // User's personal projects
  tasks         Task[]                    // Assigned tasks
  timeEntries   TimeEntry[]              // Time logged by user
  comments      TaskComment[]            // Comments created
  activities    Activity[]               // User's actions
  
  // Data isolation
  @@unique([ssoProvider, ssoId])  // Prevent duplicate SSO accounts
}

// Role-based access control
enum UserRole {
  ADMIN      // Can manage users, teams, billing
  MANAGER    // Can manage team members, projects
  USER       // Can create/edit own tasks
  GUEST      // Read-only access
}
```

### Team Model

```prisma
model Team {
  id            String   @id @default(cuid())
  name          String
  slug          String   @unique  // URL-safe name
  description   String?
  logo          String?  // Team logo/avatar URL
  
  // Team ownership
  ownerId       String
  owner         User     @relation("TeamOwner", fields: [ownerId], references: [id])
  
  // Timestamp
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  // Relations
  members       TeamMember[]  // Team members with roles
  projects      Project[]     // Team projects
  
  // Billing (future)
  plan          String   @default("free")  // "free", "pro", "enterprise"
  billingEmail  String?
}

model TeamMember {
  id            String   @id @default(cuid())
  teamId        String
  team          Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)
  
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  role          TeamRole @default(MEMBER)
  joinedAt      DateTime @default(now())
  
  @@unique([teamId, userId])  // Each user once per team
}

enum TeamRole {
  OWNER     // Full control
  ADMIN     // Manage team settings
  MANAGER   // Manage projects & members
  MEMBER    // Contribute to projects
  GUEST     // Read-only access
}
```

### Updated Project Model

```prisma
model Project {
  id                String   @id @default(cuid())
  name              String
  color             String   @default("blue")
  subcategories     String   // JSON array of strings
  jiraKey           String?
  
  // Ownership - can be owned by user or team
  ownerId           String?  // For personal projects
  owner             User?    @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  
  teamId            String?  // For team projects
  team              Team?    @relation(fields: [teamId], references: [id], onDelete: Cascade)
  
  // Visibility
  visibility        ProjectVisibility @default(PRIVATE)  // PRIVATE, TEAM, PUBLIC (future)
  
  // Timestamps
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  // Relations
  tasks             Task[]
  
  // Data integrity - each project must have owner OR team
  @@index([ownerId])
  @@index([teamId])
}

enum ProjectVisibility {
  PRIVATE   // Only owner/assignees
  TEAM      // All team members
  PUBLIC    // Anyone with link (future - requires auth)
}
```

### Updated Task Model

```prisma
model Task {
  // ... existing fields ...
  projectId       String
  project         Project  @relation(fields: [projectId], references: [id])
  
  // New: Explicit assignee
  assignedToId    String?
  assignedTo      User?    @relation(fields: [assignedToId], references: [id])
  
  // New: Created by (for audit trail)
  createdById     String
  createdBy       User     @relation("TaskCreatedBy", fields: [createdById], references: [id])
  
  // Permissions - who can view/edit
  canViewIds      String   // JSON array of user IDs (comma-separated)
  canEditIds      String   // JSON array of user IDs (comma-separated)
}
```

---

## SSO Integration Points

### 1. Authentication Flow

```
User visits app
       ↓
Is user logged in? (Check session)
       ↓ NO
Redirect to SSO login page
       ↓
User authenticates with SSO provider
       ↓
SSO provider returns auth code
       ↓
Exchange code for tokens (server-side)
       ↓
Create/update User record
       ↓
Create session
       ↓
Redirect to app
       ↓
User logged in ✓
```

### 2. Authentication Middleware

**Location**: `middleware.ts`

```typescript
// Protect all routes except /login and /api/auth/*
export async function middleware(request: NextRequest) {
  // Skip auth for public routes
  if (request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.next()
  }
  
  if (request.nextUrl.pathname.startsWith('/api/auth/')) {
    return NextResponse.next()
  }
  
  // Check session
  const session = await getSession(request)
  
  if (!session) {
    // Redirect to login
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // Verify user exists and has access
  const user = await getUserFromSession(session)
  
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // Continue to next middleware
  return NextResponse.next({
    request: {
      headers: {
        'x-user-id': user.id,
        'x-user-email': user.email,
        'x-team-id': user.currentTeamId,
      },
    },
  })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

### 3. SSO Provider Configuration

**OAuth 2.0 Configuration** (example: Google):

```typescript
// lib/auth/oauth-providers.ts

export const googleOAuthConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/google`,
  scopes: ['openid', 'email', 'profile'],
}

// Handle OAuth callback
export async function handleCallback(code: string, provider: string) {
  const tokens = await exchangeCodeForTokens(code, provider)
  const profile = await getUserProfile(tokens, provider)
  
  // Find or create user
  let user = await prisma.user.findUnique({
    where: {
      ssoId_ssoProvider: {
        ssoId: profile.id,
        ssoProvider: provider,
      },
    },
  })
  
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: profile.email,
        name: profile.name,
        avatar: profile.picture,
        ssoProvider: provider,
        ssoId: profile.id,
        ssoEmail: profile.email,
      },
    })
  }
  
  // Create session
  const session = await createSession(user.id)
  return session
}
```

### 4. SAML Integration (Enterprise)

**For Okta, Azure AD, etc.**

```typescript
// lib/auth/saml.ts

export const samlConfig = {
  entryPoint: process.env.SAML_ENTRY_POINT!,
  issuer: process.env.SAML_ISSUER!,
  cert: process.env.SAML_CERT!,
  identifierFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
  authnContext: 'urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport',
}

// SAML assertion handling
export async function handleSAMLAssertion(profile: Profile) {
  const user = await findOrCreateUserFromSAML({
    email: profile.email,
    name: profile.name,
    ssoProvider: 'saml',
    ssoId: profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'],
  })
  
  return createSession(user.id)
}
```

---

## Authentication & Authorization

### Session Management

```typescript
// lib/auth/session.ts

// Session stored in secure HTTP-only cookie
// Generated using crypto-secure token (32 bytes)
// Expires in 30 days (configurable)

export async function createSession(userId: string) {
  const token = generateSecureToken()
  
  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  })
  
  return {
    token,
    expiresAt: new Date(Math.max() + 30 * 24 * 60 * 60 * 1000),
  }
}

export async function getSession(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
  
  if (!token) return null
  
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  })
  
  if (!session || session.expiresAt < new Date()) {
    return null
  }
  
  return session
}
```

### Permission Checking

```typescript
// lib/auth/permissions.ts

export async function canViewProject(userId: string, projectId: string): Promise<boolean> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      owner: true,
      team: { include: { members: true } },
    },
  })
  
  if (!project) return false
  
  // Owner can always view
  if (project.owner?.id === userId) return true
  
  // Team members can view if member of team
  if (project.teamId) {
    const isMember = project.team?.members.some(m => m.userId === userId)
    return isMember || false
  }
  
  return false
}

export async function canEditTask(userId: string, taskId: string): Promise<boolean> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: {
        include: {
          owner: true,
          team: { include: { members: true } },
        },
      },
    },
  })
  
  if (!task) return false
  
  // Project owner can edit
  if (task.project.owner?.id === userId) return true
  
  // Team members with MANAGER+ role can edit
  if (task.project.teamId) {
    const member = task.project.team?.members.find(m => m.userId === userId)
    if (member && ['OWNER', 'ADMIN', 'MANAGER'].includes(member.role)) {
      return true
    }
  }
  
  // Assigned user can edit
  if (task.assignedToId === userId) return true
  
  return false
}
```

---

## Data Isolation & Security

### Row-Level Security (RLS) with Prisma

```typescript
// Ensure every query filters by user/team
// This becomes automatic with proper middleware

export async function getUserProjects(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      projects: true,  // Personal projects
      teams: {
        include: {
          projects: true,  // Team projects
        },
      },
    },
  })
  
  return [
    ...user?.projects || [],
    ...user?.teams.flatMap(t => t.projects) || [],
  ]
}

// API route with permission check
export async function GET(request: NextRequest) {
  const session = await getSession(request)
  if (!session) return respondUnauthorized()
  
  const projectId = request.nextUrl.searchParams.get('projectId')
  
  // Check permission
  const canView = await canViewProject(session.user.id, projectId!)
  if (!canView) return respondForbidden()
  
  // Only return data user can see
  const tasks = await prisma.task.findMany({
    where: { projectId },
  })
  
  return NextResponse.json(tasks)
}
```

### Data Privacy Layers

```typescript
// 1. Database-level (PostgreSQL Policy)
// Not yet implemented, but recommended for high-security deployments

// 2. Application-level (Middleware)
// Verify user has access to requested resource

// 3. Query filtering (Prisma)
// Automatically filter results by user/team

// 4. API response filtering
// Remove sensitive data from responses
export function filterProjectForUser(project, userId) {
  // Remove internal IDs if not owner
  if (project.ownerId !== userId) {
    delete project.internalNotes
  }
  return project
}
```

---

## Migration Path

### Phase 1: Basic Multi-User (Months 1-2)

**Goal**: Support multiple users with basic auth

```prisma
// Add to schema.prisma
model User { ... }
model Session { ... }
```

**Tasks**:
- [ ] Create User model in database
- [ ] Add Session management table
- [ ] Implement local username/password auth
- [ ] Migrate existing data to "default user"
- [ ] Add login/logout pages
- [ ] Add middleware for route protection

### Phase 2: Team Support (Months 2-3)

**Goal**: Teams can have multiple members

**Tasks**:
- [ ] Create Team model
- [ ] Create TeamMember model with roles
- [ ] Update Projects to support team ownership
- [ ] Add team creation/management UI
- [ ] Add member invitation system
- [ ] Update permissions to check team membership

### Phase 3: Google OAuth (Months 3-4)

**Goal**: Users can sign in with Google

**Tasks**:
- [ ] Add Google OAuth credentials to environment
- [ ] Implement OAuth callback handler
- [ ] Link existing users to Google accounts
- [ ] Add "Sign in with Google" button
- [ ] Test SSO flow end-to-end

### Phase 4: Additional SSO Providers (Months 4-5)

**Goal**: Support GitHub, Okta, Azure AD

**Tasks**:
- [ ] Add GitHub OAuth
- [ ] Add Okta SAML support
- [ ] Add Azure AD support
- [ ] Create unified SSO provider interface
- [ ] Update user linking logic for multiple providers

### Phase 5: Advanced Features (Months 6+)

**Goal**: Enterprise-grade features

**Tasks**:
- [ ] Organization management (multiple teams per user)
- [ ] Advanced RBAC (custom roles/permissions)
- [ ] Audit logging (who changed what, when)
- [ ] Single Logout (SAML SLO)
- [ ] Just-In-Time (JIT) provisioning
- [ ] SCIM integration for auto-provisioning

---

## Implementation Phases

### Timeline & Effort Estimation

| Phase | Feature | Effort | Timeline |
|-------|---------|--------|----------|
| 1 | Basic Auth (local) | 40 hours | 2 weeks |
| 1 | Data migration to users | 20 hours | 1 week |
| 2 | Team model & management | 60 hours | 3 weeks |
| 2 | Team-based permissions | 40 hours | 2 weeks |
| 3 | Google OAuth | 30 hours | 1.5 weeks |
| 4 | GitHub OAuth | 15 hours | 1 week |
| 4 | Okta SAML | 25 hours | 1.5 weeks |
| 5 | Advanced RBAC | 80 hours | 4 weeks |
| **Total** | | **310 hours** | **~8 months** |

---

## Security Considerations

### Authentication Security

- ✅ Use secure, random tokens (crypto module)
- ✅ Store session tokens in HTTP-only cookies
- ✅ Implement CSRF protection with tokens
- ✅ Enforce HTTPS in production (no HTTP)
- ✅ Set secure cookie flags:
  ```typescript
  response.cookies.set({
    name: 'auth-token',
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  })
  ```

### SSO Security

- ✅ Verify OAuth/SAML signatures server-side
- ✅ Validate redirect URIs are whitelisted
- ✅ Use PKCE for public client flows
- ✅ Store SSO secrets in environment variables
- ✅ Implement token refresh for long sessions
- ✅ Log all authentication events

### Data Access Security

- ✅ Implement row-level security
- ✅ Check permissions on every API call
- ✅ Validate user owns/has access to data
- ✅ Filter responses to remove unauthorized data
- ✅ Audit logging for sensitive operations

### Code Security

- ✅ No credentials in code
- ✅ Use environment variables for secrets
- ✅ Regular dependency updates
- ✅ Input validation on all endpoints
- ✅ SQL injection protection (Prisma handles)
- ✅ XSS protection (React handles, but validate)

### Ongoing Security

- [ ] Annual security audit
- [ ] Penetration testing (before public launch)
- [ ] Bug bounty program (future)
- [ ] Security incident response plan
- [ ] Regular backups with encryption
- [ ] SSL certificate monitoring

---

## Database Migration Strategy

### Step 1: Add User Tables (Non-Breaking)

```sql
-- Add alongside existing tables
ALTER TABLE Project ADD COLUMN teamId STRING NULLABLE;
ALTER TABLE Project ADD COLUMN owner_id STRING NULLABLE;

-- Existing data still works (no ownerId = personal/default)
```

### Step 2: Migrate Data to Default User

```sql
-- Create default user for existing data
INSERT INTO User (id, email, name, ssoProvider)
VALUES ('default-user', 'owner@example.com', 'Data Owner', NULL);

-- No need to update existing data (queries handle NULL ownerId)
```

### Step 3: Add Team Support

```sql
-- Teams are optional, default NULL
-- Existing personal projects continue working
```

### Step 4: Gradual Rollout

- ✅ Feature flag: `NEXT_PUBLIC_ENABLE_TEAMS=false` (default)
- ✅ Admins can enable for specific users
- ✅ Monitor adoption and issues
- ✅ Fully enable when stable

---

## API Changes for Multi-User

### Auth Endpoints

```typescript
POST /api/auth/register         # Legacy: disabled after Phase 1
POST /api/auth/login            # Username/password
POST /api/auth/logout           # Clear session
POST /api/auth/oauth/google     # OAuth callback
POST /api/auth/oauth/github     # OAuth callback
GET  /api/auth/me               # Get current user

POST /api/teams                 # Create team
GET  /api/teams                 # List user's teams
GET  /api/teams/:id             # Get team details
POST /api/teams/:id/members     # Add member
```

### Data Endpoints (Filtered by User)

```typescript
# These now automatically filter by user/team

GET  /api/projects              # Only user's projects
POST /api/projects              # Create (personal or team project)
GET  /api/projects/:id/tasks    # Only tasks user can see
POST /api/tasks                 # Create (must belong user's team/project)
```

---

## Rollback Plan

If multi-user deployment fails:

```bash
# 1. Revert to single-user schema
# - Remove User, Team, Session tables
# - Remove auth middleware
# - Deploy previous version

# 2. Restore data from backup (if needed)
pg_restore production_backup.sql

# 3. Notify users
# - Authentication temporarily unavailable
# - Use contact form for support
```

---

## Conclusion

This roadmap provides a clear path from single-user to enterprise-ready multi-user application with SSO support. The modular approach allows incremental rollout with minimal disruption to existing users.

**Key Design Principles:**
1. **Backwards compatible** - Existing single-user data continues working
2. **Phased rollout** - Each phase independent and testable
3. **Security-first** - Permission checks at every level
4. **Flexible** - Supports personal projects AND team collaboration
5. **Scalable** - Architecture supports thousands of teams

Start with Phase 1 when you're ready to support multiple users. Each subsequent phase adds value without breaking existing functionality.
