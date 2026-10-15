// Hand-maintained OpenAPI 3.0 spec for the clinic management API, served via
// swagger-ui-express at /api/docs (and raw JSON at /api/docs.json) so the
// frontend team has a live, browsable, shareable contract.
//
// Every write endpoint (POST/PATCH/PUT) takes multipart/form-data, not JSON —
// this mirrors the backend's actual `parseFormData` + zod validation setup
// (see src/middleware/formData.ts), so "Try it out" in Swagger UI works
// against the real API as-is.

const bearerAuth = {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
  description: "Access token returned by POST /api/auth/login (send as `Authorization: Bearer <token>`).",
} as const;

const errorResponse = {
  description: "Error",
  content: {
    "application/json": {
      schema: {
        type: "object",
        properties: {
          error: {
            type: "object",
            properties: {
              code: { type: "string", example: "VALIDATION_ERROR" },
              message: { type: "string", example: "name: Required" },
            },
          },
        },
      },
    },
  },
};

function formBody(properties: Record<string, unknown>, required: string[] = []) {
  return {
    required: true,
    content: {
      "multipart/form-data": {
        schema: {
          type: "object",
          properties,
          required,
        },
      },
    },
  };
}

function jsonOk(schema: unknown, description = "OK") {
  return { description, content: { "application/json": { schema } } };
}

const clinicCategoryEnum = { type: "string", enum: ["AYURVEDIC", "DENTAL"] };
const subscriptionPlanEnum = { type: "string", enum: ["TRIAL", "STANDARD", "PREMIUM"] };
const subscriptionStatusEnum = { type: "string", enum: ["TRIAL", "ACTIVE", "SUSPENDED", "CANCELLED"] };
const userRoleEnum = { type: "string", enum: ["ADMIN", "FRONT_DESK", "DOCTOR"] };
const visitTypeEnum = { type: "string", enum: ["SWARNA_PRASHANA", "WALKIN", "CHECKUP"] };
const notesVisibilityEnum = { type: "string", enum: ["DOCTOR_ONLY", "ALL_STAFF"] };
const genderEnum = { type: "string", enum: ["MALE", "FEMALE", "OTHER"] };
const kitOrderStatusEnum = { type: "string", enum: ["PLACED", "SHIPPED", "DELIVERED", "CANCELLED"] };
const kitOrderPaymentStatusEnum = { type: "string", enum: ["PENDING", "PAID", "FAILED"] };
const templateCategoryEnum = { type: "string", enum: ["UTILITY", "MARKETING", "AUTHENTICATION"] };

