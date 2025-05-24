import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { hash } from "bcryptjs"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const result = await query("SELECT id, role, name, email, phone FROM users WHERE id = $1", [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const { role, name, email, phone, password } = await request.json()

    // Validate required fields
    if (!role || !name || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate role
    const validRoles = ["Admin", "Booker", "Door", "Event Manager", "Other"]
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    let result

    // If password is provided, update with new password
    if (password) {
      const hashedPassword = await hash(password, 10)
      result = await query(
        "UPDATE users SET role = $1, name = $2, email = $3, phone = $4, password = $5 WHERE id = $6 RETURNING id, role, name, email, phone",
        [role, name, email, phone || null, hashedPassword, id],
      )
    } else {
      // Otherwise, update without changing password
      result = await query(
        "UPDATE users SET role = $1, name = $2, email = $3, phone = $4 WHERE id = $5 RETURNING id, role, name, email, phone",
        [role, name, email, phone || null, id],
      )
    }

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error: any) {
    console.error("Error updating user:", error)

    // Handle duplicate email error
    if (error.code === "23505" && error.constraint === "users_email_key") {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 })
    }

    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const result = await query("DELETE FROM users WHERE id = $1 RETURNING id", [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}
