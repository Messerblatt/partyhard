import { LoginForm } from "@/components/auth/login-form"

interface SignInPageProps {
  searchParams: { message?: string }
}

export default function SignInPage({ searchParams }: SignInPageProps) {
  return <LoginForm message={searchParams.message} />
}
