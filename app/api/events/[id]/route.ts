import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const result = await query(
      `
      SELECT 
        e.*,
        u1.name as responsible_name,
        u2.name as light_name,
        u3.name as sound_name,
        u4.name as artist_care_name
      FROM events e
      LEFT JOIN users u1 ON e.responsible_id = u1.id
      LEFT JOIN users u2 ON e.light_id = u2.id
      LEFT JOIN users u3 ON e.sound_id = u3.id
      LEFT JOIN users u4 ON e.artist_care_id = u4.id
      WHERE e.id = $1
    `,
      [id],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("Error fetching event:", error)
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const {
      category,
      title,
      start_,
      end_,
      doors_open,
      state,
      floors,
      responsible_id,
      light_id,
      sound_id,
      artist_care_id,
      admission,
      break_even,
      presstext,
      notes_internal,
      technical_notes,
      api_notes,
    } = await request.json()

    // Validate required fields
    if (!title || !start_) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const result = await query(
      `UPDATE events SET 
        category = $1, title = $2, start_ = $3, end_ = $4,
        doors_open = $5, state = $6, floors = $7, responsible_id = $8,
        light_id = $9, sound_id = $10, artist_care_id = $11, admission = $12,
        break_even = $13, presstext = $14, notes_internal = $15, 
        technical_notes = $16, api_notes = $17
      WHERE id = $18 RETURNING *`,
      [
        category || "Concert", // Default to 'Concert' if not provided
        title,
        start_,
        end_ || null,
        doors_open || null,
        state || null,
        floors || null,
        responsible_id || null,
        light_id || null,
        sound_id || null,
        artist_care_id || null,
        admission || null,
        break_even || null,
        presstext || null,
        notes_internal || null,
        technical_notes || null,
        api_notes || null,
        id,
      ],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error: any) {
    console.error("Error updating event:", error)
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const result = await query("DELETE FROM events WHERE id = $1 RETURNING id", [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Event deleted successfully" })
  } catch (error) {
    console.error("Error deleting event:", error)
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 })
  }
}
