import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const result = await query("SELECT * FROM artists WHERE id = $1", [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("Error fetching artist:", error)
    return NextResponse.json({ error: "Failed to fetch artist" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const { name, type, label, members, agency, notes, email, phone, web } = await request.json()

    // Validate required fields
    if (!name || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate type
    const validTypes = ["DJ", "Live", "Drag Performance"]
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: "Invalid artist type" }, { status: 400 })
    }

    const result = await query(
      "UPDATE artists SET name = $1, type = $2, label = $3, members = $4, agency = $5, notes = $6, email = $7, phone = $8, web = $9 WHERE id = $10 RETURNING *",
      [
        name,
        type,
        label || null,
        members || null,
        agency || null,
        notes || null,
        email || null,
        phone || null,
        web || null,
        id,
      ],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error: any) {
    console.error("Error updating artist:", error)

    // Handle duplicate name error
    if (error.code === "23505" && error.constraint === "artists_name_key") {
      return NextResponse.json({ error: "Artist name already exists" }, { status: 409 })
    }

    return NextResponse.json({ error: "Failed to update artist" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const result = await query("DELETE FROM artists WHERE id = $1 RETURNING id", [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Artist deleted successfully" })
  } catch (error) {
    console.error("Error deleting artist:", error)
    return NextResponse.json({ error: "Failed to delete artist" }, { status: 500 })
  }
}
