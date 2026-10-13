import { NextFunction, Request, Response } from "express";
import * as templateService from "../services/template.service";

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const templates = await templateService.listTemplates(req.user!.clinicId);
    res.json({ templates });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const template = await templateService.createTemplate(req.user!.clinicId, req.body);
    res.status(201).json({ template });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const template = await templateService.updateTemplate(req.user!.clinicId, req.params.id, req.body);
    res.json({ template });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await templateService.deleteTemplate(req.user!.clinicId, req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function send(req: Request, res: Response, next: NextFunction) {
  try {
    const logs = await templateService.sendTemplateToPatients(
      req.user!.clinicId,
      req.params.id,
      req.body.patientIds,
      req.user!.id,
    );
    res.json({ logs });
  } catch (err) {
    next(err);
  }
}

export async function listLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const logs = await templateService.listMessageLogs(req.user!.clinicId);
    res.json({ logs });
  } catch (err) {
    next(err);
  }
}
