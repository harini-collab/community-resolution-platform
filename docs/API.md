# API Documentation

Base URL: `http://localhost:5000/api`

Protected endpoints require:

```http
Authorization: Bearer <jwt>
```

## Auth

### POST `/auth/register`

Registers a citizen.

```json
{
  "name": "Citizen User",
  "email": "citizen@example.com",
  "password": "password123"
}
```

### POST `/auth/login`

Returns `{ user, token }`.

```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

### GET `/auth/me`

Returns the authenticated user.

## Issues

### GET `/issues`

Role-scoped issue list.

- Citizen: own issues
- Officer: issues assigned to officer department
- Admin: all issues

### POST `/issues`

Citizen only. `multipart/form-data`.

Fields:

- `title`
- `description`
- `category`
- `latitude`
- `longitude`
- `address` optional
- `assigned_department` optional
- `predicted_category`, `confidence_score`, `suggested_department`, `priority_level`, `severity_level` optional AI confirmation fields
- `image` optional file

### GET `/issues/:id`

Returns an issue, remarks, public timeline, evidence, and nearby issue suggestions. Access is role scoped.

### GET `/issues/public/recent-resolved`

Returns recently resolved, citizen verified, or closed issues for the public homepage feed.

### GET `/issues/public/map`

Returns recent database-backed map markers for public transparency views.

### PATCH `/issues/:id/assign`

Admin only.

```json
{
  "department_id": "uuid-or-null",
  "officer_id": "uuid-or-null"
}
```

### PATCH `/issues/:id/status`

Officer or admin. `multipart/form-data`.

Fields:

- `status`: `Reported`, `Assigned`, `In Progress`, `Resolved`, `Citizen Verified`, or `Closed`
- `remark` required for `Resolved`, `Citizen Verified`, or `Closed`
- `resolution_timestamp` required for `Resolved`, `Citizen Verified`, or `Closed`
- `proof` required image file for `Resolved`, `Citizen Verified`, or `Closed`

Emits `issue:updated` over Socket.io.

### POST `/issues/:id/vote`

Citizen only. Adds a community priority vote.

### POST `/issues/:id/follow`

Citizen only. Subscribes the citizen to issue updates.

### PATCH `/issues/:id/verify`

Citizen only. Moves a resolved issue to `Citizen Verified` and stores satisfaction rating.

### PATCH `/issues/:id/escalate`

Marks an issue as emergency escalated and raises priority/severity.

## Departments

### GET `/departments`

Authenticated users.

### POST `/departments`

Admin only.

```json
{
  "name": "Roads",
  "description": "Road repairs and hazards"
}
```

### PUT `/departments/:id`

Admin only.

### DELETE `/departments/:id`

Admin only.

## Users

### GET `/users`

Admin only.

### POST `/users`

Admin only. Creates citizen, officer, or admin.

```json
{
  "name": "Officer",
  "email": "officer2@example.com",
  "password": "password123",
  "role": "officer",
  "department_id": "uuid"
}
```

### PUT `/users/:id`

Admin only. Updates name, role, and department assignment.

### DELETE `/users/:id`

Admin only.

## Dashboard

### GET `/dashboard/stats`

Admin only. Returns total issues, lifecycle counts, department performance, average response/resolution time, and leaderboard metrics.

### GET `/dashboard/public`

Returns public real-time platform statistics for the homepage.

## AI Mock

### POST `/ai/analyze-image`

Authenticated users. `multipart/form-data` with `image`.

Response:

```json
{
  "category": "Pothole",
  "predictedCategory": "Pothole",
  "confidenceScore": 88,
  "suggestedDepartment": "Road Maintenance",
  "priorityLevel": "High",
  "severity": "High",
  "generatedTitle": "High report needing department review",
  "generatedDescription": "The uploaded evidence appears related to pothole..."
}
```

### POST `/ai/classify`

Authenticated users. Classifies title/description and returns predicted category, confidence score, suggested department, priority, and severity.

## Socket.io

URL: `http://localhost:5000`

Client joins:

- `join:user` with user id
- `join:department` with department id
- `join:admins`

Server event:

- `issue:updated`
