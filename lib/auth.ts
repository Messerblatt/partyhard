import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { query } from "@/lib/db"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("NextAuth authorize called")
        console.log("Email:", credentials?.email)
        console.log("Password provided:", !!credentials?.password)

        if (!credentials?.email || !credentials?.password) {
          console.log("Missing credentials")
          return null
        }

        try {
          console.log("Querying database for user:", credentials.email)

          // Get user from database
          const result = await query("SELECT id, role, name, email, password FROM users WHERE email = $1", [
            credentials.email,
          ])

          console.log("Query result rows:", result.rows.length)

          if (result.rows.length === 0) {
            console.log("User not found in database:", credentials.email)
            return null
          }

          const user = result.rows[0]
          console.log("User found:")
          console.log("- ID:", user.id)
          console.log("- Name:", user.name)
          console.log("- Email:", user.email)
          console.log("- Role:", user.role)
          console.log("- Password length:", user.password?.length)
          console.log("- Password is hashed:", user.password?.startsWith("$2b$"))

          // Verify password
          console.log("Comparing passwords...")
          const isPasswordValid = await compare(credentials.password, user.password)
          console.log("Password comparison result:", isPasswordValid)

          if (!isPasswordValid) {
            console.log("Invalid password for user:", credentials.email)
            console.log("Input password:", credentials.password)
            console.log("Stored hash preview:", user.password?.substring(0, 20) + "...")
            return null
          }

          console.log("Authentication successful for:", user.name)

          // Return user object (without password)
          const returnUser = {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
          }

          console.log("Returning user object:", returnUser)
          return returnUser
        } catch (error) {
          console.error("Authentication error:", error)
          console.error("Error details:", error.message)
          return null
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      // console.log("JWT callback - user:", !!user, "token:", !!token)
      if (user) {
        token.role = user.role
        // console.log("Added role to token:", user.role)
      }
      return token
    },
    async session({ session, token }) {
      // console.log("Session callback - token:", !!token)
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        // console.log("Session user:", session.user)
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: true, // Enable debug mode
}
