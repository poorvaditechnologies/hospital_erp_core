import { NextFunction, Request, Response } from "express";
import * as superAdminService from "./superAdmin.service";

export async function listClients(req: Request, res: Response, next: NextFunction) {
  try {
    const { search, category, status } = req.query as {
      search?: string;
      category?: "AYURVEDIC" | "DENTAL";
      status?: "TRIAL" | "ACTIVE" | "SUSPENDED" | "CANCELLED";
    };
    const clients = await superAdminService.listClients({ search, category, status });
    res.json({ clients });
  } catch (err) {
    next(err);
  }
}

export async function getClient(req: Request, res: Response, next: NextFunction) {
  try {
    const client = await superAdminService.getClient(req.params.id);
    res.json({ client });
  } catch (err) {
    next(err);
  }
}

export async function createClient(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await superAdminService.createClient(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateClient(req: Request, res: Response, next: NextFunction) {
  try {
    const clinic = await superAdminService.updateClient(req.params.id, req.body);
    res.json({ clinic });
  } catch (err) {
    next(err);
  }
}

export async function updateSubscription(req: Request, res: Response, next: NextFunction) {
  try {
    const subscription = await superAdminService.updateSubscription(req.params.id, {
      ...req.body,
      renewsAt: req.body.renewsAt ? new Date(req.body.renewsAt) : undefined,
    });
    res.json({ subscription });
  } catch (err) {
    next(err);
  }
}

export async function suspendClient(req: Request, res: Response, next: NextFunction) {
  try {
    const clinic = await superAdminService.setClientActive(req.params.id, false);
    res.json({ clinic });
  } catch (err) {
    next(err);
  }
}

export async function activateClient(req: Request, res: Response, next: NextFunction) {
  try {
    const clinic = await superAdminService.setClientActive(req.params.id, true);
    res.json({ clinic });
  } catch (err) {
    next(err);
  }
}

export async function deleteClient(req: Request, res: Response, next: NextFunction) {
  try {
    await superAdminService.deleteClient(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
