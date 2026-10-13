import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { config } from "./lib/config";
import { errorHandler } from "./middleware/errorHandler";
import authRoutes from "./routes/auth.routes";
import patientRoutes from "./routes/patients.routes";
import visitRoutes from "./routes/visit.routes";
import staffRoutes from "./routes/staff.routes";
import templateRoutes from "./routes/templates.routes";
import kitOrderRoutes from "./routes/kitOrders.routes";
import reportRoutes from "./routes/reports.routes";
import superAdminRoutes from "./routes/superAdmin.routes";
import clinicRoutes from "./routes/clinic.routes";

export const app = express();

app.use(helmet());
app.use(cors({ origin: config.clientUrl, credentials: true }));
app.use(express.json());
app.use(cookieParser());

const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 300 });
app.use("/api", apiLimiter);

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

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
