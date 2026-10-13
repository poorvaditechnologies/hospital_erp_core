import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { UserRole } from "@prisma/client";
import { config } from "../lib/config";
import { ForbiddenError, UnauthorizedError } from "../types/errors";

interface AccessTokenPayload {
  id: string;
  clinicId: string;
  role: UserRole;
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!token) {
    return next(new UnauthorizedError("Missing access token"));
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret) as AccessTokenPayload;
    req.user = { id: payload.id, clinicId: payload.clinicId, role: payload.role };
    next();
  } catch {
    next(new UnauthorizedError("Invalid or expired access token"));
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ForbiddenError("You do not have access to this action"));
    }
    next();
  };
}
