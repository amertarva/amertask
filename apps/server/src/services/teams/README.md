# Teams Service

Service untuk manajemen tim/proyek, termasuk CRUD operations, member management, dan invite system.

## Struktur File

### 📁 Core Files

#### `teams.service.ts` (Main Entry Point)

File utama yang mengexport semua fungsi dan types. File ini hanya berisi import dan re-export dari file-file lain.

**Exports:**

- `teamsService` - Object dengan semua fungsi teams
- Types: `TeamInviteRole`, `Team`, `TeamMember`, `TeamStats`, dll

### 📁 Module Files

#### `teams-types.ts`

Berisi semua interface dan types untuk teams.

**Exports:**

- `TeamInviteRole` - Type untuk role undangan ("admin" | "member" | "pm")
- `Team` - Interface untuk data team lengkap
- `TeamMember` - Interface untuk data member team
- `TeamStats` - Interface untuk statistik team
- `TeamInviteData` - Interface untuk data undangan
- `CreateTeamPayload` - Interface untuk payload create team
- `UpdateTeamSettingsPayload` - Interface untuk payload update settings

#### `teams-utils.ts`

Utility functions dan helpers untuk teams.

**Exports:**

- `TEAM_INVITE_TYPE` - Konstanta type untuk JWT invite
- `DEFAULT_INVITE_EXPIRY_HOURS` - Default expiry (72 jam)
- `MAX_INVITE_EXPIRY_HOURS` - Max expiry (7 hari)
- `getFrontendBaseUrl()` - Get frontend URL dari env
- `isTeamInviteRole()` - Type guard untuk role
- `normalizeInviteExpiryHours()` - Normalize expiry hours
- `getInviteTeam()` - Get team untuk invite
- `isDuplicateMembershipError()` - Check duplicate error

#### `teams-query.service.ts`

Query operations untuk teams (read-only).

**Exports:**

- `getUserTeams()` - Get semua teams user (dengan role)
- `getTeamBySlug()` - Get team by slug
- `getTeamStats()` - Get statistik team (issues count)
- `getTeamMembers()` - Get semua members team
- `getTeamMemberDetail()` - Get detail satu member

**Features:**

- Multi-user identity resolution (email + userId)
- Role priority handling (owner > pm > admin > member)
- Optimized queries dengan JOIN
- Deduplication logic

#### `teams-mutate.service.ts`

Mutation operations untuk teams (create, update, delete).

**Exports:**

- `createTeam()` - Create team baru
- `updateTeamSettings()` - Update team settings
- `deleteTeam()` - Delete team (cascade delete issues & members)

**Features:**

- Slug uniqueness validation
- Auto-add creator as PM
- Rollback on error
- Field filtering untuk security

#### `teams-members.service.ts`

Member management operations.

**Exports:**

- `removeTeamMember()` - Remove member dari team
- `leaveTeam()` - User keluar dari team

**Features:**

- Permission checks (owner/admin/pm only)
- Owner protection (tidak bisa dikeluarkan/keluar)
- Multi-identity handling
- Role-based removal rules

#### `teams-invite.service.ts`

Invite system untuk mengundang member baru.

**Exports:**

- `createTeamInviteLink()` - Create invite link dengan JWT token
- `previewTeamInvite()` - Preview invite sebelum accept
- `acceptTeamInvite()` - Accept invite dan join team
- `rejectTeamInvite()` - Reject invite

**Features:**

- JWT-based invite tokens
- Configurable expiry (1 jam - 7 hari)
- Role assignment (admin/member/pm)
- Duplicate membership handling
- Token validation

## Cara Penggunaan

### Import Service

```typescript
import { teamsService } from "../services/teams.service";
```

### Query Operations

#### Get User Teams

```typescript
const teams = await teamsService.getUserTeams(userId, email);
// Returns: Array of teams with role
```

#### Get Team by Slug

```typescript
const team = await teamsService.getTeamBySlug("PROJ-001");
// Returns: Team object
```

#### Get Team Stats

```typescript
const stats = await teamsService.getTeamStats(teamId);
// Returns: { totalIssues, openIssues, inProgress, completed }
```

#### Get Team Members

```typescript
const members = await teamsService.getTeamMembers(teamId);
// Returns: Array of TeamMember
```

### Mutation Operations

