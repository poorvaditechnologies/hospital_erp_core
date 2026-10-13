import { NextFunction, Request, Response } from "express";
import * as clinicService from "../services/clinic.service";

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try {
    const clinic = await clinicService.getClinic(req.user!.clinicId);
    res.json({ clinic });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const clinic = await clinicService.updateClinic(req.user!.clinicId, req.body);
    res.json({ clinic });
  } catch (err) {
    next(err);
  }
}
