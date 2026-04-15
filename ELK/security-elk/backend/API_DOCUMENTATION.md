# Security Incident Response API Documentation

Base URL: `http://<SERVER_IP>:5001`  
Authentication: `Authorization: Bearer <JWT_TOKEN>`

## Authentication

### `POST /api/auth/register`
Creates a new user and returns a token.

```json
{
  "username": "analyst01",
  "email": "analyst@company.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "department": "IT Security",
  "departmentId": "69df3b3fd7d1b53419bd0764",
  "role": "analyst"
}
```

### `POST /api/auth/login`
Returns JWT plus the current user profile.

Response user fields now include:
- `department`: legacy display name kept for compatibility
- `departmentId`: canonical department reference
- `departmentDetails`: `{ id, name, code, isActive } | null`

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "69de10b99483fb26418de666",
    "username": "admin",
    "email": "admin@security.local",
    "firstName": "System",
    "lastName": "Administrator",
    "role": "admin",
    "department": "IT Security",
    "departmentId": "69df3b3fd7d1b53419bd0764",
    "departmentDetails": {
      "id": "69df3b3fd7d1b53419bd0764",
      "name": "IT Security",
      "code": "IT_SECURITY",
      "isActive": true
    },
    "isActive": true
  }
}
```

### `GET /api/auth/me`
Returns the authenticated user with the same fields as login.

### `PUT /api/auth/me`
Updates editable fields of the current user.

```json
{
  "firstName": "John",
  "lastName": "Smith",
  "department": "Cyber Security"
}
```

### `PUT /api/auth/change-password`
Changes the current user password.

## User Management

### `GET /api/auth/users`
Admin-only paginated user list.

Query params:
- `page`
- `limit`
- `role`
- `isActive`
- `departmentId`

Response user objects include:
- `department`
- `departmentId`
- `departmentDetails`

### `PUT /api/auth/users/:id`
Admin-only update for user role, status, and department assignment.

Supported payload fields:

```json
{
  "role": "analyst",
  "isActive": true,
  "department": "IT Security",
  "departmentId": "69df3b3fd7d1b53419bd0764"
}
```

Notes:
- If `departmentId` is valid and active, backend also syncs `department` to the canonical department name.
- If `departmentId` is set to `null` or empty, the canonical link is cleared.
- During the compatibility phase, `department` string is still preserved.

## Department Management

All endpoints below are admin-only.

### `GET /api/departments`
List departments for admin screens and user assignment dropdowns.

Query params:
- `isActive`
- `q`
- `sortBy`: `name | code | createdAt | updatedAt | sortOrder`
- `sortDir`: `asc | desc`

Response item:

```json
{
  "id": "69df3b3fd7d1b53419bd0764",
  "name": "IT Security",
  "code": "IT_SECURITY",
  "description": "",
  "manager": null,
  "parentDepartment": {
    "id": "69df3b3fd7d1b53419bd076f",
    "name": "Management",
    "code": "MANAGEMENT",
    "isActive": true
  },
  "isActive": true,
  "sortOrder": 0,
  "createdAt": "2026-04-15T07:16:15.027Z",
  "updatedAt": "2026-04-15T07:16:15.027Z"
}
```

### `GET /api/departments/:id`
Get one department by id.

### `POST /api/departments`
Create a department.

```json
{
  "name": "Threat Hunting",
  "code": "THREAT_HUNTING",
  "description": "Handles proactive threat hunting.",
  "parentDepartment": "69df3b3fd7d1b53419bd0764",
  "sortOrder": 10
}
```

### `PUT /api/departments/:id`
Update one or more department fields.

Supported fields:

```json
{
  "name": "Threat Hunting",
  "description": "Updated scope.",
  "parentDepartment": "69df3b3fd7d1b53419bd0764",
  "isActive": true,
  "sortOrder": 20
}
```

Hierarchy rules:
- `parentDepartment` must reference an active department
- a department cannot be its own parent
- cycles are rejected
- setting `parentDepartment` to `null` clears the link

### `DELETE /api/departments/:id`
Soft-delete only. Sets `isActive=false`.

Restriction:
- departments with active child departments cannot be deactivated until child links are removed or children are deactivated

## Existing Feature APIs

These endpoints were regression-checked after department rollout:
- `GET /api/dashboard/stats`
- `GET /api/dashboard/recent-incidents?limit=20`
- `GET /api/alerts?limit=20`
- `GET /api/incidents?limit=20`
- `GET /health`

## Migration Runbook

### Dry run
```bash
docker exec backend npm run migrate:departments:dry-run
```

Expected post-migration steady-state:
- `usersWouldUpdate = 0`
- `departmentsCreated = 0`

### Apply migration
```bash
docker exec backend npm run migrate:departments
```

What the migration does:
- normalizes legacy `User.department`
- creates canonical `Department` rows only if missing
- backfills `User.departmentId`
- keeps `User.department` for compatibility
- is safe to rerun

## Docker Deployment Order

Recommended order for future environments:

1. Create a MongoDB backup.
```bash
docker exec mongodb sh -lc "mongodump --uri='mongodb://<USER>:<PASS>@localhost:27017/security_incidents?authSource=admin' --archive=/tmp/security_incidents_departments_<STAMP>.archive.gz --gzip"
docker cp mongodb:/tmp/security_incidents_departments_<STAMP>.archive.gz ./security-elk/backups/mongodb/security_incidents_departments_<STAMP>.archive.gz
```

2. Rebuild compatible backend and frontend images.
```bash
docker compose up -d --build backend frontend
```

3. Wait for health:
- backend `healthy`
- mongodb `healthy`
- frontend `up`

4. Run migration dry-run.
```bash
docker exec backend npm run migrate:departments:dry-run
```

5. Apply migration if dry-run output is correct.
```bash
docker exec backend npm run migrate:departments
```

6. Re-run dry-run to confirm idempotency.

7. Verify:
- `GET /health`
- login as admin
- `GET /api/departments`
- `GET /api/auth/users`
- frontend routes `/users` and `/departments`

## Rollback Guidance

- Do not drop the `departments` collection blindly.
- First restore users to legacy-only mode:
  - set `departmentId = null`
  - restore or keep `department` string
- Verify login and `/api/auth/users` first.
- Only then decide whether migration-created departments should be deactivated or removed.

## Deferred For Phase 2

- Department-specific ACL
- Multi-department membership
- Incident ownership by department
- Department analytics dashboard
