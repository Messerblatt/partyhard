import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { RegisterForm } from "@/components/auth/register-form"

export default async function RegisterPage() {
  // If user is already logged in, redirect to home
  const session = await getServerSession(authOptions)

  if (session) {
    redirect("/")
  }

  return <RegisterForm />
}
