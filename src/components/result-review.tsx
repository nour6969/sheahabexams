"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { getBranchLabel, type MathBranchValue } from "@/lib/branches";
import { StarField } from "@/components/star-field";

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

type ResultDetails = {
  id: string;
  score: number;
  timedOut: boolean;
  submittedAt: string;
  exam: {
    id: string;
    title: string;
    branch: MathBranchValue;
  };
  answers: ReviewAnswer[];
};

export function ResultReview({
  resultId,
  backHref,
  backLabel
}: {
  resultId: string;
  backHref: string;
  backLabel: string;
}) {
  const [result, setResult] = useState<ResultDetails | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadResult() {
      const response = await fetch(`/api/results/${resultId}`, { cache: "no-store" });
      const data = (await response.json().catch(() => null)) as
        | { result?: ResultDetails; message?: string }
        | null;

      if (!isMounted) {
        return;
      }

      if (!response.ok || !data?.result) {
        setError(data?.message ?? "Result could not be loaded.");
      } else {
        setResult(data.result);
      }

      setIsLoading(false);
    }

    loadResult();

    return () => {
      isMounted = false;
    };
  }, [resultId]);

  if (isLoading) {
    return (
      <main className="relative grid min-h-screen place-items-center text-white">
        <StarField />
        <Loader2 className="h-8 w-8 animate-spin text-yellow-200" />
      </main>
    );
  }

  if (!result) {
    return (
      <main className="relative grid min-h-screen place-items-center px-4 text-white">
        <StarField />
        <div className="glass max-w-md rounded-3xl p-6 text-center">
          <p className="text-red-100">{error}</p>
          <Link href={backHref} className="mt-5 inline-block font-bold text-yellow-200">
            {backLabel}
          </Link>
        </div>
      </main>
    );
  }

  const correctAnswers = result.answers.filter((answer) => answer.isCorrect).length;

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-10 text-white sm:px-6 lg:px-8">
      <StarField />
      <section className="mx-auto max-w-5xl">
        <Link href={backHref} className="inline-flex items-center gap-2 text-sm font-bold text-yellow-200">
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass mt-6 rounded-3xl p-6 text-center sm:p-8"
        >
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-yellow-200">
            {getBranchLabel(result.exam.branch)}
          </p>
          <h1 className="mt-3 text-4xl font-black">{result.exam.title}</h1>
          <p className="mt-4 text-slate-300">
            Submitted {new Date(result.submittedAt).toLocaleString()}
          </p>
          <p className="mt-5 text-5xl font-black text-yellow-200">{result.score}%</p>
          <p className="mt-3 text-slate-300">
            {correctAnswers} correct answers out of {result.answers.length}
            {result.timedOut ? " - timed out" : ""}
          </p>
        </motion.div>

        <div className="mt-6 space-y-4">
          {result.answers.map((answer, index) => (
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
                        Student answer
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
      </section>
    </main>
  );
}
