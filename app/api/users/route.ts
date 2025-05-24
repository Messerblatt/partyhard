import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { hash } from "bcryptjs"

export async function GET() {
  try {
    const result = await query("SELECT id, role, name, email, phone FROM users ORDER BY name ASC")
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { role, name, email, phone, password } = await request.json()

    // Validate required fields
    if (!role || !name || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate role
    const validRoles = ["Admin", "Booker", "Door", "Event Manager", "Other"]
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await hash(password, 10)

    // Insert user
    const result = await query(
      "INSERT INTO users (role, name, email, phone, password) VALUES ($1, $2, $3, $4, $5) RETURNING id, role, name, email, phone",
      [role, name, email, phone || null, hashedPassword],
    )

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error: any) {
    console.error("Error creating user:", error)

    // Handle duplicate email error
    if (error.code === "23505" && error.constraint === "users_email_key") {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 })
    }

    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}
