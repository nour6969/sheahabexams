import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { ApiError, handleApiError } from "@/lib/errors";
import { assertRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/security";
import { submitExamSchema } from "@/lib/validation";

type RouteContext = {
  params: Promise<{
    examId: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth(Role.STUDENT);
    const { examId } = await context.params;

    await assertRateLimit(request, {
      scope: "exam:submit",
      limit: 5,
      windowSeconds: 60,
      identity: `${user.id}:${examId}`
    });

    const payload = submitExamSchema.parse(await request.json());

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      select: {
        id: true,
        durationMinutes: true,
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
                text: true,
                isCorrect: true
              }
            }
          }
        }
      }
    });

    if (!exam) {
      throw new ApiError(404, "Exam not found.");
    }

    const attempt = await prisma.examAttempt.findFirst({
      where: {
        userId: user.id,
        examId: exam.id,
        submittedAt: null
      },
      orderBy: {
        startedAt: "desc"
      }
    });

    if (!attempt) {
      throw new ApiError(400, "Start the exam before submitting answers.");
    }

    const questionsById = new Map(exam.questions.map((question) => [question.id, question]));
    const seenQuestionIds = new Set<string>();
    const submittedAnswersByQuestionId = new Map<string, string>();

    for (const answer of payload.answers) {
      if (seenQuestionIds.has(answer.questionId)) {
        throw new ApiError(400, "Duplicate answers are not allowed.");
      }

      seenQuestionIds.add(answer.questionId);
      const question = questionsById.get(answer.questionId);

      if (!question) {
        throw new ApiError(400, "One or more submitted questions do not belong to this exam.");
      }

      const selectedChoice = question.choices.find(
        (choice) => choice.id === answer.selectedChoiceId
      );

      if (!selectedChoice) {
        throw new ApiError(400, "One or more selected choices do not belong to their question.");
      }

      submittedAnswersByQuestionId.set(answer.questionId, answer.selectedChoiceId);
    }

    const totalQuestions = exam.questions.length;
    const review = exam.questions.map((question) => {
      const selectedChoiceId = submittedAnswersByQuestionId.get(question.id) ?? null;
      const selectedChoice = selectedChoiceId
        ? question.choices.find((choice) => choice.id === selectedChoiceId)
        : null;
      const correctChoice = question.choices.find((choice) => choice.isCorrect);

      if (!correctChoice) {
        throw new ApiError(500, "Exam has a question without a correct answer.");
      }

      const isCorrect = Boolean(selectedChoice?.isCorrect);

      return {
        questionId: question.id,
        questionText: question.text,
        questionImageUrl: question.imageUrl,
        selectedChoiceId,
        selectedChoiceText: selectedChoice?.text ?? null,
        correctChoiceText: correctChoice.text,
        isCorrect
      };
    });
    const correctAnswers = review.filter((answer) => answer.isCorrect).length;
    const score = totalQuestions === 0 ? 0 : Math.round((correctAnswers / totalQuestions) * 100);
    const now = new Date();
    const timedOut = now.getTime() > attempt.expiresAt.getTime();

    const result = await prisma.$transaction(async (tx) => {
      const createdResult = await tx.result.create({
        data: {
          userId: user.id,
          examId: exam.id,
          attemptId: attempt.id,
          score,
          timedOut,
          answers: {
            create: review
          }
        },
        select: {
          id: true,
          score: true,
          timedOut: true,
          submittedAt: true,
          answers: {
            orderBy: {
              createdAt: "asc"
            },
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

      await tx.examAttempt.update({
        where: { id: attempt.id },
        data: {
          submittedAt: createdResult.submittedAt
        }
      });

      return createdResult;
    });

    return NextResponse.json({
      result,
      score,
      correctAnswers,
      totalQuestions,
      timedOut,
      review: result.answers
    });
  } catch (error) {
    return handleApiError(error);
  }
}
