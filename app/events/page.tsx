"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { EventCalendar } from "@/components/event-calendar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Edit, Trash2 } from "lucide-react"
import type { EventWithUsers } from "@/types/event"

// Get color class for state
const getStateColorClass = (state?: string) => {
  switch (state) {
    case "Confirmed":
      return "bg-green-100 text-green-800 border-green-300"
    case "Option":
      return "bg-yellow-100 text-yellow-800 border-yellow-300"
    case "Idea":
      return "bg-purple-100 text-purple-800 border-purple-300"
    case "Cancelled":
      return "bg-red-100 text-red-800 border-red-300"
    default:
      return "bg-gray-100 text-gray-800 border-gray-300"
  }
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventWithUsers[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<EventWithUsers | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [eventToDelete, setEventToDelete] = useState<EventWithUsers | null>(null)
  const [eventImages, setEventImages] = useState<{ id: number; filename: string; url: string }[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchEvents()
  }, [])

  // Fetch event images when an event is selected
  useEffect(() => {
    if (selectedEvent) {
      fetchEventImages(selectedEvent.id)
    } else {
      setEventImages([])
    }
  }, [selectedEvent])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/events")

      if (!response.ok) {
        throw new Error("Failed to fetch events")
      }

      const data = await response.json()
      console.log("Fetched events:", data) // Debug log
      setEvents(data)
    } catch (err) {
      console.error("Error fetching events:", err)
      setError("Failed to load events. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const fetchEventImages = async (eventId: number) => {
    try {
      const response = await fetch(`/api/events/${eventId}/images`)
      if (!response.ok) {
        throw new Error("Failed to fetch event images")
      }
      const data = await response.json()
      setEventImages(data)
    } catch (err) {
      console.error("Error fetching event images:", err)
      setEventImages([])
    }
  }

  const handleEventClick = (event: EventWithUsers) => {
    setSelectedEvent(event)
  }

  const handleDeleteClick = (event: EventWithUsers) => {
    setEventToDelete(event)
    setDeleteDialogOpen(true)
    setSelectedEvent(null)
  }

  const confirmDelete = async () => {
    if (!eventToDelete) return

    try {
      const response = await fetch(`/api/events/${eventToDelete.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete event")
      }

      // Remove event from the list
      setEvents(events.filter((event) => event.id !== eventToDelete.id))
      setError(null)
    } catch (err) {
      console.error("Error deleting event:", err)
      setError("Failed to delete event. Please try again.")
    } finally {
      setDeleteDialogOpen(false)
      setEventToDelete(null)
    }
  }

  const formatDateTime = (timestamp?: string): string => {
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

  if (loading) {
    return (
      <main className="container mx-auto py-10 px-4">
        <div className="text-center py-10">Loading events...</div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="container mx-auto py-10 px-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
        <Button onClick={fetchEvents}>Try Again</Button>
      </main>
    )
  }

  return (
    <main className="container mx-auto py-10 px-4">
      <Tabs defaultValue="events" className="w-full">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Management System</h1>
            <TabsList className="mt-4">
              <Link href="/">
                <TabsTrigger value="users">Users</TabsTrigger>
              </Link>
              <Link href="/artists">
                <TabsTrigger value="artists">Artists</TabsTrigger>
              </Link>
              <Link href="/events">
                <TabsTrigger value="events">Events</TabsTrigger>
              </Link>
            </TabsList>
          </div>
        </div>
        <TabsContent value="events" className="mt-0">
          <EventCalendar events={events} onEventClick={handleEventClick} />
        </TabsContent>
      </Tabs>

      {/* Event Details Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between p-2 bg-red-500">
              <span>{selectedEvent?.title}</span>
              <div className="flex gap-2">
                <Link href={`/events/edit/${selectedEvent?.id}`}>
                  <Button variant="outline" size="icon">
                    <Edit className="h-4 w-lg" />
                  </Button>
                </Link>
                <Button variant="outline" size="icon" onClick={() => selectedEvent && handleDeleteClick(selectedEvent)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              <span>{selectedEvent?.category}</span>
              {selectedEvent?.state && (
                <span className={`px-2 py-1 text-xs rounded-full ${getStateColorClass(selectedEvent.state)}`}>
                  {selectedEvent.state}
                </span>
              )}
              {selectedEvent?.floors && <span>• {selectedEvent.floors}</span>}
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4">
              {/* Event Images */}
              {eventImages.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Event Images</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {eventImages.map((image) => (
                      <img
                        key={image.id}
                        src={image.url || "/placeholder.svg"}
                        alt={image.filename}
                        className="w-full h-48 object-cover rounded-md"
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold">Start</h3>
                  <p>{formatDateTime(selectedEvent.start_)}</p>
                </div>
                <div>
                  <h3 className="font-semibold">End</h3>
                  <p>{formatDateTime(selectedEvent.end_)}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Doors Open</h3>
                  <p>{formatDateTime(selectedEvent.doors_open)}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Admission</h3>
                  <p>{selectedEvent.admission ? `${selectedEvent.admission}%` : "N/A"}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold">Responsible</h3>
                  <p>{selectedEvent.responsible_name || "N/A"}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Light</h3>
                  <p>{selectedEvent.light_name || "N/A"}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Sound</h3>
                  <p>{selectedEvent.sound_name || "N/A"}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Artist Care</h3>
                  <p>{selectedEvent.artist_care_name || "N/A"}</p>
                </div>
              </div>

              {selectedEvent.presstext && (
                <div>
                  <h3 className="font-semibold">Press Text</h3>
                  <p className="text-sm text-gray-600">{selectedEvent.presstext}</p>
                </div>
              )}

              {selectedEvent.notes_internal && (
                <div>
                  <h3 className="font-semibold">Internal Notes</h3>
                  <p className="text-sm text-gray-600">{selectedEvent.notes_internal}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {eventToDelete?.title}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}
