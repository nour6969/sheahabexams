import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { ApiError, handleApiError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/security";
import { examInputSchema } from "@/lib/validation";

type RouteContext = {
  params: Promise<{
    examId: string;
  }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth();
    const { examId } = await context.params;

    if (user.role === Role.ADMIN) {
      const exam = await prisma.exam.findUnique({
        where: { id: examId },
        include: {
          questions: {
            include: {
              choices: true
            },
            orderBy: { createdAt: "asc" }
          }
        }
      });

      if (!exam) {
        throw new ApiError(404, "Exam not found.");
      }

      return NextResponse.json({ exam });
    }

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      select: {
        id: true,
        title: true,
        branch: true,
        durationMinutes: true,
        createdAt: true,
        questions: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            text: true,
            imageUrl: true,
            choices: {
              orderBy: { createdAt: "asc" },
              select: {
                id: true,
                text: true
              }
            }
          }
        }
      }
    });

    if (!exam) {
      throw new ApiError(404, "Exam not found.");
    }

    const existingAttempt = await prisma.examAttempt.findFirst({
      where: {
        userId: user.id,
        examId,
        submittedAt: null
      },
      orderBy: {
        startedAt: "desc"
      },
      select: {
        id: true,
        startedAt: true,
        expiresAt: true
      }
    });

    const attempt =
      existingAttempt ??
      (await prisma.examAttempt.create({
        data: {
          userId: user.id,
          examId,
          expiresAt: new Date(Date.now() + exam.durationMinutes * 60 * 1000)
        },
        select: {
          id: true,
          startedAt: true,
          expiresAt: true
        }
      }));

    return NextResponse.json({ exam: { ...exam, attempt } });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    await requireAuth(Role.ADMIN);
    const { examId } = await context.params;
    const payload = examInputSchema.parse(await request.json());

    const exam = await prisma.$transaction(async (tx) => {
      const existingExam = await tx.exam.findUnique({
        where: { id: examId },
        select: { id: true }
      });

      if (!existingExam) {
        throw new ApiError(404, "Exam not found.");
      }

      await tx.choice.deleteMany({
        where: {
          question: {
            examId
          }
        }
      });

      await tx.question.deleteMany({
        where: {
          examId
        }
      });

      return tx.exam.update({
        where: { id: examId },
        data: {
          title: payload.title,
          branch: payload.branch,
          durationMinutes: payload.durationMinutes,
          questions: {
            create: payload.questions.map((question) => ({
              text: question.text,
              imageUrl: question.imageUrl,
              choices: {
                create: question.choices.map((choice) => ({
                  text: choice.text,
                  isCorrect: choice.isCorrect
                }))
              }
            }))
          }
        },
        select: {
          id: true,
          title: true,
          branch: true,
          durationMinutes: true,
          updatedAt: true
        }
      });
    });

    return NextResponse.json({ exam });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    await requireAuth(Role.ADMIN);
    const { examId } = await context.params;

    await prisma.exam.delete({
      where: { id: examId }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