export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Clinic Management API",
    version: "1.0.0",
    description:
      "Multi-tenant clinic management API (Ayurvedic + Dental). Every write endpoint " +
      "(POST/PATCH) accepts `multipart/form-data`. Auth: call POST /api/auth/login to get " +
      "an access token, then send `Authorization: Bearer <token>` on subsequent requests. " +
      "The refresh token is set as an httpOnly cookie automatically.",
  },
  servers: [{ url: "/api", description: "Relative to API host" }],
  components: {
    securitySchemes: { bearerAuth },
    schemas: {
      User: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          phone: { type: "string" },
          role: userRoleEnum,
          clinicId: { type: "string" },
          isSuperAdmin: { type: "boolean" },
        },
      },
      ClinicSummary: {
        type: "object",
        properties: { id: { type: "string" }, name: { type: "string" }, category: clinicCategoryEnum, isActive: { type: "boolean" } },
      },
      Clinic: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          category: clinicCategoryEnum,
          phone: { type: "string" },
          address: { type: "string", nullable: true },
          isActive: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          subscription: { $ref: "#/components/schemas/Subscription" },
        },
      },
      Subscription: {
        type: "object",
        properties: {
          id: { type: "string" },
          clinicId: { type: "string" },
          plan: subscriptionPlanEnum,
          status: subscriptionStatusEnum,
          startedAt: { type: "string", format: "date-time" },
          renewsAt: { type: "string", format: "date-time", nullable: true },
          cancelledAt: { type: "string", format: "date-time", nullable: true },
        },
      },
      ClientListItem: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          category: clinicCategoryEnum,
          phone: { type: "string" },
          isActive: { type: "boolean" },
          plan: subscriptionPlanEnum,
          status: subscriptionStatusEnum,
          staffCount: { type: "integer" },
          patientCount: { type: "integer" },
          visitCount: { type: "integer" },
        },
      },
      ClientDetail: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          category: clinicCategoryEnum,
          phone: { type: "string" },
          address: { type: "string", nullable: true },
          isActive: { type: "boolean" },
          subscription: { $ref: "#/components/schemas/Subscription" },
          owner: { type: "object", nullable: true, properties: { id: { type: "string" }, name: { type: "string" }, phone: { type: "string" } } },
          staffCount: { type: "integer" },
          patientCount: { type: "integer" },
          visitCount: { type: "integer" },
        },
      },
      Patient: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          phone: { type: "string" },
          dob: { type: "string", format: "date-time", nullable: true },
          gender: { ...genderEnum, nullable: true },
          email: { type: "string", nullable: true },
          bloodGroup: { type: "string", nullable: true },
          guardianName: { type: "string", nullable: true },
          address: { type: "string", nullable: true },
        },
      },
      Visit: {
        type: "object",
        properties: {
          id: { type: "string" },
          patientId: { type: "string" },
          doctorId: { type: "string", nullable: true },
          visitType: visitTypeEnum,
          visitDate: { type: "string", format: "date-time" },
          complaint: { type: "string", nullable: true },
          diagnosis: { type: "string", nullable: true },
          prescriptionNotes: { type: "string", nullable: true },
          nextFollowUpDate: { type: "string", format: "date-time", nullable: true },
          notesVisibility: notesVisibilityEnum,
        },
      },
      StaffMember: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          phone: { type: "string" },
          email: { type: "string", nullable: true },
          role: userRoleEnum,
          isActive: { type: "boolean" },
        },
      },
      Template: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          category: templateCategoryEnum,
          bodyText: { type: "string" },
          variables: { type: "array", items: { type: "string" } },
          approvalStatus: { type: "string", enum: ["DRAFT", "PENDING", "APPROVED", "REJECTED"] },
        },
      },
      KitOrder: {
        type: "object",
        properties: {
          id: { type: "string" },
          patientId: { type: "string", nullable: true },
          items: { type: "string" },
          quantity: { type: "integer" },
          amount: { type: "integer" },
          paymentStatus: kitOrderPaymentStatusEnum,
          status: kitOrderStatusEnum,
          shippingAddress: { type: "string" },
          orderDate: { type: "string", format: "date-time" },
          shippedDate: { type: "string", format: "date-time", nullable: true },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  tags: [
    { name: "Auth", description: "Login, session refresh, forgot/reset password" },
    { name: "Super Admin", description: "Platform console — client + subscription CRUD (super admin only)" },
    { name: "Clinic", description: "Self-service for the logged-in clinic" },
    { name: "Patients" },
    { name: "Visits" },
    { name: "Staff" },
    { name: "Templates", description: "WhatsApp message templates" },
    { name: "Kit Orders", description: "Ayurvedic kit product orders" },
    { name: "Reports" },
  ],
  paths: {
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Log in with phone + password",
        security: [],
        requestBody: formBody(
          { phone: { type: "string", example: "9999999999" }, password: { type: "string", example: "admin123" } },
          ["phone", "password"],
        ),
        responses: {
          200: jsonOk({
            type: "object",
            properties: {
              accessToken: { type: "string" },
              user: { $ref: "#/components/schemas/User" },
              clinic: { $ref: "#/components/schemas/ClinicSummary" },
            },
          }),
          401: errorResponse,
        },
      },
    },
    "/auth/refresh": {
      post: {
        tags: ["Auth"],
        summary: "Exchange the refresh-token cookie for a new access token",
        security: [],
        responses: { 200: jsonOk({ type: "object", properties: { accessToken: { type: "string" } } }), 401: errorResponse },
      },
    },
    "/auth/logout": {
      post: { tags: ["Auth"], summary: "Clear the refresh-token cookie", security: [], responses: { 204: { description: "No content" } } },
    },
    "/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get the current logged-in user + clinic",
        responses: {
          200: jsonOk({
            type: "object",
            properties: { user: { $ref: "#/components/schemas/User" }, clinic: { $ref: "#/components/schemas/ClinicSummary" } },
          }),
          401: errorResponse,
        },
      },
    },
    "/auth/forgot-password": {
      post: {
        tags: ["Auth"],
        summary: "Request a password reset token",
        description: "Always returns 200 regardless of whether the phone matches an account, to avoid leaking which numbers have accounts. In non-production, the response also includes `devToken` for testing since no SMS/email provider is wired up yet.",
        security: [],
        requestBody: formBody({ phone: { type: "string", example: "9999999999" } }, ["phone"]),
        responses: { 200: jsonOk({ type: "object", properties: { message: { type: "string" }, devToken: { type: "string" } } }) },
      },
    },
    "/auth/reset-password": {
      post: {
        tags: ["Auth"],
        summary: "Reset password using a token from /forgot-password",
        security: [],
        requestBody: formBody(
          { token: { type: "string" }, newPassword: { type: "string", minLength: 8 } },
          ["token", "newPassword"],
        ),
        responses: { 200: jsonOk({ type: "object", properties: { message: { type: "string" } } }), 401: errorResponse },
      },
    },

    "/super-admin/clients": {
      get: {
        tags: ["Super Admin"],
        summary: "List all clients (clinics)",
        parameters: [
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "category", in: "query", schema: clinicCategoryEnum },
          { name: "status", in: "query", schema: subscriptionStatusEnum },
        ],
        responses: { 200: jsonOk({ type: "object", properties: { clients: { type: "array", items: { $ref: "#/components/schemas/ClientListItem" } } } }), 403: errorResponse },
      },
      post: {
        tags: ["Super Admin"],
        summary: "Create a new client (clinic + owner admin account + subscription)",
        requestBody: formBody(
          {
            name: { type: "string" },
            category: clinicCategoryEnum,
            phone: { type: "string" },
            address: { type: "string" },
            plan: subscriptionPlanEnum,
            ownerName: { type: "string" },
            ownerPhone: { type: "string" },
            ownerEmail: { type: "string", format: "email" },
          },
          ["name", "category", "phone", "plan", "ownerName", "ownerPhone"],
        ),
        responses: {
          201: jsonOk({
            type: "object",
            properties: {
              clinic: { $ref: "#/components/schemas/Clinic" },
              subscription: { $ref: "#/components/schemas/Subscription" },
              owner: { type: "object", properties: { id: { type: "string" }, name: { type: "string" }, phone: { type: "string" }, email: { type: "string" } } },
              temporaryPassword: { type: "string", description: "Share this with the clinic owner — they should change it after first login." },
            },
          }),
          409: errorResponse,
        },
      },
    },
    "/super-admin/clients/{id}": {
      get: {
        tags: ["Super Admin"],
        summary: "Get client detail",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: jsonOk({ $ref: "#/components/schemas/ClientDetail" }), 404: errorResponse },
      },
      patch: {
        tags: ["Super Admin"],
        summary: "Update client core fields (including category — super admin only)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: formBody({
          name: { type: "string" },
          category: clinicCategoryEnum,
          phone: { type: "string" },
          address: { type: "string" },
        }),
        responses: { 200: jsonOk({ type: "object", properties: { clinic: { $ref: "#/components/schemas/Clinic" } } }), 404: errorResponse },
      },
      delete: {
        tags: ["Super Admin"],
        summary: "Delete a client (only if it has no patients/visits/orders — suspend instead otherwise)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 204: { description: "Deleted" }, 409: errorResponse, 404: errorResponse },
      },
    },
    "/super-admin/clients/{id}/subscription": {
      patch: {
        tags: ["Super Admin"],
        summary: "Update a client's subscription plan/status/renewal date",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: formBody({
          plan: subscriptionPlanEnum,
          status: subscriptionStatusEnum,
          renewsAt: { type: "string", format: "date-time" },
        }),
        responses: { 200: jsonOk({ type: "object", properties: { subscription: { $ref: "#/components/schemas/Subscription" } } }), 404: errorResponse },
      },
    },
    "/super-admin/clients/{id}/suspend": {
      post: {
        tags: ["Super Admin"],
        summary: "Suspend a client (blocks staff login, keeps data)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: jsonOk({ type: "object", properties: { clinic: { $ref: "#/components/schemas/Clinic" } } }), 404: errorResponse },
      },
    },
    "/super-admin/clients/{id}/activate": {
      post: {
        tags: ["Super Admin"],
        summary: "Reactivate a suspended client",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: jsonOk({ type: "object", properties: { clinic: { $ref: "#/components/schemas/Clinic" } } }), 404: errorResponse },
      },
    },

    "/clinic": {
      get: { tags: ["Clinic"], summary: "Get the logged-in user's own clinic", responses: { 200: jsonOk({ type: "object", properties: { clinic: { $ref: "#/components/schemas/Clinic" } } }) } },
      patch: {
        tags: ["Clinic"],
        summary: "Update own clinic (name/phone/address) — Admin role only",
        requestBody: formBody({ name: { type: "string" }, phone: { type: "string" }, address: { type: "string" } }),
        responses: { 200: jsonOk({ type: "object", properties: { clinic: { $ref: "#/components/schemas/Clinic" } } }), 403: errorResponse },
      },
    },

    "/patients": {
      get: {
        tags: ["Patients"],
        summary: "List patients (search + paginated)",
        parameters: [
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "page", in: "query", schema: { type: "integer" } },
          { name: "pageSize", in: "query", schema: { type: "integer" } },
        ],
        responses: { 200: jsonOk({ type: "object", properties: { patients: { type: "array", items: { $ref: "#/components/schemas/Patient" } } } }) },
      },
      post: {
        tags: ["Patients"],
        summary: "Create a patient",
        requestBody: formBody(
          {
            name: { type: "string" },
            phone: { type: "string" },
            dob: { type: "string", format: "date-time" },
            gender: genderEnum,
            email: { type: "string", format: "email" },
            bloodGroup: { type: "string" },
            guardianName: { type: "string" },
            address: { type: "string" },
          },
          ["name", "phone"],
        ),
        responses: { 201: jsonOk({ type: "object", properties: { patient: { $ref: "#/components/schemas/Patient" } } }), 400: errorResponse },
      },
    },
    "/patients/{id}": {
      get: { tags: ["Patients"], summary: "Get patient detail", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: jsonOk({ type: "object", properties: { patient: { $ref: "#/components/schemas/Patient" } } }), 404: errorResponse } },
      patch: {
        tags: ["Patients"],
        summary: "Update a patient",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: formBody({
          name: { type: "string" },
          phone: { type: "string" },
          dob: { type: "string", format: "date-time" },
          gender: genderEnum,
          email: { type: "string", format: "email" },
          bloodGroup: { type: "string" },
          guardianName: { type: "string" },
          address: { type: "string" },
        }),
        responses: { 200: jsonOk({ type: "object", properties: { patient: { $ref: "#/components/schemas/Patient" } } }), 404: errorResponse },
      },
    },
    "/patients/{patientId}/visits": {
      get: { tags: ["Visits"], summary: "List a patient's visits", parameters: [{ name: "patientId", in: "path", required: true, schema: { type: "string" } }], responses: { 200: jsonOk({ type: "object", properties: { visits: { type: "array", items: { $ref: "#/components/schemas/Visit" } } } }) } },
      post: {
        tags: ["Visits"],
        summary: "Log a new visit for a patient",
        parameters: [{ name: "patientId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: formBody(
          {
            visitType: visitTypeEnum,
            visitDate: { type: "string", format: "date-time" },
            complaint: { type: "string" },
            diagnosis: { type: "string" },
            prescriptionNotes: { type: "string" },
            nextFollowUpDate: { type: "string", format: "date-time" },
            notesVisibility: notesVisibilityEnum,
            doctorId: { type: "string" },
          },
          ["visitType"],
        ),
        responses: { 201: jsonOk({ type: "object", properties: { visit: { $ref: "#/components/schemas/Visit" } } }) },
      },
    },
    "/visits/{id}": {
      patch: {
        tags: ["Visits"],
        summary: "Update a visit (e.g. add diagnosis/notes after the fact)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: formBody({
          complaint: { type: "string" },
          diagnosis: { type: "string" },
          prescriptionNotes: { type: "string" },
          nextFollowUpDate: { type: "string", format: "date-time" },
          notesVisibility: notesVisibilityEnum,
        }),
        responses: { 200: jsonOk({ type: "object", properties: { visit: { $ref: "#/components/schemas/Visit" } } }), 404: errorResponse },
      },
    },

    "/staff": {
      get: { tags: ["Staff"], summary: "List staff (Admin only)", responses: { 200: jsonOk({ type: "object", properties: { staff: { type: "array", items: { $ref: "#/components/schemas/StaffMember" } } } }) } },
      post: {
        tags: ["Staff"],
        summary: "Create a staff account (Admin only)",
        requestBody: formBody(
          { name: { type: "string" }, phone: { type: "string" }, email: { type: "string", format: "email" }, password: { type: "string" }, role: userRoleEnum },
          ["name", "phone", "password", "role"],
        ),
        responses: { 201: jsonOk({ type: "object", properties: { staff: { $ref: "#/components/schemas/StaffMember" } } }) },
      },
    },
    "/staff/{id}": {
      patch: {
        tags: ["Staff"],
        summary: "Update a staff member's profile",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: formBody({ name: { type: "string" }, phone: { type: "string" }, email: { type: "string", format: "email" } }),
        responses: { 200: jsonOk({ type: "object", properties: { staff: { $ref: "#/components/schemas/StaffMember" } } }) },
      },
    },
    "/staff/{id}/role": {
      patch: {
        tags: ["Staff"],
        summary: "Change a staff member's role",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: formBody({ role: userRoleEnum }, ["role"]),
        responses: { 200: jsonOk({ type: "object", properties: { staff: { $ref: "#/components/schemas/StaffMember" } } }) },
      },
    },
    "/staff/{id}/active": {
      patch: {
        tags: ["Staff"],
        summary: "Activate/deactivate a staff member",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: formBody({ isActive: { type: "string", enum: ["true", "false"], description: "Sent as the string \"true\" or \"false\" in form-data." } }, ["isActive"]),
        responses: { 200: jsonOk({ type: "object", properties: { staff: { $ref: "#/components/schemas/StaffMember" } } }) },
      },
    },

    "/templates": {
      get: { tags: ["Templates"], summary: "List WhatsApp templates", responses: { 200: jsonOk({ type: "object", properties: { templates: { type: "array", items: { $ref: "#/components/schemas/Template" } } } }) } },
      post: {
        tags: ["Templates"],
        summary: "Create a template (Admin only)",
        requestBody: formBody(
          {
            name: { type: "string" },
            category: templateCategoryEnum,
            bodyText: { type: "string" },
            variables: { type: "array", items: { type: "string" }, description: "Repeat the field name for multiple values, e.g. variables=patientName&variables=date." },
          },
          ["name", "category", "bodyText"],
        ),
        responses: { 201: jsonOk({ type: "object", properties: { template: { $ref: "#/components/schemas/Template" } } }) },
      },
    },
    "/templates/{id}": {
      patch: {
        tags: ["Templates"],
        summary: "Update a template (Admin only)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: formBody({ name: { type: "string" }, category: templateCategoryEnum, bodyText: { type: "string" } }),
        responses: { 200: jsonOk({ type: "object", properties: { template: { $ref: "#/components/schemas/Template" } } }) },
      },
      delete: {
        tags: ["Templates"],
        summary: "Delete a template (Admin only)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 204: { description: "Deleted" } },
      },
    },
    "/templates/{id}/send": {
      post: {
        tags: ["Templates"],
        summary: "Send a template to one or more patients",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: formBody({ patientIds: { type: "array", items: { type: "string" } } }, ["patientIds"]),
        responses: { 200: jsonOk({ type: "object", properties: { sent: { type: "integer" } } }) },
      },
    },
    "/templates/logs/recent": {
      get: { tags: ["Templates"], summary: "Recent message send log", responses: { 200: jsonOk({ type: "object", properties: { logs: { type: "array", items: { type: "object" } } } }) } },
    },

    "/kit-orders": {
      get: { tags: ["Kit Orders"], summary: "List kit orders", responses: { 200: jsonOk({ type: "object", properties: { orders: { type: "array", items: { $ref: "#/components/schemas/KitOrder" } } } }) } },
      post: {
        tags: ["Kit Orders"],
        summary: "Create a kit order",
        requestBody: formBody(
          {
            patientId: { type: "string" },
            items: { type: "string" },
            quantity: { type: "string", example: "1", description: "Sent as a string in form-data, coerced to a number server-side." },
            amount: { type: "string", example: "499" },
            shippingAddress: { type: "string" },
          },
          ["items", "amount", "shippingAddress"],
        ),
        responses: { 201: jsonOk({ type: "object", properties: { order: { $ref: "#/components/schemas/KitOrder" } } }) },
      },
    },
    "/kit-orders/{id}": {
      patch: {
        tags: ["Kit Orders"],
        summary: "Update a kit order (status, payment status, etc.)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: formBody({
          items: { type: "string" },
          quantity: { type: "string" },
          amount: { type: "string" },
          shippingAddress: { type: "string" },
          status: kitOrderStatusEnum,
          paymentStatus: kitOrderPaymentStatusEnum,
        }),
        responses: { 200: jsonOk({ type: "object", properties: { order: { $ref: "#/components/schemas/KitOrder" } } }) },
      },
    },

    "/reports/summary": { get: { tags: ["Reports"], summary: "Dashboard summary stats", responses: { 200: jsonOk({ type: "object" }) } } },
    "/reports/dashboard": { get: { tags: ["Reports"], summary: "Dashboard widgets data", responses: { 200: jsonOk({ type: "object" }) } } },
    "/reports/insights": { get: { tags: ["Reports"], summary: "Analytics insights (Admin only)", responses: { 200: jsonOk({ type: "object" }) } } },
    "/reports/export/patients.csv": { get: { tags: ["Reports"], summary: "Export patients as CSV (Admin only)", responses: { 200: { description: "CSV file", content: { "text/csv": { schema: { type: "string" } } } } } } },
    "/reports/export/visits.csv": { get: { tags: ["Reports"], summary: "Export visits as CSV (Admin only)", responses: { 200: { description: "CSV file", content: { "text/csv": { schema: { type: "string" } } } } } } },
    "/reports/export/kit-orders.csv": { get: { tags: ["Reports"], summary: "Export kit orders as CSV (Admin only)", responses: { 200: { description: "CSV file", content: { "text/csv": { schema: { type: "string" } } } } } } },
  },
};
