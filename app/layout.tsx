import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Toaster } from "sonner"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth/auth-provider"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { UserNav } from "@/components/auth/user-nav"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "User Management System",
  description: "A CRUD application for managing users",
    generator: 'v0.dev'
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider session={session}>
            {session && (
              <header className="border-b">
                <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                  <h1 className="text-xl font-semibold">Management System</h1>
                  <UserNav />
                </div>
              </header>
            )}
            {children}
            <Toaster position="top-right" />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
