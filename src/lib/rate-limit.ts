import { createHash } from "node:crypto";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/errors";

type RateLimitOptions = {
  scope: string;
  limit: number;
  windowSeconds: number;
  identity?: string;
};

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function clientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

export async function assertRateLimit(request: NextRequest, options: RateLimitOptions) {
  const identity = options.identity ?? clientIp(request);
  const key = sha256(`${options.scope}:${identity}`);
  const windowStartMs =
    Math.floor(Date.now() / (options.windowSeconds * 1000)) * options.windowSeconds * 1000;
  const windowStart = new Date(windowStartMs);

  const bucket = await prisma.rateLimitBucket.upsert({
    where: {
      key_windowStart: {
        key,
        windowStart
      }
    },
    update: {
      count: {
        increment: 1
      }
    },
    create: {
      key,
      windowStart,
      count: 1
    }
  });

  if (bucket.count > options.limit) {
    throw new ApiError(429, "Too many attempts. Please wait and try again.");
  }

  if (Math.random() < 0.01) {
    await prisma.rateLimitBucket.deleteMany({
      where: {
        windowStart: {
          lt: new Date(Date.now() - 1000 * 60 * 60 * 24)
        }
      }
    });
  }
}
