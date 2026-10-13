import { NextFunction, Request, Response } from "express";
import * as staffService from "../services/staff.service";

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const staff = await staffService.listStaff(req.user!.clinicId);
    res.json({ staff });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const staff = await staffService.createStaff(req.user!.clinicId, req.body);
    res.status(201).json({ staff });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const staff = await staffService.updateStaff(req.user!.clinicId, req.params.id, req.body);
    res.json({ staff });
  } catch (err) {
    next(err);
  }
}

export async function updateRole(req: Request, res: Response, next: NextFunction) {
  try {
    const staff = await staffService.updateStaffRole(req.user!.clinicId, req.params.id, req.body.role);
    res.json({ staff });
  } catch (err) {
    next(err);
  }
}

export async function setActive(req: Request, res: Response, next: NextFunction) {
  try {
    const staff = await staffService.setStaffActive(
      req.user!.clinicId,
      req.params.id,
      req.user!.id,
      req.body.isActive,
    );
    res.json({ staff });
  } catch (err) {
    next(err);
  }
}
