# Server — Backend Guide

Node.js + Express + TypeScript + Prisma + PostgreSQL.

## Stack

- Express (plain, no heavier framework like NestJS — keep it simple)
- Prisma ORM against PostgreSQL
- `zod` for request validation
- `jsonwebtoken` + `bcrypt` for auth
- `helmet`, `cors`, `express-rate-limit` for baseline security
- No test framework set up yet — don't add one unless asked

## Folder structure

```
server/
  src/
    routes/          one file per resource (patients.routes.ts, visits.routes.ts, ...)
    controllers/      request/response handling, calls services
    services/         business logic, talks to Prisma
    middleware/        auth.ts, tenantScope.ts, errorHandler.ts, validate.ts
    integrations/
      whatsapp/         provider-agnostic interface + one adapter (e.g. aisensy.adapter.ts)
    lib/               prisma client singleton, config loader
    types/
  prisma/
    schema.prisma
    migrations/
  .env.example
```

## Conventions

- **Controllers stay thin.** All business logic and Prisma calls live in `services/`. A controller parses/validates the request, calls a service, returns the response.
- **Every service function that touches clinic data takes `clinicId` as an explicit parameter** — never fetch it implicitly from a global. This makes tenant isolation visible and reviewable in every function signature.
- **Validation:** define a `zod` schema per route input, validate in middleware before the controller runs. Reject early with a 400 and a clear message.
- **Error handling:** throw typed errors (`NotFoundError`, `ValidationError`, `ForbiddenError`) from services; a single `errorHandler` middleware converts them to consistent JSON responses (`{ error: { code, message } }`). Never leak raw Prisma/stack errors to the client.
- **Auth middleware** attaches `req.user` (`{ id, clinicId, role }`) after verifying the JWT. A separate `requireRole('ADMIN')` middleware gates admin-only routes.
- **WhatsApp integration:** all sending goes through the `WhatsAppProvider` interface in `integrations/whatsapp/`. Routes and services never call a BSP's SDK directly — only the adapter does. This keeps a future provider switch to one file.
- **Migrations:** always use `prisma migrate dev` locally and commit the generated migration. Never hand-edit generated SQL unless there's a specific reason, and note that reason in the migration file.
- **Naming:** camelCase for variables/functions, PascalCase for types/models, kebab-case for file names except Prisma models which follow Prisma's PascalCase convention.

## Multi-tenancy checklist for every new endpoint

- [ ] Does the query filter by `clinicId`?
- [ ] Is `clinicId` taken from `req.user`, never from the request body/params?
- [ ] Does the role check match who should be allowed to call this (Admin vs Front Desk)?

## Out of scope for now

- Automated tests
- Background job queue (BullMQ/Redis) for scheduled reminders — flag with a `// TODO(phase2)` comment where relevant, don't build it yet
- Direct Meta WhatsApp Cloud API integration — always go through a BSP
