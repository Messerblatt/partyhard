import { type NextRequest, NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { query } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, role, password } = await request.json()

    // Validate required fields
    if (!name || !email || !role || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate role
    const validRoles = ["Admin", "Booker", "Door", "Event Manager", "Other"]
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await query("SELECT id FROM users WHERE email = $1", [email])
    if (existingUser.rows.length > 0) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 })
    }

    // Hash password
    const hashedPassword = await hash(password, 10)

    // Insert new user
    const result = await query(
      "INSERT INTO users (role, name, email, phone, password) VALUES ($1, $2, $3, $4, $5) RETURNING id, role, name, email, phone",
      [role, name, email, phone || null, hashedPassword],
    )

    const newUser = result.rows[0]

    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          phone: newUser.phone,
        },
      },
      { status: 201 },
    )
  } catch (error: any) {
    console.error("Registration error:", error)

    // Handle duplicate email error (in case of race condition)
    if (error.code === "23505" && error.constraint === "users_email_key") {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 })
    }

    return NextResponse.json({ error: "Failed to create user account" }, { status: 500 })
  }
}
