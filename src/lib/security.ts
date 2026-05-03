import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { Role } from "@prisma/client";
import { ApiError } from "@/lib/errors";

export const SESSION_COOKIE = "shehab_star_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export type AuthUser = {
  id: string;
  name: string;
  phone: string;
  role: Role;
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be set to at least 32 characters.");
  }

  return new TextEncoder().encode(secret);
}

export function normalizePhone(phone: string) {
  return phone.trim().replace(/[^\d+]/g, "");
}

export function cleanText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export async function createSessionToken(user: AuthUser) {
  return new SignJWT({
    name: user.name,
    phone: user.phone,
    role: user.role
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getJwtSecret());
}

export async function verifySessionToken(token: string): Promise<AuthUser> {
  const { payload } = await jwtVerify(token, getJwtSecret());

  if (!payload.sub || !payload.name || !payload.phone || !payload.role) {
    throw new ApiError(401, "Invalid session.");
  }

  if (payload.role !== Role.ADMIN && payload.role !== Role.STUDENT) {
    throw new ApiError(401, "Invalid session role.");
  }

  return {
    id: payload.sub,
    name: String(payload.name),
    phone: String(payload.phone),
    role: payload.role
  };
}

export async function getAuthUserFromCookie() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

export async function requireAuth(requiredRole?: Role) {
  const user = await getAuthUserFromCookie();

  if (!user) {
    throw new ApiError(401, "Authentication required.");
  }

  if (requiredRole && user.role !== requiredRole) {
    throw new ApiError(403, "You do not have permission to access this resource.");
  }

  return user;
}

export const secureCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS
};
