import { NextFunction, Request, Response } from "express";
import * as reportService from "./report.service";

export async function summary(req: Request, res: Response, next: NextFunction) {
  try {
    const summary = await reportService.getSummary(req.user!.clinicId, req.user!.role === "ADMIN");
    res.json({ summary });
  } catch (err) {
    next(err);
  }
}

export async function dashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await reportService.getDashboardData(req.user!.clinicId, req.user!.role === "ADMIN");
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function insights(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await reportService.getReportInsights(req.user!.clinicId);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function exportPatientsCsv(req: Request, res: Response, next: NextFunction) {
  try {
    const csv = await reportService.getPatientsCsv(req.user!.clinicId);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=patients.csv");
    res.send(csv);
  } catch (err) {
    next(err);
  }
}

export async function exportVisitsCsv(req: Request, res: Response, next: NextFunction) {
  try {
    const csv = await reportService.getVisitsCsv(req.user!.clinicId);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=visits.csv");
    res.send(csv);
  } catch (err) {
    next(err);
  }
}

export async function exportKitOrdersCsv(req: Request, res: Response, next: NextFunction) {
  try {
    const csv = await reportService.getKitOrdersCsv(req.user!.clinicId);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=kit-orders.csv");
    res.send(csv);
  } catch (err) {
    next(err);
  }
}
