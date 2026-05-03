import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { ExamInterface } from "@/components/exam-interface";
import { getAuthUserFromCookie } from "@/lib/security";

type PageProps = {
  params: Promise<{
    examId: string;
  }>;
};

export default async function ExamPage({ params }: PageProps) {
  const user = await getAuthUserFromCookie();

  if (!user) {
    redirect("/login");
  }

  if (user.role === Role.ADMIN) {
    redirect("/admin");
  }

  const { examId } = await params;
  return <ExamInterface examId={examId} />;
}