#### Create Team

```typescript
const team = await teamsService.createTeam(userId, {
  slug: "PROJ",
  name: "My Project",
  type: "tugas", // optional
});
```

#### Update Team Settings

```typescript
const updated = await teamsService.updateTeamSettings(teamId, {
  name: "New Name",
  description: "New description",
  github_repo: "https://github.com/...",
});
```

#### Delete Team

```typescript
const deleted = await teamsService.deleteTeam(teamId);
// Cascade deletes: issues, members
```

### Member Management

#### Remove Member

```typescript
const result = await teamsService.removeTeamMember({
  teamId,
  requesterRole: "admin",
  requesterUserId,
  requesterEmail,
  memberUserId,
});
```

#### Leave Team

```typescript
const result = await teamsService.leaveTeam({
  teamId,
  userRole: "member",
  userId,
  email,
});
```

### Invite System

#### Create Invite Link

```typescript
const invite = await teamsService.createTeamInviteLink({
  teamId,
  inviterId: userId,
  inviterEmail: email,
  inviterName: "John Doe",
  role: "member", // or "admin", "pm"
  expiresInHours: 72, // optional, default 72
});
// Returns: { inviteToken, inviteUrl, role, expiresAt, team }
```

#### Preview Invite

```typescript
const preview = await teamsService.previewTeamInvite(token, userId, email);
// Returns: { team, role, expiresAt, alreadyMember, existingRole }
```

#### Accept Invite

```typescript
const result = await teamsService.acceptTeamInvite(token, userId, email);
// Returns: { joined, alreadyMember, membershipRole, team }
```

#### Reject Invite

```typescript
const result = await teamsService.rejectTeamInvite(token);
// Returns: { rejected, message, team }
```

## Permission System

### Roles Hierarchy

1. **owner** - Team owner (dari `teams.owner_id`)
2. **pm** - Project Manager
3. **admin** - Administrator
4. **member** - Regular member

### Permission Rules

**Remove Member:**

- Owner/Admin/PM can remove members
- Only owner can remove admin/pm
- Cannot remove owner
- Cannot remove self (use leaveTeam)

**Leave Team:**

- Any member can leave (except owner)
- Owner must transfer ownership first

**Update Settings:**

- Handled by controller/middleware (not in service)

**Delete Team:**

- Handled by controller/middleware (not in service)

## Multi-Identity Support

Service mendukung multiple user identities (email + userId):

- `resolveCandidateUserIds()` - Get all possible user IDs
- `resolveExistingUserId()` - Get canonical user ID
- Digunakan untuk query memberships across identities

## Error Handling

Service menggunakan custom errors dari `lib/errors`:

- `errors.notFound()` - Resource tidak ditemukan
- `errors.forbidden()` - Permission denied
- `errors.badRequest()` - Invalid input
- `errors.conflict()` - Duplicate/conflict
- `errors.internal()` - Internal server error

## Architecture Benefits

### ✅ Separation of Concerns

- **Query** - Read operations
- **Mutate** - Write operations
- **Members** - Member management
- **Invite** - Invite system
- **Utils** - Shared utilities
- **Types** - Type definitions

### ✅ Maintainability

- Mudah menemukan fungsi tertentu
- File lebih kecil dan fokus
- Clear responsibility per file

### ✅ Reusability

- Functions dapat digunakan ulang
- Shared utilities di utils file
- Type safety dengan TypeScript

### ✅ Testability

- Easy to unit test individual functions
- Mock dependencies per module
- Clear input/output contracts

## Migration Notes

File `teams.service.ts` yang lama sudah dipecah menjadi 6 file module. Semua exports tetap tersedia melalui file utama `teams.service.ts`, jadi **tidak ada breaking changes** untuk code yang sudah ada.

```typescript
// Masih bisa digunakan seperti biasa
import { teamsService } from "../services/teams.service";
await teamsService.getUserTeams(userId, email);
```

## Database Schema

### Tables Used

- `teams` - Team data
- `team_members` - Team memberships
- `issues` - Team issues (for stats & cascade delete)
- `users` - User profiles (JOIN)

### Key Relationships

- `teams.owner_id` → `users.id`
- `team_members.team_id` → `teams.id`
- `team_members.user_id` → `users.id`
- `issues.team_id` → `teams.id`
