import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { config } from "../lib/config";
import { UnauthorizedError } from "../types/errors";

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
  const user = await prisma.user.findFirst({ where: { phone } });
  if (!user) throw new UnauthorizedError("Invalid phone number or password");

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) throw new UnauthorizedError("Invalid phone number or password");

  if (!user.isActive) {
    throw new UnauthorizedError("This account has been deactivated — contact your clinic admin");
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
  };
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
