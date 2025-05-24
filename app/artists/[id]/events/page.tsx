import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft } from "lucide-react"
import { query } from "@/lib/db"
import type { Artist, Event } from "@/types/artist"

async function getArtistWithEvents(id: string): Promise<{ artist: Artist; events: Event[] } | null> {
  try {
    // Get artist
    const artistResult = await query("SELECT * FROM artists WHERE id = $1", [id])

    if (artistResult.rows.length === 0) {
      return null
    }

    // Get events for this artist
    const eventsResult = await query(
      `
      SELECT e.* 
      FROM events e
      JOIN event_bookings eb ON e.id = eb.event_id
      WHERE eb.artist_id = $1
      ORDER BY e.start_ DESC
    `,
      [id],
    )

    return {
      artist: artistResult.rows[0] as Artist,
      events: eventsResult.rows as Event[],
    }
  } catch (error) {
    console.error("Error fetching artist with events:", error)
    throw new Error("Failed to fetch artist with events")
  }
}

function formatDateTime(timestamp?: string): string {
  if (!timestamp) return "N/A"

  try {
    const date = new Date(timestamp)
    // Use toLocaleString to display in local timezone
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  } catch (e) {
    return timestamp
  }
}

export default async function ArtistEventsPage({ params }: { params: { id: string } }) {
  const data = await getArtistWithEvents(params.id)

  if (!data) {
    notFound()
  }

  const { artist, events } = data

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-6">
        <Link href="/artists">
          <Button variant="ghost" className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            Back to Artists
          </Button>
        </Link>
      </div>

      <div className="max-w-4xl mx-auto">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-3xl">{artist.name}</CardTitle>
            <CardDescription>
              {artist.type} {artist.label ? `• ${artist.label}` : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {artist.agency && (
                <div>
                  <h3 className="font-semibold">Agency</h3>
                  <p>{artist.agency}</p>
                </div>
              )}
              {artist.email && (
                <div>
                  <h3 className="font-semibold">Email</h3>
                  <p>{artist.email}</p>
                </div>
              )}
              {artist.phone && (
                <div>
                  <h3 className="font-semibold">Phone</h3>
                  <p>{artist.phone}</p>
                </div>
              )}
              {artist.web && (
                <div>
                  <h3 className="font-semibold">Website</h3>
                  <p>
                    <a
                      href={artist.web}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {artist.web}
                    </a>
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <h2 className="text-2xl font-bold mb-4">Events</h2>

        {events.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No events found for this artist.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {events.map((event) => (
              <Card key={event.id}>
                <CardHeader>
                  <CardTitle>{event.title}</CardTitle>
                  <CardDescription>
                    {event.category} • {event.state || "Status N/A"} • {event.floors || "Venue N/A"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h3 className="font-semibold">Start</h3>
                      <p>{formatDateTime(event.start_)}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold">End</h3>
                      <p>{formatDateTime(event.end_)}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold">Doors Open</h3>
                      <p>{formatDateTime(event.doors_open)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
