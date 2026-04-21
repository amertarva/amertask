import { SignJWT, jwtVerify } from "jose";
import type { JWTPayload } from "../types";

const JWT_SECRET =
  process.env.JWT_SECRET || "super-secret-min-32-chars-long-string";
const secret = new TextEncoder().encode(JWT_SECRET);

function readRequiredStringClaim(value: unknown, field: string): string {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }

  throw new Error(`Token tidak valid: claim ${field} tidak ditemukan`);
}

function readOptionalStringClaim(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }

  return undefined;
}

function readRoleClaim(value: unknown): JWTPayload["role"] {
  return value === "owner" ||
    value === "admin" ||
    value === "member" ||
    value === "pm"
    ? value
    : undefined;
}

export async function signJWT(
  payload: JWTPayload,
  expiresIn: string,
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret);
}

export async function verifyJWT(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, secret);

  return {
    sub: readRequiredStringClaim(payload.sub, "sub"),
    email: readRequiredStringClaim(payload.email, "email"),
    name: readRequiredStringClaim(payload.name, "name"),
    type: readOptionalStringClaim(payload.type),
    teamId: readOptionalStringClaim(payload.teamId),
    teamSlug: readOptionalStringClaim(payload.teamSlug),
    teamName: readOptionalStringClaim(payload.teamName),
    role: readRoleClaim(payload.role),
    invitedBy: readOptionalStringClaim(payload.invitedBy),
    iat: typeof payload.iat === "number" ? payload.iat : undefined,
    exp: typeof payload.exp === "number" ? payload.exp : undefined,
  };
}

export async function generateTokens(user: {
  id: string;
  email: string;
  name: string;
}) {
  const accessToken = await signJWT(
    { sub: user.id, email: user.email, name: user.name },
    process.env.JWT_ACCESS_EXPIRES || "15m",
  );

  const refreshToken = await signJWT(
    { sub: user.id, email: user.email, name: user.name },
    process.env.JWT_REFRESH_EXPIRES || "7d",
  );

  return { accessToken, refreshToken };
}
