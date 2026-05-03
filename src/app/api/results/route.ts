import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { handleApiError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/security";

export async function GET() {
  try {
    const user = await requireAuth(Role.STUDENT);

    const results = await prisma.result.findMany({
      where: { userId: user.id },
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
    });

    return NextResponse.json({ results });
  } catch (error) {
    return handleApiError(error);
  }
}
