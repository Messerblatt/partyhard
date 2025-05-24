import { notFound } from "next/navigation"
import Link from "next/link"
import { EventForm } from "@/components/event-form"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import { query } from "@/lib/db"
import type { EventWithUsers } from "@/types/event"

async function getEvent(id: string): Promise<EventWithUsers | null> {
  try {
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
      return null
    }

    return result.rows[0] as EventWithUsers
  } catch (error) {
    console.error("Error fetching event:", error)
    throw new Error("Failed to fetch event")
  }
}

export default async function EditEventPage({ params }: { params: { id: string } }) {
  const event = await getEvent(params.id)

  if (!event) {
    notFound()
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-6">
        <Link href="/events">
          <Button variant="ghost" className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            Back to Events
          </Button>
        </Link>
      </div>

      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Edit Event: {event.title}</h1>
        <EventForm event={event} isEditing={true} />
      </div>
    </div>
  )
}
