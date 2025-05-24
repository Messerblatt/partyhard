import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const eventId = params.id

    // Get all artists booked for this event
    const result = await query(
      `
      SELECT a.*, eb.artist_id
      FROM artists a
      JOIN event_bookings eb ON a.id = eb.artist_id
      WHERE eb.event_id = $1
      ORDER BY a.name ASC
    `,
      [eventId],
    )

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Error fetching event artists:", error)
    return NextResponse.json({ error: "Failed to fetch event artists" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const eventId = params.id
    const { artist_ids } = await request.json()

    // Validate that artist_ids is an array (can be empty)
    if (!Array.isArray(artist_ids)) {
      return NextResponse.json({ error: "Invalid artist_ids provided - must be an array" }, { status: 400 })
    }

    // First, delete existing bookings for this event
    await query("DELETE FROM event_bookings WHERE event_id = $1", [eventId])

    // Then, insert new bookings only if there are artist IDs
    if (artist_ids.length > 0) {
      for (const artistId of artist_ids) {
        // Validate that artistId is a number
        if (!Number.isInteger(artistId)) {
          return NextResponse.json({ error: `Invalid artist ID: ${artistId}` }, { status: 400 })
        }

        await query("INSERT INTO event_bookings (event_id, artist_id) VALUES ($1, $2)", [eventId, artistId])
      }
    }

    return NextResponse.json({
      message: "Artist bookings updated successfully",
      artist_count: artist_ids.length,
    })
  } catch (error) {
    console.error("Error updating event artists:", error)
    return NextResponse.json({ error: "Failed to update event artists" }, { status: 500 })
  }
}
