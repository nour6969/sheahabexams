import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { ApiError, handleApiError } from "@/lib/errors";
import { assertRateLimit } from "@/lib/rate-limit";
import { requireAuth } from "@/lib/security";
import { put } from "@vercel/blob";

export const runtime = "nodejs";

const allowedTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"]
]);

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAuth(Role.ADMIN);

    await assertRateLimit(request, {
      scope: "upload:question-image",
      limit: 30,
      windowSeconds: 60,
      identity: admin.id
    });

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      throw new ApiError(400, "Image file is required.");
    }

    const extension = allowedTypes.get(file.type);

    if (!extension) {
      throw new ApiError(400, "Only JPG, PNG, WebP, and GIF images are allowed.");
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new ApiError(400, "Question images must be 10MB or smaller.");
    }

  
    const filename = `questions/${randomUUID()}.${extension}`;
    
   
    const blob = await put(filename, file, {
      access: 'public',
    });

    return NextResponse.json({
      url: blob.url
    });
  } catch (error) {
    return handleApiError(error);
  }
}
