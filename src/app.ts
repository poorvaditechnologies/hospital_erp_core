import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import { config } from "./lib/config";
import { errorHandler } from "./middleware/errorHandler";
import { openApiSpec } from "./docs/openapi";
import authRoutes from "./modules/auth/auth.routes";
import patientRoutes from "./modules/patients/patients.routes";
import visitRoutes from "./modules/visits/visits.routes";
import staffRoutes from "./modules/staff/staff.routes";
import templateRoutes from "./modules/templates/templates.routes";
import kitOrderRoutes from "./modules/kit-orders/kitOrders.routes";
import reportRoutes from "./modules/reports/reports.routes";
import superAdminRoutes from "./modules/super-admin/superAdmin.routes";
import clinicRoutes from "./modules/clinic/clinic.routes";

export const app = express();

// Swagger UI needs inline scripts/styles; CSP stays off rather than carving out
// a one-route exception, since this is an internal API with no browser-rendered pages.
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: config.clientUrl, credentials: true }));
app.use(express.json());
app.use(cookieParser());

const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 300 });
app.use("/api", apiLimiter);

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.get("/api/docs.json", (_req, res) => res.json(openApiSpec));
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/visits", visitRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/kit-orders", kitOrderRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/super-admin", superAdminRoutes);
app.use("/api/clinic", clinicRoutes);

app.use(errorHandler);
