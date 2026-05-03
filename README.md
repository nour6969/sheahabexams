# Shehab Star Math Portal

Secure, animated portfolio and examination portal for **Eng. Shehab Elebady**.

## Stack

- Next.js App Router with React and TypeScript
- Tailwind CSS v4
- Framer Motion
- PostgreSQL with Prisma ORM
- JWT authentication in HTTP-only cookies
- PostgreSQL-backed rate limiting

## Project Structure

```text
.
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── public/
│   └── uploads/
├── src/
│   ├── app/
│   │   ├── admin/page.tsx
│   │   ├── api/
│   │   │   ├── admin/students/route.ts
│   │   │   ├── auth/login/route.ts
│   │   │   ├── auth/logout/route.ts
│   │   │   ├── auth/register/route.ts
│   │   │   ├── exams/route.ts
│   │   │   ├── exams/[examId]/route.ts
│   │   │   ├── exams/[examId]/submit/route.ts
│   │   │   ├── me/route.ts
│   │   │   ├── results/route.ts
│   │   │   ├── results/[resultId]/route.ts
│   │   │   └── upload/question-image/route.ts
│   │   ├── dashboard/page.tsx
│   │   ├── exams/[examId]/page.tsx
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── admin-dashboard.tsx
│   │   ├── auth-form.tsx
│   │   ├── exam-interface.tsx
│   │   ├── hero.tsx
│   │   ├── star-field.tsx
│   │   └── student-dashboard.tsx
│   ├── lib/
│   │   ├── errors.ts
│   │   ├── prisma.ts
│   │   ├── rate-limit.ts
│   │   ├── security.ts
│   │   └── validation.ts
│   └── proxy.ts
├── .env.example
├── next.config.mjs
├── package.json
├── postcss.config.mjs
└── tsconfig.json
```

## Database Schema

The Prisma schema defines:

- `User`: `id`, `name`, `phone`, `parent_phone`, `password_hash`, `role`
- `Exam`: `id`, `title`, `branch`, `duration_minutes`, `created_at`
- `Question`: `id`, `exam_id`, `text`, `image_url`
- `Choice`: `id`, `question_id`, `text`, `is_correct`
- `Result`: `id`, `user_id`, `exam_id`, `score`, `timed_out`, `submitted_at`
- `ResultAnswer`: stored review snapshots for each submitted, correct, and empty answer
- `ExamAttempt`: persistent student timer attempts with `started_at` and `expires_at`
- `RateLimitBucket`: Postgres-backed request throttling

See [prisma/schema.prisma](./prisma/schema.prisma).

## Critical Security Notes

- Student exam fetches never select or return `Choice.isCorrect`.
- Exam submissions accept only `{ questionId, selectedChoiceId }[]`.
- Scores are calculated in [src/app/api/exams/[examId]/submit/route.ts](./src/app/api/exams/%5BexamId%5D/submit/route.ts) by querying the database.
- After submission, the server returns a review snapshot showing correct, wrong, and empty answers.
- Exam timers are set by the admin and backed by persisted `ExamAttempt` rows, so page refreshes do not reset the countdown.
- Students cannot submit arbitrary scores because the route ignores all score-like client data.
- Admin APIs call `requireAuth(Role.ADMIN)`.
- Auth and exam submission routes use rate limiting.
- Passwords are hashed with bcrypt.
- JWTs are signed with `jose` and stored in HTTP-only cookies.
- Prisma parameterized queries are used for database access.
- User input is validated with Zod and rendered by React without `dangerouslySetInnerHTML`.

## Setup

1. Copy `.env.example` to `.env`.
2. Set `DATABASE_URL` and a strong `JWT_SECRET`.
3. Install dependencies:

```bash
npm install
```

4. Create the database schema and seed the admin account:

```bash
npm run prisma:migrate -- --name init
npm run db:seed
```

5. Start the app:

```bash
npm run dev
```

Default seeded admin credentials come from `.env`:

- `ADMIN_PHONE`
- `ADMIN_PASSWORD`

For production file uploads, replace the local `public/uploads` storage with S3, Cloudflare R2, or another durable object store.
