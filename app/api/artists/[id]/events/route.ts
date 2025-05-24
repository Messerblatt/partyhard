import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    // First check if the artist exists
    const artistResult = await query("SELECT id, name FROM artists WHERE id = $1", [id])

    if (artistResult.rows.length === 0) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 })
    }

    // Get all events for this artist
    const result = await query(
      `
      SELECT e.* 
      FROM events e
      JOIN event_bookings eb ON e.id = eb.event_id
      WHERE eb.artist_id = $1
      ORDER BY e.start_day DESC, e.start_time DESC
    `,
      [id],
    )

    return NextResponse.json({
      artist: artistResult.rows[0],
      events: result.rows,
    })
  } catch (error) {
    console.error("Error fetching artist events:", error)
    return NextResponse.json({ error: "Failed to fetch artist events" }, { status: 500 })
  }
}
