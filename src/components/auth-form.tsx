"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, LockKeyhole, Phone, User } from "lucide-react";
import { StarField } from "@/components/star-field";

type AuthFormProps = {
  mode: "login" | "register";
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const payload =
      mode === "register"
        ? {
            name: String(formData.get("name") ?? ""),
            phone: String(formData.get("phone") ?? ""),
            parentPhone: String(formData.get("parentPhone") ?? ""),
            password: String(formData.get("password") ?? "")
          }
        : {
            phone: String(formData.get("phone") ?? ""),
            password: String(formData.get("password") ?? "")
          };

    const response = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = (await response.json().catch(() => null)) as
      | { message?: string; user?: { role: "ADMIN" | "STUDENT" } }
      | null;

    setIsSubmitting(false);

    if (!response.ok) {
      setError(data?.message ?? "Something went wrong.");
      return;
    }

    router.push(data?.user?.role === "ADMIN" ? "/admin" : "/dashboard");
    router.refresh();
  }

  const isRegister = mode === "register";

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-10 text-white">
      <StarField />

      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
        className="glass w-full max-w-md rounded-3xl p-6 sm:p-8"
      >
        <Link href="/" className="text-sm font-bold text-yellow-200">
          Star Math
        </Link>
        <h1 className="mt-8 text-3xl font-black">
          {isRegister ? "Create student account" : "Welcome back"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          {isRegister
            ? "Register to take available mathematics exams and track your results."
            : "Login to continue to the secure mathematics portal."}
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          {isRegister && (
            <>
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-200">
                  <User className="h-4 w-4 text-yellow-200" />
                  Name
                </span>
                <input
                  required
                  minLength={2}
                  maxLength={80}
                  name="name"
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white placeholder:text-slate-500"
                  placeholder="Student name"
                />
              </label>

              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-200">
                  <Phone className="h-4 w-4 text-yellow-200" />
                  Parent phone
                </span>
                <input
                  required
                  minLength={8}
                  maxLength={24}
                  name="parentPhone"
                  inputMode="tel"
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white placeholder:text-slate-500"
                  placeholder="Parent WhatsApp number"
                />
              </label>
            </>
          )}

          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-200">
              <Phone className="h-4 w-4 text-yellow-200" />
              Phone
            </span>
            <input
              required
              minLength={8}
              maxLength={24}
              name="phone"
              inputMode="tel"
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white placeholder:text-slate-500"
              placeholder="201201212002"
            />
          </label>

          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-200">
              <LockKeyhole className="h-4 w-4 text-yellow-200" />
              Password
            </span>
            <input
              required
              minLength={8}
              maxLength={128}
              name="password"
              type="password"
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white placeholder:text-slate-500"
              placeholder="At least 8 characters"
            />
          </label>

          {error && (
            <p className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </p>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-yellow-300 px-5 py-3 font-black text-slate-950 transition hover:bg-yellow-200 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            {isRegister ? "Register" : "Login"}
          </motion.button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-300">
          {isRegister ? "Already registered?" : "New student?"}{" "}
          <Link
            href={isRegister ? "/login" : "/register"}
            className="font-bold text-yellow-200 hover:text-yellow-100"
          >
            {isRegister ? "Login" : "Create account"}
          </Link>
        </p>
      </motion.section>
    </main>
  );
}
