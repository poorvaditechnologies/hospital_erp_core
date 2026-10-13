import { NextFunction, Request, Response } from "express";
import * as visitService from "../services/visit.service";

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const visits = await visitService.listVisitsForPatient(req.user!.clinicId, req.params.patientId);
    res.json({ visits });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const visit = await visitService.createVisit(req.user!.clinicId, req.params.patientId, req.body);
    res.status(201).json({ visit });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const visit = await visitService.updateVisit(req.user!.clinicId, req.params.id, req.body);
    res.json({ visit });
  } catch (err) {
    next(err);
  }
}
