"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ImagePlus,
  type LucideIcon,
  Loader2,
  LogOut,
  Pencil,
  Plus,
  Save,
  Search,
  Shield,
  Trash2,
  Users
} from "lucide-react";
import { StarField } from "@/components/star-field";
import { MATH_BRANCHES, getBranchLabel, type MathBranchValue } from "@/lib/branches";
import type { AuthUser } from "@/lib/security";

type Branch = MathBranchValue;

type AdminExamSummary = {
  id: string;
  title: string;
  branch: Branch;
  durationMinutes: number;
  createdAt: string;
  _count: {
    questions: number;
    results: number;
  };
};

type AdminChoice = {
  id?: string;
  text: string;
  isCorrect: boolean;
};

type AdminQuestion = {
  id?: string;
  text: string;
  imageUrl: string | null;
  choices: AdminChoice[];
};

type AdminExamDetails = {
  id: string;
  title: string;
  branch: Branch;
  durationMinutes: number;
  questions: AdminQuestion[];
};

type ExamForm = {
  title: string;
  branch: Branch;
  durationMinutes: number;
  questions: AdminQuestion[];
};

type AdminStudent = {
  id: string;
  name: string;
  phone: string;
  parentPhone: string;
  createdAt: string;
  results: {
    id: string;
    score: number;
    timedOut: boolean;
    submittedAt: string;
    exam: {
      id: string;
      title: string;
      branch: Branch;
    };
  }[];
};

const emptyQuestion = (): AdminQuestion => ({
  text: "",
  imageUrl: null,
  choices: [
    { text: "", isCorrect: true },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false }
  ]
});

const emptyExam = (): ExamForm => ({
  title: "",
  branch: "STATICS",
  durationMinutes: 30,
  questions: [emptyQuestion()]
});

