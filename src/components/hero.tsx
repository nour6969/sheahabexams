"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Brain,
  Calculator,
  Code2,
  ExternalLink,
  MessageCircle,
  Sparkles,
  Target,
  Users,
  Youtube
} from "lucide-react";
import { StarField } from "@/components/star-field";

const links = [
  {
    label: "Facebook Page",
    href: "https://www.facebook.com/profile.php?id=61584536076436#",
    icon: ExternalLink
  },
  {
    label: "WhatsApp",
    href: "https://wa.me/201201212002",
    icon: MessageCircle
  },
  {
    label: "Q&A Group",
    href: "https://chat.whatsapp.com/EqW5kZnqCIG4i9viyVeMsb",
    icon: Users
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@engshehabelebady1",
    icon: Youtube
  }
];

const profileHighlights = [
  {
    title: "Academic Profile",
    body:
      "Computer Engineering graduate and specialized Mathematics educator for Thanaweya Amma Language school students.",
    Icon: Code2
  },
  {
    title: "Scientific Methodology",
    body:
      "Zero memorization. Lessons are built on proof, deductive reasoning, visual modeling, and engineering structure.",
    Icon: Brain
  },
  {
    title: "Exam Strategy",
    body:
      "Standardized testing patterns are analyzed into efficient trajectories, so students know what to solve, why, and when.",
    Icon: Target
  }
];

const branches = ["Calculus", "Algebra", "Solid Geometry", "Statics", "Dynamics"];

export function Hero({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-5 text-white sm:px-6 lg:px-8">
      <StarField />

      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-yellow-100">
          <Sparkles className="h-5 w-5 text-yellow-300" />
          Star Math
        </Link>
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full bg-yellow-300 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-yellow-200"
            >
              Start Exam
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-yellow-300/60 hover:text-yellow-100"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-yellow-300 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-yellow-200"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </nav>

      <section className="mx-auto grid min-h-[calc(100vh-88px)] w-full max-w-7xl items-center gap-10 py-12 lg:grid-cols-[1.05fr_0.95fr]">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="max-w-3xl"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-yellow-300/20 bg-yellow-300/10 px-4 py-2 text-sm font-semibold text-yellow-100"
          >
            <Sparkles className="h-4 w-4 text-yellow-300" />
            The Math Star
          </motion.div>

          <h1 className="text-balance text-5xl font-black tracking-normal text-white sm:text-6xl lg:text-7xl">
            Eng. Shehab Elebady
          </h1>

          <p className="mt-5 max-w-2xl text-xl font-medium leading-8 text-slate-200 sm:text-2xl">
            Computer Engineering graduate. Specialized Mathematics educator for Thanaweya Amma
            Language school students.
          </p>

          <motion.p
            className="mt-8 inline-block text-4xl font-black text-yellow-200 sm:text-6xl"
            animate={{
              textShadow: [
                "0 0 18px rgba(250,204,21,0.45)",
                "0 0 42px rgba(250,204,21,0.75)",
                "0 0 18px rgba(250,204,21,0.45)"
              ]
            }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
          >
            Proof before memorization.
          </motion.p>

          <p className="mt-8 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
            A focused mathematics portal for guided learning, smart exam practice, and clear
            progress tracking across Calculus, Algebra, Geometry, Solid Geometry, Statics, and
            Dynamics. The method turns raw complexity into structured understanding through proof,
            algorithmic thinking, and visual mental models.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            {links.map((item) => {
              const Icon = item.icon;

              return (
                <motion.a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  whileHover={{ y: -3, scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="group inline-flex items-center gap-2 rounded-full border border-yellow-300/20 bg-white/[0.06] px-5 py-3 text-sm font-bold text-yellow-50 shadow-[0_0_30px_rgba(250,204,21,0.08)] transition hover:border-yellow-300/70 hover:bg-yellow-300 hover:text-slate-950 hover:shadow-[0_0_34px_rgba(250,204,21,0.34)]"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </motion.a>
              );
            })}
          </div>

          <Link
            href="/dashboard"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-blue-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-400"
          >
            {isAuthenticated ? "Start Exam" : "Enter Student Portal"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92, rotate: -2 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, delay: 0.18, ease: "easeOut" }}
          className="mx-auto w-full max-w-md"
        >
          <div className="glass gold-glow relative overflow-hidden rounded-[2rem] p-5">
            <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-yellow-200 to-transparent" />
            <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950">
              <Image
                src="/profile.jpg"
                alt="Eng. Shehab Elebady"
                fill
                priority
                sizes="(max-width: 1024px) 90vw, 420px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/86 via-slate-950/10 to-transparent" />
              <div className="absolute inset-x-5 bottom-5 rounded-3xl border border-white/10 bg-slate-950/72 p-5 text-center backdrop-blur">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yellow-200">
                  Eng. Shehab Elebady
                </p>
                <p className="mt-2 text-3xl font-black text-white">The Math Star</p>
                <p className="mt-2 text-sm text-slate-300">
                  Calculus, Algebra, Geometry, Statics, and Dynamics.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <section id="about" className="mx-auto w-full max-w-7xl pb-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.6 }}
          className="mb-4"
        >
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <Calculator className="h-5 w-5 text-yellow-200" />
              <h2 className="text-2xl font-black text-yellow-100">Metrics & Performance</h2>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-300 sm:text-base">
              99.9% accuracy across 5,000+ complex geometry and calculus paradigms, with a
              teaching system designed to transform Calculus, Algebra, Geometry, and Advanced
              Physics from scattered rules into clean, test-ready structures.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {branches.map((branch) => (
                <span
                  key={branch}
                  className="rounded-full border border-yellow-300/20 bg-yellow-300/10 px-3 py-1 text-xs font-bold text-yellow-100"
                >
                  {branch}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.6 }}
          className="grid gap-4 md:grid-cols-3"
        >
          {profileHighlights.map(({ title, body, Icon }) => (
            <div key={title} className="glass rounded-2xl p-5">
              <Icon className="h-5 w-5 text-yellow-200" />
              <h2 className="mt-4 text-lg font-black text-yellow-100">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">{body}</p>
            </div>
          ))}
        </motion.div>
      </section>
    </main>
  );
}
