# Database schema and migration plan

## Current production schema

The live schema is in `prisma/schema.prisma`.

Core models:
- `User`
- `Organization`
- `OrganizationMembership`
- `Project`
- `Hook`
- `Content`
- `ScheduledPost`
- `BrandVoice`
- `ConnectedAccount`
- `UsageEvent`
- `JobRecord`
- `AuditLog`

## Multi-tenant strategy

Current state:
- `Project` still has `userId` as the primary ownership boundary.
- `organizationId` has been added as an optional tenant boundary.
- `OrganizationMembership` supports owner/admin/member style role checks.

Recommended enforcement path:
1. Keep `userId` checks for single-player creator workflows.
2. Add `organizationId` to new projects when Team plan is active.
3. Require membership checks for organization-scoped projects.
4. Move team billing and usage limits to organization-level records.

## Indexing strategy

Existing indexes:
- `User(plan, createdAt)`
- `Project(userId, createdAt)`
- `Project(organizationId, createdAt)`
- `Project(sourceType)`
- `Hook(projectId, reachScore)`
- `Content(projectId, platform, order)`
- `Content(approved)`
- `ScheduledPost(userId, status, scheduledAt)`
- `BrandVoice(userId)`
- `ConnectedAccount(userId)`
- `UsageEvent(userId, eventType, createdAt)`
- `JobRecord(userId, status, createdAt)`
- `AuditLog(userId, createdAt)`
- `AuditLog(organizationId, createdAt)`

## Audit logging

Implemented:
- `AuditLog` model
- `recordAuditLog` helper
- Project create, schedule create, and checkout order audit entries

Add next:
- Content edit
- Content approve/reject
- Export download
- Integration connect/disconnect
- Billing webhook processed

## Migration plan

Development:
1. Run `npx prisma generate`.
2. Run `npx prisma db push` against development Supabase.
3. Run `npm run seed`.

Production:
1. Rotate exposed credentials before migrating.
2. Take Supabase backup.
3. Create migration from current schema with `prisma migrate dev`.
4. Review SQL for lock-heavy operations.
5. Apply during low traffic with `prisma migrate deploy`.
6. Run seed only for required static data, not demo projects.

## RLS policy plan

Supabase RLS should mirror app ownership rules:
- Users can read/update their own user record.
- Users can read projects where `Project.userId = auth.uid()` mapping is resolved through `User.supabaseId`.
- Organization members can read organization projects.
- Only owners/admins can manage memberships and connected accounts.
- Service role can run jobs and billing updates.

## Data retention

Recommended:
- Keep transcripts until project deletion.
- Compress transcripts larger than 50 KB before storage.
- Keep audit logs for 365 days.
- Keep usage events for 24 months in aggregate, 180 days raw.
