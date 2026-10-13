import { NextFunction, Request, Response } from "express";
import * as patientService from "../services/patient.service";

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const page = req.query.page ? Number(req.query.page) : 1;
    const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 8;

    const { patients, total } = await patientService.listPatients(
      req.user!.clinicId,
      search,
      page,
      pageSize,
    );

    res.json({
      patients,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try {
    const patient = await patientService.getPatient(req.user!.clinicId, req.params.id);
    res.json({ patient });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const patient = await patientService.createPatient(req.user!.clinicId, req.body);
    res.status(201).json({ patient });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const patient = await patientService.updatePatient(req.user!.clinicId, req.params.id, req.body);
    res.json({ patient });
  } catch (err) {
    next(err);
  }
}
