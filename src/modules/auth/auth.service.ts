import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { prisma } from "../../lib/prisma";
import { config } from "../../lib/config";
import { UnauthorizedError } from "../../types/errors";

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

interface TokenUser {
  id: string;
  clinicId: string;
  role: import("@prisma/client").UserRole;
}

function signAccessToken(user: TokenUser) {
  return jwt.sign(
    { id: user.id, clinicId: user.clinicId, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn as jwt.SignOptions["expiresIn"] },
  );
}

function signRefreshToken(user: TokenUser) {
  return jwt.sign({ id: user.id }, config.jwtRefreshSecret, {
    expiresIn: config.jwtRefreshExpiresIn as jwt.SignOptions["expiresIn"],
  });
}

export async function login(phone: string, password: string) {
  const user = await prisma.user.findFirst({
    where: { phone },
    include: { clinic: { select: { id: true, name: true, category: true, isActive: true } } },
  });
  if (!user) throw new UnauthorizedError("Invalid phone number or password");

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) throw new UnauthorizedError("Invalid phone number or password");

  if (!user.isActive) {
    throw new UnauthorizedError("This account has been deactivated — contact your clinic admin");
  }

  if (!user.clinic.isActive && !user.isSuperAdmin) {
    throw new UnauthorizedError("This clinic's access has been suspended — contact support");
  }

  const tokenUser: TokenUser = { id: user.id, clinicId: user.clinicId, role: user.role };
  const accessToken = signAccessToken(tokenUser);
  const refreshToken = signRefreshToken(tokenUser);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      clinicId: user.clinicId,
      isSuperAdmin: user.isSuperAdmin,
    },
    clinic: user.clinic,
  };
}

export async function forgotPassword(phone: string) {
  const user = await prisma.user.findFirst({ where: { phone } });

  // Always respond the same way whether or not the phone matches, to avoid leaking
  // which phone numbers have accounts.
  if (!user) return;

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    },
  });

  // TODO(phase2): send rawToken to the user via SMS/email through a real provider.
  // No SMS/email provider is wired up yet, so log it for local/dev testing instead.
  console.log(`Password reset token for user ${user.id} (${user.phone}): ${rawToken}`);

  return config.nodeEnv === "production" ? undefined : rawToken;
}

export async function resetPassword(token: string, newPassword: string) {
  const tokenHash = hashToken(token);
  const resetToken = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    throw new UnauthorizedError("This reset link is invalid or has expired");
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.$transaction([
    prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
  ]);
}

export async function refresh(refreshToken: string) {
  let payload: { id: string };
  try {
    payload = jwt.verify(refreshToken, config.jwtRefreshSecret) as { id: string };
  } catch {
    throw new UnauthorizedError("Invalid or expired refresh token");
  }

  const user = await prisma.user.findUnique({ where: { id: payload.id } });
  if (!user) throw new UnauthorizedError("User no longer exists");
  if (!user.isActive) throw new UnauthorizedError("This account has been deactivated");

  const tokenUser: TokenUser = { id: user.id, clinicId: user.clinicId, role: user.role };
  const accessToken = signAccessToken(tokenUser);
  const newRefreshToken = signRefreshToken(tokenUser);

  return { accessToken, refreshToken: newRefreshToken };
}
