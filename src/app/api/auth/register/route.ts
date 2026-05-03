import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { handleApiError, ApiError } from "@/lib/errors";
import { assertRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { createSessionToken, secureCookieOptions, SESSION_COOKIE } from "@/lib/security";
import { registerSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    await assertRateLimit(request, {
      scope: "auth:register:ip",
      limit: 8,
      windowSeconds: 60 * 10
    });

    const payload = registerSchema.parse(await request.json());

    await assertRateLimit(request, {
      scope: "auth:register:phone",
      limit: 4,
      windowSeconds: 60 * 10,
      identity: payload.phone
    });

    const existingUser = await prisma.user.findUnique({
      where: { phone: payload.phone },
      select: { id: true }
    });

    if (existingUser) {
      throw new ApiError(409, "A student with this phone number already exists.");
    }

    const user = await prisma.user.create({
      data: {
        name: payload.name,
        phone: payload.phone,
        parentPhone: payload.parentPhone,
        passwordHash: await bcrypt.hash(payload.password, 12),
        role: Role.STUDENT
      },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true
      }
    });

    const response = NextResponse.json({ user }, { status: 201 });
    response.cookies.set(SESSION_COOKIE, await createSessionToken(user), secureCookieOptions);
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
