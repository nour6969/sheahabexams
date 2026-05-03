import { ZodError } from "zod";
import { NextResponse } from "next/server";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json({ message: error.message }, { status: error.status });
  }

  if (error instanceof Error) {
    if (error.message.includes("Environment variable not found: DATABASE_URL")) {
      return NextResponse.json(
        {
          message:
            "Database is not configured. Create a .env file with DATABASE_URL, then run the Prisma migration."
        },
        { status: 503 }
      );
    }

    if (error.message.includes("JWT_SECRET must be set")) {
      return NextResponse.json(
        {
          message:
            "Authentication is not configured. Add a strong JWT_SECRET to your .env file."
        },
        { status: 503 }
      );
    }

    if (
      error.message.includes("Can't reach database server") ||
      error.message.includes("ECONNREFUSED")
    ) {
      return NextResponse.json(
        {
          message:
            "Cannot reach PostgreSQL. Check DATABASE_URL and make sure the database server is running."
        },
        { status: 503 }
      );
    }
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        message: "Invalid request payload.",
        issues: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message
        }))
      },
      { status: 400 }
    );
  }

  console.error(error);
  return NextResponse.json({ message: "Unexpected server error." }, { status: 500 });
}
