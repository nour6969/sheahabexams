import { MathBranch } from "@prisma/client";
import { z } from "zod";
import { cleanText, normalizePhone } from "@/lib/security";

const text = (min = 1, max = 2000) =>
  z.string().min(min).max(max).transform((value) => cleanText(value));

export const registerSchema = z.object({
  name: text(2, 80),
  phone: z
    .string()
    .min(8)
    .max(24)
    .transform((value) => normalizePhone(value)),
  parentPhone: z
    .string()
    .min(8)
    .max(24)
    .transform((value) => normalizePhone(value)),
  password: z.string().min(8).max(128)
});

export const loginSchema = z.object({
  phone: z
    .string()
    .min(8)
    .max(24)
    .transform((value) => normalizePhone(value)),
  password: z.string().min(8).max(128)
});

export const choiceInputSchema = z.object({
  text: text(1, 500),
  isCorrect: z.boolean()
});

export const questionInputSchema = z.object({
  text: text(1, 2000),
  imageUrl: z
    .string()
    .trim()
    .max(500)
    .optional()
    .nullable()
    .transform((value) => (value ? value : null)),
  choices: z.array(choiceInputSchema).min(2).max(6)
});

export const examInputSchema = z
  .object({
    title: text(3, 120),
    branch: z.nativeEnum(MathBranch),
    durationMinutes: z.coerce.number().int().min(1).max(300),
    questions: z.array(questionInputSchema).min(1).max(100)
  })
  .superRefine((exam, ctx) => {
    exam.questions.forEach((question, index) => {
      const correctCount = question.choices.filter((choice) => choice.isCorrect).length;

      if (correctCount !== 1) {
        ctx.addIssue({
          code: "custom",
          path: ["questions", index, "choices"],
          message: "Each question must define exactly one correct choice."
        });
      }

      if (
        question.imageUrl &&
        !question.imageUrl.startsWith("/uploads/questions/") &&
        !question.imageUrl.startsWith("https://")
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["questions", index, "imageUrl"],
          message: "Question images must be uploaded through the portal or use HTTPS."
        });
      }
    });
  });

export const submitExamSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1).max(80),
        selectedChoiceId: z.string().min(1).max(80)
      })
    )
    .max(150)
});
