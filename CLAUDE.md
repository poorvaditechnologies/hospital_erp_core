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

Feature-module layout: each domain owns its routes/controller/service together in one folder under `src/modules/`, instead of splitting by layer (`routes/`, `controllers/`, `services/`). Only genuinely cross-cutting code (auth/validation middleware, the Prisma client, shared types, the WhatsApp integration) lives outside `modules/`.

```
server/
  src/
    modules/
      auth/            auth.routes.ts, auth.controller.ts, auth.service.ts (login, refresh, forgot/reset password)
      super-admin/     superAdmin.routes.ts/.controller.ts/.service.ts — platform console: client + subscription CRUD
      clinic/          clinic.routes.ts/.controller.ts/.service.ts — clinic self-service (own clinic only)
      patients/        patients.routes.ts/.controller.ts/.service.ts, plus patients.visits.routes.ts (nested /:patientId/visits)
      visits/          visits.routes.ts (top-level /api/visits/:id), visit.controller.ts/.service.ts/.schemas.ts
      staff/
      templates/
      kit-orders/
      reports/
    middleware/        auth.ts, superAdmin.ts, errorHandler.ts, validate.ts
    integrations/
      whatsapp/         provider-agnostic interface + one adapter (e.g. stub.adapter.ts)
    lib/               prisma client singleton, config loader, shared constants
    types/
  prisma/
    schema.prisma
    migrations/
    seed.ts             demo Ayurvedic clinic + sample data, for local dev
    seedSuperAdmin.ts    creates only the platform super admin (npm run seed:super-admin)
  .env.example
```

A module's own controller/service import each other by bare relative path (`./auth.service`), never through a `../controllers`/`../services` layer folder. Cross-module imports are allowed when one domain genuinely depends on another (e.g. `patients.visits.routes.ts` importing the visit controller/schemas from `modules/visits/`) — keep these to a minimum and prefer colocating a schema/type in the module that owns the concept (visit schemas live in `modules/visits/visit.schemas.ts`, imported by both the nested patients route and the top-level visits route).

## Conventions

- **Controllers stay thin.** All business logic and Prisma calls live in `services/`. A controller parses/validates the request, calls a service, returns the response.
- **Every service function that touches clinic data takes `clinicId` as an explicit parameter** — never fetch it implicitly from a global. This makes tenant isolation visible and reviewable in every function signature.
- **Validation:** define a `zod` schema per route input, validate in middleware before the controller runs. Reject early with a 400 and a clear message.
- **Every write endpoint (POST/PATCH) takes `multipart/form-data`, not JSON.** Add `parseFormData` (from `src/middleware/formData.ts`, a bare `multer().none()`) before `validateBody` on every such route. Since form-data sends all values as strings, use the coercion helpers in `src/lib/zodFormData.ts` (`formBoolean`, `formArray`) or `z.coerce.number()` for any non-string field in the zod schema — plain `z.boolean()`/`z.number()`/`z.array()` will reject real form-data payloads.
- **API docs:** the OpenAPI spec is hand-maintained at `src/docs/openapi.ts` and served at `/api/docs` (Swagger UI) and `/api/docs.json` (raw spec) — add a path entry there whenever a route is added or changed so the frontend team's copy of the contract stays accurate.
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
