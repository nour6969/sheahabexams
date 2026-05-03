import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { StudentDashboard } from "@/components/student-dashboard";
import { getAuthUserFromCookie } from "@/lib/security";

export default async function DashboardPage() {
  const user = await getAuthUserFromCookie();

  if (!user) {
    redirect("/login");
  }

  if (user.role === Role.ADMIN) {
    redirect("/admin");
  }

  return <StudentDashboard user={user} />;
}
