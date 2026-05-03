import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { ResultReview } from "@/components/result-review";
import { getAuthUserFromCookie } from "@/lib/security";

type PageProps = {
  params: Promise<{
    resultId: string;
  }>;
  searchParams: Promise<{
    studentId?: string;
  }>;
};

export default async function ResultPage({ params, searchParams }: PageProps) {
  const user = await getAuthUserFromCookie();

  if (!user) {
    redirect("/login");
  }

  const { resultId } = await params;
  const { studentId } = await searchParams;
  const isAdmin = user.role === Role.ADMIN;
  const backHref =
    isAdmin && studentId ? `/admin/students/${studentId}` : isAdmin ? "/admin" : "/dashboard";
  const backLabel = isAdmin && studentId ? "Back to student" : isAdmin ? "Back to admin" : "Back to dashboard";

  return (
    <ResultReview
      resultId={resultId}
      backHref={backHref}
      backLabel={backLabel}
    />
  );
}
