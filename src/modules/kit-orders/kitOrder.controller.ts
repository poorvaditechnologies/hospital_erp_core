import { NextFunction, Request, Response } from "express";
import * as kitOrderService from "./kitOrder.service";

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const kitOrders = await kitOrderService.listKitOrders(req.user!.clinicId);
    res.json({ kitOrders });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const kitOrder = await kitOrderService.createKitOrder(req.user!.clinicId, req.body);
    res.status(201).json({ kitOrder });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const kitOrder = await kitOrderService.updateKitOrder(req.user!.clinicId, req.params.id, req.body);
    res.json({ kitOrder });
  } catch (err) {
    next(err);
  }
}
