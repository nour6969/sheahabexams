import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { AuthForm } from "@/components/auth-form";
import { getAuthUserFromCookie } from "@/lib/security";

export default async function RegisterPage() {
  const user = await getAuthUserFromCookie();

  if (user?.role === Role.ADMIN) {
    redirect("/admin");
  }

  if (user?.role === Role.STUDENT) {
    redirect("/dashboard");
  }

  return <AuthForm mode="register" />;
}