export function AdminDashboard({ user }: { user: AuthUser }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"exams" | "students">("exams");
  const [exams, setExams] = useState<AdminExamSummary[]>([]);
  const [students, setStudents] = useState<AdminStudent[]>([]);
  const [form, setForm] = useState<ExamForm>(emptyExam);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadAdminData() {
    setIsLoading(true);
    const [examResponse, studentResponse] = await Promise.all([
      fetch("/api/exams", { cache: "no-store" }),
      fetch("/api/admin/students", { cache: "no-store" })
    ]);

    if (examResponse.ok) {
      const data = (await examResponse.json()) as { exams: AdminExamSummary[] };
      setExams(data.exams);
    }

    if (studentResponse.ok) {
      const data = (await studentResponse.json()) as { students: AdminStudent[] };
      setStudents(data.students);
    }

    setIsLoading(false);
  }

  useEffect(() => {
    loadAdminData();
  }, []);

  const studentResultCount = useMemo(
    () => students.reduce((total, student) => total + student.results.length, 0),
    [students]
  );

  const filteredStudents = useMemo(() => {
    const query = studentSearch.trim().toLowerCase();
    const queryDigits = query.replace(/\D/g, "");

    if (!query) {
      return students;
    }

    return students.filter((student) => {
      const fields = [student.name, student.phone, student.parentPhone];
      const textSearch = fields.join(" ").toLowerCase();
      const digitSearch = fields.join(" ").replace(/\D/g, "");

      return textSearch.includes(query) || Boolean(queryDigits && digitSearch.includes(queryDigits));
    });
  }, [studentSearch, students]);

  const metrics: { label: string; value: number; Icon: LucideIcon }[] = [
    { label: "Students", value: students.length, Icon: Users },
    { label: "Exams", value: exams.length, Icon: Shield },
    { label: "Submissions", value: studentResultCount, Icon: Save }
  ];

  function setQuestion(index: number, nextQuestion: AdminQuestion) {
    setForm((current) => ({
      ...current,
      questions: current.questions.map((question, questionIndex) =>
        questionIndex === index ? nextQuestion : question
      )
    }));
  }

  function setChoice(questionIndex: number, choiceIndex: number, nextChoice: AdminChoice) {
    setForm((current) => ({
      ...current,
      questions: current.questions.map((question, currentQuestionIndex) => {
        if (currentQuestionIndex !== questionIndex) {
          return question;
        }

        return {
          ...question,
          choices: question.choices.map((choice, currentChoiceIndex) =>
            currentChoiceIndex === choiceIndex ? nextChoice : choice
          )
        };
      })
    }));
  }

  function markCorrect(questionIndex: number, choiceIndex: number) {
    setForm((current) => ({
      ...current,
      questions: current.questions.map((question, currentQuestionIndex) => {
        if (currentQuestionIndex !== questionIndex) {
          return question;
        }

        return {
          ...question,
          choices: question.choices.map((choice, currentChoiceIndex) => ({
            ...choice,
            isCorrect: currentChoiceIndex === choiceIndex
          }))
        };
      })
    }));
  }

  async function uploadImage(event: ChangeEvent<HTMLInputElement>, questionIndex: number) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError("");
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload/question-image", {
      method: "POST",
      body: formData
    });
    const data = (await response.json().catch(() => null)) as { url?: string; message?: string } | null;

    if (!response.ok || !data?.url) {
      setError(data?.message ?? "Image upload failed.");
      return;
    }

    const question = form.questions[questionIndex];
    setQuestion(questionIndex, { ...question, imageUrl: data.url });
  }

  async function editExam(examId: string) {
    setError("");
    setMessage("");
    const response = await fetch(`/api/exams/${examId}`, { cache: "no-store" });
    const data = (await response.json().catch(() => null)) as { exam?: AdminExamDetails; message?: string } | null;

    if (!response.ok || !data?.exam) {
      setError(data?.message ?? "Exam could not be loaded.");
      return;
    }

    setEditingExamId(data.exam.id);
    setForm({
      title: data.exam.title,
      branch: data.exam.branch,
      durationMinutes: data.exam.durationMinutes,
      questions: data.exam.questions.map((question) => ({
        text: question.text,
        imageUrl: question.imageUrl,
        choices: question.choices.map((choice) => ({
          text: choice.text,
          isCorrect: choice.isCorrect
        }))
      }))
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveExam() {
    setError("");
    setMessage("");
    setIsSaving(true);

    const response = await fetch(editingExamId ? `/api/exams/${editingExamId}` : "/api/exams", {
      method: editingExamId ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(form)
    });

    const data = (await response.json().catch(() => null)) as { message?: string } | null;
    setIsSaving(false);

    if (!response.ok) {
      setError(data?.message ?? "Exam could not be saved.");
      return;
    }

    setMessage(editingExamId ? "Exam updated." : "Exam created.");
    setEditingExamId(null);
    setForm(emptyExam());
    await loadAdminData();
  }

  async function deleteExam(examId: string) {
    if (!window.confirm("Delete this exam and its results?")) {
      return;
    }

    setError("");
    setMessage("");
    const response = await fetch(`/api/exams/${examId}`, { method: "DELETE" });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { message?: string } | null;
      setError(data?.message ?? "Exam could not be deleted.");
      return;
    }

    if (editingExamId === examId) {
      setEditingExamId(null);
      setForm(emptyExam());
    }

    setMessage("Exam deleted.");
    await loadAdminData();
  }

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
            <Shield className="h-5 w-5 text-yellow-300" />
            Star Admin
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-yellow-300/20 bg-yellow-300/10 px-4 py-2 text-sm font-bold text-yellow-100">
              {user.name}
            </span>
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-slate-100 transition hover:border-yellow-300/60 hover:text-yellow-100"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </header>

        <section className="grid gap-4 py-8 md:grid-cols-3">
          {metrics.map(({ label, value, Icon }) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-3xl p-5"
            >
              <Icon className="h-5 w-5 text-yellow-200" />
              <p className="mt-4 text-3xl font-black">{value}</p>
              <p className="text-sm text-slate-400">{label}</p>
            </motion.div>
          ))}
        </section>

        <div className="mb-6 flex w-fit rounded-full border border-white/10 bg-slate-950/60 p-1">
          {[
            ["exams", "Exam Management"],
            ["students", "Students"]
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() => setActiveTab(value as "exams" | "students")}
              className={`rounded-full px-4 py-2 text-sm font-black transition ${
                activeTab === value ? "bg-yellow-300 text-slate-950" : "text-slate-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {message && (
          <p className="mb-5 rounded-2xl border border-emerald-300/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            {message}
          </p>
        )}

        {error && (
          <p className="mb-5 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </p>
        )}

        {activeTab === "exams" ? (
          <section className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="glass rounded-3xl p-5 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yellow-200">
                    {editingExamId ? "Edit Exam" : "Create Exam"}
                  </p>
                  <h1 className="mt-2 text-3xl font-black">Question Editor</h1>
                </div>
                {editingExamId && (
                  <button
                    onClick={() => {
                      setEditingExamId(null);
                      setForm(emptyExam());
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-slate-200 transition hover:border-yellow-300/50"
                  >
                    <Plus className="h-4 w-4" />
                    New exam
                  </button>
                )}
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-[1fr_180px_170px]">
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-200">Title</span>
                  <input
                    value={form.title}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, title: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white"
                    placeholder="Exam title"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-200">Branch</span>
                  <select
                    value={form.branch}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        branch: event.target.value as Branch
                      }))
                    }
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white"
                  >
                    {MATH_BRANCHES.map((branch) => (
                      <option key={branch.value} value={branch.value}>
                        {branch.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-200">Timer</span>
                  <input
                    value={form.durationMinutes}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        durationMinutes: Number(event.target.value)
                      }))
                    }
                    type="number"
                    min={1}
                    max={300}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white"
                    placeholder="Minutes"
                  />
                </label>
              </div>

              <div className="mt-6 space-y-5">
                {form.questions.map((question, questionIndex) => (
                  <div
                    key={questionIndex}
                    className="rounded-3xl border border-white/10 bg-slate-950/45 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-black text-yellow-100">Question {questionIndex + 1}</p>
                      {form.questions.length > 1 && (
                        <button
                          onClick={() =>
                            setForm((current) => ({
                              ...current,
                              questions: current.questions.filter(
                                (_, currentIndex) => currentIndex !== questionIndex
                              )
                            }))
                          }
                          className="rounded-full p-2 text-red-200 transition hover:bg-red-500/10"
                          aria-label="Remove question"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <textarea
                      value={question.text}
                      onChange={(event) =>
                        setQuestion(questionIndex, { ...question, text: event.target.value })
                      }
                      className="mt-3 min-h-28 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white"
                      placeholder="Question text"
                    />

                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-slate-200 transition hover:border-yellow-300/50">
                        <ImagePlus className="h-4 w-4 text-yellow-200" />
                        Upload image
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/gif"
                          className="sr-only"
                          onChange={(event) => uploadImage(event, questionIndex)}
                        />
                      </label>
                      {question.imageUrl && (
                        <span className="truncate text-sm text-slate-400">{question.imageUrl}</span>
                      )}
                    </div>

                    <div className="mt-4 space-y-3">
                      {question.choices.map((choice, choiceIndex) => (
                        <div key={choiceIndex} className="grid gap-2 sm:grid-cols-[auto_1fr_auto]">
                          <input
                            type="radio"
                            checked={choice.isCorrect}
                            onChange={() => markCorrect(questionIndex, choiceIndex)}
                            className="mt-4 h-4 w-4 accent-yellow-300"
                            aria-label={`Mark choice ${choiceIndex + 1} correct`}
                          />
                          <input
                            value={choice.text}
                            onChange={(event) =>
                              setChoice(questionIndex, choiceIndex, {
                                ...choice,
                                text: event.target.value
                              })
                            }
                            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white"
                            placeholder={`Choice ${choiceIndex + 1}`}
                          />
                          {question.choices.length > 2 && (
                            <button
                              onClick={() =>
                                setQuestion(questionIndex, {
                                  ...question,
                                  choices: question.choices.filter(
                                    (_, currentIndex) => currentIndex !== choiceIndex
                                  )
                                })
                              }
                              className="rounded-full p-3 text-red-200 transition hover:bg-red-500/10"
                              aria-label="Remove choice"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {question.choices.length < 6 && (
                      <button
                        onClick={() =>
                          setQuestion(questionIndex, {
                            ...question,
                            choices: [...question.choices, { text: "", isCorrect: false }]
                          })
                        }
                        className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-slate-200 transition hover:border-yellow-300/50"
                      >
                        <Plus className="h-4 w-4" />
                        Add choice
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap justify-between gap-3">
                <button
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      questions: [...current.questions, emptyQuestion()]
                    }))
                  }
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 font-bold text-slate-100 transition hover:border-yellow-300/50"
                >
                  <Plus className="h-4 w-4" />
                  Add question
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={saveExam}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 rounded-full bg-yellow-300 px-6 py-3 font-black text-slate-950 transition hover:bg-yellow-200 disabled:opacity-60"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save exam
                </motion.button>
              </div>
            </div>

            <div className="glass rounded-3xl p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black">Existing Exams</h2>
                {isLoading && <Loader2 className="h-5 w-5 animate-spin text-yellow-200" />}
              </div>
              <div className="mt-5 space-y-3">
                {exams.length === 0 ? (
                  <p className="text-sm text-slate-400">No exams yet.</p>
                ) : (
                  exams.map((exam) => (
                    <div
                      key={exam.id}
                      className="rounded-2xl border border-white/10 bg-slate-950/45 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-black">{exam.title}</p>
                          <p className="mt-1 text-sm text-yellow-100">
                            Timer: {exam.durationMinutes} minutes
                          </p>
                          <p className="mt-1 text-sm text-slate-400">
                            {getBranchLabel(exam.branch)} - {exam._count.questions} questions -{" "}
                            {exam._count.results} submissions
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => editExam(exam.id)}
                            className="rounded-full p-2 text-yellow-100 transition hover:bg-yellow-300/10"
                            aria-label="Edit exam"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteExam(exam.id)}
                            className="rounded-full p-2 text-red-200 transition hover:bg-red-500/10"
                            aria-label="Delete exam"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        ) : (
          <section className="glass rounded-3xl p-5 sm:p-6">
            <div className="grid gap-4 lg:grid-cols-[1fr_360px] lg:items-end">
              <div>
                <h1 className="text-3xl font-black">Registered Students</h1>
                <p className="mt-2 text-sm text-slate-400">
                  Search by student name, student phone, or parent phone.
                </p>
              </div>
              <label className="relative block">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-yellow-200" />
                <input
                  value={studentSearch}
                  onChange={(event) => setStudentSearch(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 py-3 pl-11 pr-4 text-white placeholder:text-slate-500"
                  placeholder="Search students"
                />
              </label>
            </div>
            <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
              {students.length === 0 ? (
                <p className="bg-slate-950/45 p-5 text-sm text-slate-400">No students yet.</p>
              ) : filteredStudents.length === 0 ? (
                <p className="bg-slate-950/45 p-5 text-sm text-slate-400">
                  No students match this search.
                </p>
              ) : (
                <div className="divide-y divide-white/10">
                  {filteredStudents.map((student) => (
                    <Link
                      key={student.id}
                      href={`/admin/students/${student.id}`}
                      className="grid gap-2 bg-slate-950/45 p-4 transition hover:bg-yellow-300/10 sm:grid-cols-[1fr_auto] sm:items-center"
                    >
                      <div>
                        <p className="text-lg font-black text-white">{student.name}</p>
                        <p className="text-sm text-slate-400">{student.phone}</p>
                      </div>
                      <p className="text-sm font-bold text-yellow-100">
                        {student.results.length} submissions
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
