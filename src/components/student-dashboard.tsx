"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BookOpenCheck, Clock3, LogOut, Medal, Orbit } from "lucide-react";
import {
  MATH_BRANCHES,
  getBranchLabel,
  type MathBranchValue
} from "@/lib/branches";
import type { AuthUser } from "@/lib/security";
import { StarField } from "@/components/star-field";

type ExamSummary = {
  id: string;
  title: string;
  branch: MathBranchValue;
  durationMinutes: number;
  createdAt: string;
  _count: {
    questions: number;
    results: number;
  };
  results?: {
    id: string;
    score: number;
    timedOut?: boolean;
    submittedAt: string;
  }[];
};

type ResultSummary = {
  id: string;
  score: number;
  timedOut: boolean;
  submittedAt: string;
  exam: {
    id: string;
    title: string;
    branch: MathBranchValue;
  };
};

export function StudentDashboard({ user }: { user: AuthUser }) {
  const router = useRouter();
  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [results, setResults] = useState<ResultSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      const [examResponse, resultResponse] = await Promise.all([
        fetch("/api/exams", { cache: "no-store" }),
        fetch("/api/results", { cache: "no-store" })
      ]);

      if (!isMounted) {
        return;
      }

      if (examResponse.ok) {
        const data = (await examResponse.json()) as { exams: ExamSummary[] };
        setExams(data.exams);
      }

      if (resultResponse.ok) {
        const data = (await resultResponse.json()) as { results: ResultSummary[] };
        setResults(data.results);
      }

      setIsLoading(false);
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const groupedExams = useMemo(
    () =>
      MATH_BRANCHES.reduce(
        (groups, branch) => ({
          ...groups,
          [branch.value]: exams.filter((exam) => exam.branch === branch.value)
        }),
        {} as Record<MathBranchValue, ExamSummary[]>
      ),
    [exams]
  );

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 text-white sm:px-6 lg:px-8">
      <StarField />

      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm font-black text-yellow-100">
            <Orbit className="h-5 w-5 text-yellow-300" />
            Star Math Portal
          </Link>
          <button
            onClick={logout}
            className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-slate-100 transition hover:border-yellow-300/60 hover:text-yellow-100"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </header>

        <section className="grid gap-5 py-10 lg:grid-cols-[0.8fr_1.2fr]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-3xl p-6"
          >
            <div className="flex items-center gap-4">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-yellow-300 text-2xl font-black text-slate-950">
                {user.name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-yellow-200">
                  Student Profile
                </p>
                <h1 className="mt-1 text-3xl font-black">{user.name}</h1>
                <p className="mt-1 text-sm text-slate-300">{user.phone}</p>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <BookOpenCheck className="h-5 w-5 text-yellow-200" />
                <p className="mt-3 text-2xl font-black">{exams.length}</p>
                <p className="text-sm text-slate-400">Available exams</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <Medal className="h-5 w-5 text-yellow-200" />
                <p className="mt-3 text-2xl font-black">{results.length}</p>
                <p className="text-sm text-slate-400">Submitted results</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-3xl p-6"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-yellow-200">
                  Available Exams
                </p>
                <h2 className="mt-1 text-3xl font-black">Choose your branch</h2>
              </div>
              {isLoading && <p className="text-sm text-slate-400">Loading...</p>}
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {MATH_BRANCHES.map((branch) => (
                <div
                  key={branch.value}
                  className="rounded-2xl border border-white/10 bg-slate-950/45 p-4"
                >
                  <h3 className="text-xl font-black text-yellow-100">{branch.label}</h3>
                  <div className="mt-4 space-y-3">
                    {groupedExams[branch.value].length === 0 ? (
                      <p className="text-sm text-slate-400">No exams available yet.</p>
                    ) : (
                      groupedExams[branch.value].map((exam) => {
                        const latestResult = exam.results?.[0];

                        return (
                          <Link
                            key={exam.id}
                            href={`/exams/${exam.id}`}
                            className="block rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-yellow-300/50 hover:bg-yellow-300/10"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-bold text-white">{exam.title}</p>
                                <p className="mt-1 text-sm text-slate-400">
                                  {exam._count.questions} questions - {exam.durationMinutes} min
                                </p>
                              </div>
                              {latestResult && (
                                <span className="rounded-full bg-yellow-300 px-3 py-1 text-xs font-black text-slate-950">
                                  {latestResult.score}%
                                </span>
                              )}
                            </div>
                          </Link>
                        );
                      })
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        <section className="glass mb-8 rounded-3xl p-6">
          <div className="flex items-center gap-3">
            <Clock3 className="h-5 w-5 text-yellow-200" />
            <h2 className="text-2xl font-black">Past Exam Results</h2>
          </div>
          <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
            {results.length === 0 ? (
              <p className="bg-slate-950/40 p-5 text-sm text-slate-400">
                No submitted exams yet.
              </p>
            ) : (
              <div className="divide-y divide-white/10">
                {results.map((result) => (
                  <Link
                    key={result.id}
                    href={`/results/${result.id}`}
                    className="grid gap-2 bg-slate-950/40 p-4 sm:grid-cols-[1fr_auto_auto] sm:items-center"
                  >
                    <div>
                      <p className="font-bold">{result.exam.title}</p>
                      <p className="text-sm text-slate-400">{getBranchLabel(result.exam.branch)}</p>
                    </div>
                    <p className="font-black text-yellow-200">
                      {result.score}%{result.timedOut ? " - timed out" : ""}
                    </p>
                    <p className="text-sm text-slate-400">
                      {new Date(result.submittedAt).toLocaleString()}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
