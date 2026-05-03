import { Hero } from "@/components/hero";
import { getAuthUserFromCookie } from "@/lib/security";

export default async function HomePage() {
  const user = await getAuthUserFromCookie();

  return <Hero isAuthenticated={Boolean(user)} />;
}
