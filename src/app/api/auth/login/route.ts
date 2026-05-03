import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { handleApiError, ApiError } from "@/lib/errors";
import { assertRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { createSessionToken, secureCookieOptions, SESSION_COOKIE } from "@/lib/security";
import { loginSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    await assertRateLimit(request, {
      scope: "auth:login:ip",
      limit: 10,
      windowSeconds: 60 * 10
    });

    const payload = loginSchema.parse(await request.json());

    await assertRateLimit(request, {
      scope: "auth:login:phone",
      limit: 6,
      windowSeconds: 60 * 10,
      identity: payload.phone
    });

    const user = await prisma.user.findUnique({
      where: { phone: payload.phone }
    });

    const isValid = user ? await bcrypt.compare(payload.password, user.passwordHash) : false;

    if (!user || !isValid) {
      throw new ApiError(401, "Invalid phone number or password.");
    }

    const authUser = {
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role
    };

    const response = NextResponse.json({ user: authUser });
    response.cookies.set(SESSION_COOKIE, await createSessionToken(authUser), secureCookieOptions);
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
