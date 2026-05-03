import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { AdminDashboard } from "@/components/admin-dashboard";
import { getAuthUserFromCookie } from "@/lib/security";

export default async function AdminPage() {
  const user = await getAuthUserFromCookie();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== Role.ADMIN) {
    redirect("/dashboard");
  }

  return <AdminDashboard user={user} />;
}
