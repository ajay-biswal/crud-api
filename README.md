# CodeForge API

An early-stage Git hosting platform built on Node.js, Express, MongoDB, and native Git.

## Current functionality

- Existing user CRUD endpoints.
- Repository metadata CRUD endpoints.
- Creates a bare Git repository when repository metadata is created.
- Uses a server-generated UUID for the internal Git storage key.
- Stores bare repositories under `CODEFORGE_STORAGE_PATH`, or under `.codeforge/repositories` during local development.

## Setup

1. Install Node.js, pnpm, Git, and MongoDB.
2. Copy `.env.example` to `.env` and configure `MONGO_URI`.
3. Optionally set `CODEFORGE_STORAGE_PATH` to an absolute path outside the public web root.
4. Install dependencies with `pnpm install`.
5. Start the API with `pnpm dev`.

## Repository creation API

`POST /api/repositories`

Example request body:

```json
{
  "name": "sample-project",
  "description": "A sample repository",
  "visibility": "private",
  "ownerId": "REPLACE_WITH_AN_EXISTING_USER_OBJECT_ID"
}
```

A successful response confirms that repository metadata was created and a bare Git repository initialized.

## Important limitations

This is a development prototype, not production-ready Git hosting.

- Authentication and authorization are not implemented. Do not expose this API publicly.
- The `ownerId` request field is temporary and is not proof of ownership.
- Git HTTP/SSH transport is not implemented yet; clients cannot push or clone through CodeForge at this stage.
- Deleting repository metadata does not delete its bare Git storage.
- Backups, quotas, abuse controls, audit logging, and production hardening remain future work.
