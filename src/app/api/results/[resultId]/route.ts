import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { ApiError, handleApiError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/security";

type RouteContext = {
  params: Promise<{
    resultId: string;
  }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth();
    const { resultId } = await context.params;

    const result = await prisma.result.findUnique({
      where: { id: resultId },
      select: {
        id: true,
        userId: true,
        score: true,
        timedOut: true,
        submittedAt: true,
        exam: {
          select: {
            id: true,
            title: true,
            branch: true
          }
        },
        answers: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            questionId: true,
            questionText: true,
            questionImageUrl: true,
            selectedChoiceId: true,
            selectedChoiceText: true,
            correctChoiceText: true,
            isCorrect: true
          }
        }
      }
    });

    if (!result) {
      throw new ApiError(404, "Result not found.");
    }

    if (user.role !== Role.ADMIN && result.userId !== user.id) {
      throw new ApiError(403, "You do not have permission to view this result.");
    }

    const { userId: _userId, ...safeResult } = result;
    return NextResponse.json({ result: safeResult });
  } catch (error) {
    return handleApiError(error);
  }
}
