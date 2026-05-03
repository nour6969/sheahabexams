import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/errors";
import { requireAuth } from "@/lib/security";

export async function GET() {
  try {
    const user = await requireAuth();
    return NextResponse.json({ user });
  } catch (error) {
    return handleApiError(error);
  }
}
