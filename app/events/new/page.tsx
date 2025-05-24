import Link from "next/link"
import { EventForm } from "@/components/event-form"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"

export default function NewEventPage() {
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
        <h1 className="text-3xl font-bold mb-8">Add New Event</h1>
        <EventForm />
      </div>
    </div>
  )
}
