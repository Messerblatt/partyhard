import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    const result = await query(`
      SELECT 
        a.*,
        COUNT(eb.event_id) as event_count
      FROM artists a
      LEFT JOIN event_bookings eb ON a.id = eb.artist_id
      GROUP BY a.id
      ORDER BY a.name ASC
    `)
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Error fetching artists:", error)
    return NextResponse.json({ error: "Failed to fetch artists" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
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

    // Insert artist
    const result = await query(
      "INSERT INTO artists (name, type, label, members, agency, notes, email, phone, web) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
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
      ],
    )

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error: any) {
    console.error("Error creating artist:", error)

    // Handle duplicate name error
    if (error.code === "23505" && error.constraint === "artists_name_key") {
      return NextResponse.json({ error: "Artist name already exists" }, { status: 409 })
    }

    return NextResponse.json({ error: "Failed to create artist" }, { status: 500 })
  }
}
