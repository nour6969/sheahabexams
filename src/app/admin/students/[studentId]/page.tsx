import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { ArrowLeft, Eye, Medal, Phone, UserRound, Users } from "lucide-react";
import { StarField } from "@/components/star-field";
import { getBranchLabel } from "@/lib/branches";
import { prisma } from "@/lib/prisma";
import { getAuthUserFromCookie } from "@/lib/security";

type PageProps = {
  params: Promise<{
    studentId: string;
  }>;
};

export default async function AdminStudentPage({ params }: PageProps) {
  const user = await getAuthUserFromCookie();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== Role.ADMIN) {
    redirect("/dashboard");
  }

  const { studentId } = await params;
  const student = await prisma.user.findFirst({
    where: {
      id: studentId,
      role: Role.STUDENT
    },
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
          answers: {
            select: {
              id: true,
              isCorrect: true
            }
          },
          exam: {
            select: {
              title: true,
              branch: true
            }
          }
        }
      }
    }
  });

  if (!student) {
    notFound();
  }

  const averageScore =
    student.results.length === 0
      ? 0
      : Math.round(
          student.results.reduce((total, result) => total + result.score, 0) /
            student.results.length
        );

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 text-white sm:px-6 lg:px-8">
      <StarField />
      <div className="mx-auto max-w-6xl">
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-bold text-yellow-200">
          <ArrowLeft className="h-4 w-4" />
          Back to admin
        </Link>

        <section className="grid gap-5 py-8 lg:grid-cols-[0.82fr_1.18fr]">
          <div className="glass rounded-3xl p-6">
            <div className="flex items-center gap-4">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-yellow-300 text-2xl font-black text-slate-950">
                {student.name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-yellow-200">
                  Student Details
                </p>
                <h1 className="mt-1 text-3xl font-black">{student.name}</h1>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center gap-2 text-sm font-bold text-yellow-100">
                  <Phone className="h-4 w-4" />
                  Student phone
                </div>
                <p className="mt-2 text-slate-200">{student.phone}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center gap-2 text-sm font-bold text-yellow-100">
                  <Users className="h-4 w-4" />
                  Parent phone
                </div>
                <p className="mt-2 text-slate-200">{student.parentPhone || "Not recorded"}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center gap-2 text-sm font-bold text-yellow-100">
                  <UserRound className="h-4 w-4" />
                  Joined
                </div>
                <p className="mt-2 text-slate-200">
                  {new Date(student.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <div className="glass rounded-3xl p-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <Medal className="h-5 w-5 text-yellow-200" />
                <p className="mt-3 text-3xl font-black">{student.results.length}</p>
                <p className="text-sm text-slate-400">Submitted exams</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <Medal className="h-5 w-5 text-yellow-200" />
                <p className="mt-3 text-3xl font-black">{averageScore}%</p>
                <p className="text-sm text-slate-400">Average score</p>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
              {student.results.length === 0 ? (
                <p className="bg-slate-950/40 p-5 text-sm text-slate-400">
                  No submitted exams yet.
                </p>
              ) : (
                <div className="divide-y divide-white/10">
                  {student.results.map((result) => {
                    const correctAnswers = result.answers.filter((answer) => answer.isCorrect).length;

                    return (
                      <div
                        key={result.id}
                        className="grid gap-3 bg-slate-950/40 p-4 lg:grid-cols-[1fr_auto_auto] lg:items-center"
                      >
                        <div>
                          <p className="font-bold">{result.exam.title}</p>
                          <p className="text-sm text-slate-400">
                            {getBranchLabel(result.exam.branch)} - {correctAnswers} of{" "}
                            {result.answers.length} correct
                          </p>
                        </div>
                        <p className="font-black text-yellow-200">
                          {result.score}%{result.timedOut ? " - timed out" : ""}
                        </p>
                        <Link
                          href={`/results/${result.id}?studentId=${student.id}`}
                          className="inline-flex items-center justify-center gap-2 rounded-full border border-yellow-300/30 px-4 py-2 text-sm font-bold text-yellow-100 transition hover:bg-yellow-300 hover:text-slate-950"
                        >
                          <Eye className="h-4 w-4" />
                          Answers
                        </Link>
                        <p className="text-sm text-slate-400 lg:col-span-3">
                          Submitted {new Date(result.submittedAt).toLocaleString()}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
