import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { googleSignInEnabled } from "@/lib/authProviders";
import { RegisterForm } from "@/components/RegisterForm";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Sign up",
  description: "Create a free FYStay account to book stays or start hosting on the Fylde Coast.",
  path: "/register",
});

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  return <RegisterForm googleEnabled={googleSignInEnabled} />;
}
