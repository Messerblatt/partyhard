import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    const result = await query(`
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
      ORDER BY e.start_ DESC
    `)
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Error fetching events:", error)
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
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

    // Insert event
    const result = await query(
      `INSERT INTO events (
        category, title, start_, end_, doors_open, state, floors,
        responsible_id, light_id, sound_id, artist_care_id,
        admission, break_even, presstext, notes_internal,
        technical_notes, api_notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) 
      RETURNING *`,
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
      ],
    )

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error: any) {
    console.error("Error creating event:", error)
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 })
  }
}
