import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { handleApiError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/security";
import { examInputSchema } from "@/lib/validation";

export async function GET() {
  try {
    const user = await requireAuth();

    const exams = await prisma.exam.findMany({
      orderBy: [{ branch: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        branch: true,
        durationMinutes: true,
        createdAt: true,
        _count: {
          select: {
            questions: true,
            results: true
          }
        },
        results:
          user.role === Role.STUDENT
            ? {
                where: { userId: user.id },
                orderBy: { submittedAt: "desc" },
                take: 1,
                select: {
                  id: true,
                  score: true,
                  submittedAt: true
                }
              }
            : false
      }
    });

    return NextResponse.json({ exams });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth(Role.ADMIN);
    const payload = examInputSchema.parse(await request.json());

    const exam = await prisma.exam.create({
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
        createdAt: true
      }
    });

    return NextResponse.json({ exam }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
