import { NextFunction, Request, Response } from "express";
import * as superAdminService from "../services/superAdmin.service";

export async function listClinics(_req: Request, res: Response, next: NextFunction) {
  try {
    const clinics = await superAdminService.listClinics();
    res.json({ clinics });
  } catch (err) {
    next(err);
  }
}
