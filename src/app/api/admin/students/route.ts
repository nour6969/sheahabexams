import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { handleApiError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/security";

export async function GET() {
  try {
    await requireAuth(Role.ADMIN);

    const students = await prisma.user.findMany({
      where: { role: Role.STUDENT },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        phone: true,
        parentPhone: true,
        createdAt: true,
        results: {
          orderBy: { submittedAt: "desc" },
          select: {
            id: true,
            score: true,
            timedOut: true,
            submittedAt: true,
            exam: {
              select: {
                id: true,
                title: true,
                branch: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({ students });
  } catch (error) {
    return handleApiError(error);
  }
}
