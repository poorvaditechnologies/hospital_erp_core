import { NextFunction, Request, Response } from "express";
import * as authService from "./auth.service";
import { config } from "../../lib/config";
import { prisma } from "../../lib/prisma";

const REFRESH_COOKIE = "refreshToken";

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { phone, password } = req.body;
    const { accessToken, refreshToken, user, clinic } = await authService.login(phone, password);

    res.cookie(REFRESH_COOKIE, refreshToken, {
      httpOnly: true,
      secure: config.nodeEnv === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ accessToken, user, clinic });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (!token) {
      return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Missing refresh token" } });
    }

    const { accessToken, refreshToken } = await authService.refresh(token);

    res.cookie(REFRESH_COOKIE, refreshToken, {
      httpOnly: true,
      secure: config.nodeEnv === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ accessToken });
  } catch (err) {
    next(err);
  }
}

export function logout(_req: Request, res: Response) {
  res.clearCookie(REFRESH_COOKIE);
  res.status(204).send();
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { clinic: { select: { id: true, name: true, category: true, isActive: true } } },
    });
    if (!user) {
      return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "User no longer exists" } });
    }
    res.json({
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        clinicId: user.clinicId,
        isSuperAdmin: user.isSuperAdmin,
      },
      clinic: user.clinic,
    });
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { phone } = req.body;
    const devToken = await authService.forgotPassword(phone);
    res.json({
      message: "If an account exists for this phone number, a reset link has been sent.",
      ...(devToken ? { devToken } : {}),
    });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { token, newPassword } = req.body;
    await authService.resetPassword(token, newPassword);
    res.json({ message: "Password updated — you can now sign in with your new password." });
  } catch (err) {
    next(err);
  }
}
