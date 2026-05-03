"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Loader2,
  Send,
  ShieldCheck,
  XCircle
} from "lucide-react";
import { StarField } from "@/components/star-field";
import { getBranchLabel, type MathBranchValue } from "@/lib/branches";

type ExamQuestion = {
  id: string;
  text: string;
  imageUrl: string | null;
  choices: {
    id: string;
    text: string;
  }[];
};

type Exam = {
  id: string;
  title: string;
  branch: MathBranchValue;
  durationMinutes: number;
  attempt: {
    id: string;
    startedAt: string;
    expiresAt: string;
  };
  questions: ExamQuestion[];
};

type ReviewAnswer = {
  id: string;
  questionId: string;
  questionText: string;
  questionImageUrl: string | null;
  selectedChoiceId: string | null;
  selectedChoiceText: string | null;
  correctChoiceText: string;
  isCorrect: boolean;
};

type SubmissionResult = {
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  timedOut: boolean;
  review: ReviewAnswer[];
};

function formatTime(milliseconds: number | null) {
  if (milliseconds === null) {
    return "--:--";
  }

  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function ExamInterface({ examId }: { examId: string }) {
  const router = useRouter();
  const [exam, setExam] = useState<Exam | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeRemainingMs, setTimeRemainingMs] = useState<number | null>(null);
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const [timeExpiredNotice, setTimeExpiredNotice] = useState(false);
  const answersRef = useRef<Record<string, string>>({});
  const submittedRef = useRef(false);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    let isMounted = true;

    async function loadExam() {
      const response = await fetch(`/api/exams/${examId}`, { cache: "no-store" });
      const data = (await response.json().catch(() => null)) as
        | { exam?: Exam; message?: string }
        | null;

      if (!isMounted) {
        return;
      }

      if (!response.ok || !data?.exam) {
        setError(data?.message ?? "Exam could not be loaded.");
      } else {
        setExam(data.exam);
      }

      setIsLoading(false);
    }

    loadExam();

    return () => {
      isMounted = false;
    };
  }, [examId]);

  const answeredCount = useMemo(
    () => (exam ? exam.questions.filter((question) => answers[question.id]).length : 0),
    [answers, exam]
  );

  const submitExam = useCallback(
    async (timeExpired = false) => {
      if (!exam || submittedRef.current) {
        return;
      }

      submittedRef.current = true;
      setError("");
      setIsSubmitting(true);

      if (timeExpired) {
        setTimeExpiredNotice(true);
      }

      const currentAnswers = answersRef.current;
      const response = await fetch(`/api/exams/${exam.id}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          answers: exam.questions
            .filter((question) => currentAnswers[question.id])
            .map((question) => ({
              questionId: question.id,
              selectedChoiceId: currentAnswers[question.id]
            }))
        })
      });

      const data = (await response.json().catch(() => null)) as
        | (SubmissionResult & { message?: string })
        | null;

      setIsSubmitting(false);

      if (!response.ok || !data) {
        submittedRef.current = false;
        setError(data?.message ?? "Submission failed.");
        return;
      }

      setResult({
        score: data.score,
        correctAnswers: data.correctAnswers,
        totalQuestions: data.totalQuestions,
        timedOut: data.timedOut,
        review: data.review
      });
      router.refresh();
    },
    [exam, router]
  );

  useEffect(() => {
    if (!exam || result) {
      return;
    }

    const expiresAtMs = new Date(exam.attempt.expiresAt).getTime();
    const totalMs = Math.max(1, exam.durationMinutes * 60 * 1000);

    const tick = () => {
      const remaining = Math.max(0, expiresAtMs - Date.now());
      setTimeRemainingMs(remaining);

      if (remaining <= totalMs * 0.1) {
        setShowTimeWarning(true);
      }

      if (remaining <= 0) {
        void submitExam(true);
      }
    };

    tick();
    const intervalId = window.setInterval(tick, 1000);
    return () => window.clearInterval(intervalId);
  }, [exam, result, submitExam]);

  if (isLoading) {
    return (
      <main className="relative grid min-h-screen place-items-center text-white">
        <StarField />
        <Loader2 className="h-8 w-8 animate-spin text-yellow-200" />
      </main>
    );
  }

  if (!exam) {
    return (
      <main className="relative grid min-h-screen place-items-center px-4 text-white">
        <StarField />
        <div className="glass max-w-md rounded-3xl p-6 text-center">
          <p className="text-red-100">{error}</p>
          <Link href="/dashboard" className="mt-5 inline-block font-bold text-yellow-200">
            Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  if (result) {
    return (
      <main className="relative min-h-screen overflow-hidden px-4 py-10 text-white sm:px-6 lg:px-8">
        <StarField />
        <section className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-3xl p-6 text-center sm:p-8"
          >
            <CheckCircle2 className="mx-auto h-14 w-14 text-yellow-200" />
            <p className="mt-5 text-sm font-bold uppercase tracking-[0.2em] text-yellow-200">
              {result.timedOut || timeExpiredNotice ? "Time Ran Out" : "Exam Submitted"}
            </p>
            <h1 className="mt-3 text-5xl font-black">{result.score}%</h1>
            <p className="mt-4 text-slate-300">
              {result.correctAnswers} correct answers out of {result.totalQuestions}
            </p>
            {(result.timedOut || timeExpiredNotice) && (
              <p className="mx-auto mt-4 max-w-2xl rounded-2xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                The timer reached zero. Saved answers were submitted automatically, and unanswered
                questions were counted as wrong.
              </p>
            )}
          </motion.div>

          <div className="mt-6 space-y-4">
            {result.review.map((answer, index) => (
              <motion.article
                key={answer.id}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                className={`rounded-3xl border p-5 backdrop-blur ${
                  answer.isCorrect
                    ? "border-emerald-300/30 bg-emerald-500/10"
                    : "border-red-300/30 bg-red-500/10"
                }`}
              >
                <div className="flex items-start gap-3">
                  {answer.isCorrect ? (
                    <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-emerald-200" />
                  ) : (
                    <XCircle className="mt-1 h-5 w-5 shrink-0 text-red-200" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-yellow-100">Question {index + 1}</p>
                    <h2 className="mt-2 text-lg font-bold leading-7">{answer.questionText}</h2>
                    {answer.questionImageUrl && (
                      <div className="relative mt-4 aspect-video overflow-hidden rounded-2xl border border-white/10 bg-slate-950">
                        <Image
                          src={answer.questionImageUrl}
                          alt="Question visual"
                          fill
                          sizes="(max-width: 768px) 100vw, 768px"
                          className="object-contain"
                        />
                      </div>
                    )}
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                          Your answer
                        </p>
                        <p className="mt-2 font-semibold">
                          {answer.selectedChoiceText ?? "Empty"}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                          Correct answer
                        </p>
                        <p className="mt-2 font-semibold">{answer.correctChoiceText}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>

          <Link
            href="/dashboard"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-yellow-300 px-5 py-3 font-black text-slate-950 transition hover:bg-yellow-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
        </section>
      </main>
    );
  }

  const allAnswered = answeredCount === exam.questions.length;
  const timerDanger = (timeRemainingMs ?? Number.POSITIVE_INFINITY) <= 60_000;

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 text-white sm:px-6 lg:px-8">
      <StarField />
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-bold text-yellow-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
          <div className="flex flex-wrap gap-3">
            <div
              className={`inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-black ${
                timerDanger
                  ? "border-red-300/40 bg-red-500/15 text-red-100"
                  : "border-yellow-300/20 bg-yellow-300/10 text-yellow-100"
              }`}
            >
              <Clock3 className="h-4 w-4" />
              {formatTime(timeRemainingMs)}
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-yellow-300/20 bg-yellow-300/10 px-4 py-2 text-sm font-bold text-yellow-100">
              <ShieldCheck className="h-4 w-4" />
              Server-side grading
            </div>
          </div>
        </header>

        <section className="py-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yellow-200">
            {getBranchLabel(exam.branch)}
          </p>
          <h1 className="mt-3 text-4xl font-black sm:text-5xl">{exam.title}</h1>
          <p className="mt-3 text-sm text-slate-300">
            Duration: {exam.durationMinutes} minutes
          </p>
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-yellow-300"
              initial={{ width: 0 }}
              animate={{ width: `${(answeredCount / exam.questions.length) * 100}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-slate-400">
            {answeredCount} of {exam.questions.length} answered
          </p>
          {showTimeWarning && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-yellow-300/30 bg-yellow-300/10 px-4 py-3 text-sm font-bold text-yellow-100"
            >
              <AlertTriangle className="h-4 w-4" />
              90% of the exam time has passed.
            </motion.p>
          )}
        </section>

        <div className="space-y-5">
          {exam.questions.map((question, questionIndex) => (
            <motion.section
              key={question.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              className="glass rounded-3xl p-5 sm:p-6"
            >
              <p className="text-sm font-black text-yellow-200">Question {questionIndex + 1}</p>
              <h2 className="mt-3 text-xl font-bold leading-8 text-white">{question.text}</h2>

              {question.imageUrl && (
                <div className="relative mt-5 aspect-video overflow-hidden rounded-2xl border border-white/10 bg-slate-950">
                  <Image
                    src={question.imageUrl}
                    alt="Question visual"
                    fill
                    sizes="(max-width: 768px) 100vw, 768px"
                    className="object-contain"
                  />
                </div>
              )}

              <div className="mt-5 grid gap-3">
                {question.choices.map((choice, choiceIndex) => {
                  const inputId = `${question.id}-${choice.id}`;
                  const isSelected = answers[question.id] === choice.id;

                  return (
                    <label
                      key={choice.id}
                      htmlFor={inputId}
                      className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                        isSelected
                          ? "border-yellow-300 bg-yellow-300/15"
                          : "border-white/10 bg-white/[0.04] hover:border-yellow-300/50"
                      }`}
                    >
                      <input
                        id={inputId}
                        type="radio"
                        name={question.id}
                        value={choice.id}
                        checked={isSelected}
                        onChange={() =>
                          setAnswers((current) => ({ ...current, [question.id]: choice.id }))
                        }
                        className="mt-1 h-4 w-4 accent-yellow-300"
                      />
                      <span className="font-semibold text-slate-100">
                        {String.fromCharCode(65 + choiceIndex)}. {choice.text}
                      </span>
                    </label>
                  );
                })}
              </div>
            </motion.section>
          ))}
        </div>

        {error && (
          <p className="mt-5 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </p>
        )}

        <div className="sticky bottom-4 mt-6 flex justify-end">
          <motion.button
            whileHover={{ scale: allAnswered ? 1.02 : 1 }}
            whileTap={{ scale: allAnswered ? 0.98 : 1 }}
            disabled={!allAnswered || isSubmitting}
            onClick={() => submitExam(false)}
            className="inline-flex items-center gap-2 rounded-full bg-yellow-300 px-6 py-3 font-black text-slate-950 shadow-[0_0_34px_rgba(250,204,21,0.24)] transition hover:bg-yellow-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Submit Exam
          </motion.button>
        </div>
      </div>
    </main>
  );
}
