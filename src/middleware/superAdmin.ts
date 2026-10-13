import { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { ForbiddenError } from "../types/errors";

export async function requireSuperAdmin(req: Request, _res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user?.isSuperAdmin) {
      return next(new ForbiddenError("Vendor access only"));
    }
    next();
  } catch (err) {
    next(err);
  }
}
