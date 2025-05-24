"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { X, Upload, XCircle, AlertTriangle } from "lucide-react"
import type { EventWithUsers } from "@/types/event"
import type { User } from "@/types/user"
import type { Artist } from "@/types/artist"

// Form schema with validation
const eventFormSchema = z.object({
  category: z.enum(["Concert", "Rave"] as const).optional(),
  title: z.string().min(2, { message: "Title must be at least 2 characters" }),
  start_: z.string().min(1, { message: "Start date and time is required" }),
  end_: z.string().optional(),
  doors_open: z.string().optional(),
  state: z.string().optional(),
  floors: z.string().optional(),
  responsible_id: z.string().optional(),
  light_id: z.string().optional(),
  sound_id: z.string().optional(),
  artist_care_id: z.string().optional(),
  admission: z.string().optional(),
  break_even: z.string().optional(),
  presstext: z.string().optional(),
  notes_internal: z.string().optional(),
  technical_notes: z.string().optional(),
  api_notes: z.string().optional(),
  selected_artists: z.array(z.string()).optional(),
})

type EventFormProps = {
  event?: EventWithUsers
  isEditing?: boolean
}

export function EventForm({ event, isEditing = false }: EventFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [artists, setArtists] = useState<Artist[]>([])
  const [selectedArtists, setSelectedArtists] = useState<string[]>([])
  const [uploadedImages, setUploadedImages] = useState<File[]>([])
  const [eventImages, setEventImages] = useState<{ id: number; filename: string; url: string }[]>([])
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)
  const [timeWarnings, setTimeWarnings] = useState<string[]>([])
  const router = useRouter()

  // Helper function to format datetime for input fields (properly handles timezone)
  const formatDateTimeForInput = (timestamp?: string): string => {
    if (!timestamp) return ""

    try {
      const date = new Date(timestamp)

      // Extract local date/time components directly
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, "0")
      const day = String(date.getDate()).padStart(2, "0")
      const hours = String(date.getHours()).padStart(2, "0")
      const minutes = String(date.getMinutes()).padStart(2, "0")

      return `${year}-${month}-${day}T${hours}:${minutes}`
    } catch (e) {
      console.error("Error formatting date:", e)
      return ""
    }
  }

  // Validate time logic and show warnings
  const validateTimeLogic = (start: string, end: string, doorsOpen: string) => {
    const warnings: string[] = []

    if (start && end) {
      const startDate = new Date(start)
      const endDate = new Date(end)

      if (endDate <= startDate) {
        warnings.push("End time should be after start time")
      }
    }

    if (start && doorsOpen) {
      const startDate = new Date(start)
      const doorsDate = new Date(doorsOpen)

      if (doorsDate > startDate) {
        warnings.push("Doors open should not be after start time")
      }
    }

    if (end && doorsOpen) {
      const endDate = new Date(end)
      const doorsDate = new Date(doorsOpen)

      if (doorsDate > endDate) {
        warnings.push("Doors open should not be after end time")
      }
    }

    setTimeWarnings(warnings)
  }

  // Fetch users and artists for dropdowns
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch users
        const usersResponse = await fetch("/api/users")
        if (usersResponse.ok) {
          const userData = await usersResponse.json()
          setUsers(userData)
        }

        // Fetch artists
        const artistsResponse = await fetch("/api/artists")
        if (artistsResponse.ok) {
          const artistsData = await artistsResponse.json()
          setArtists(artistsData)
        }

        // If editing, fetch existing artist bookings
        if (isEditing && event?.id) {
          const bookingsResponse = await fetch(`/api/events/${event.id}/artists`)
          if (bookingsResponse.ok) {
            const bookingsData = await bookingsResponse.json()
            setSelectedArtists(bookingsData.map((booking: any) => booking.artist_id.toString()))
          }

          // Fetch event images
          const imagesResponse = await fetch(`/api/events/${event.id}/images`)
          if (imagesResponse.ok) {
            const imagesData = await imagesResponse.json()
            setEventImages(imagesData)
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      }
    }
    fetchData()
  }, [isEditing, event?.id])

  // Initialize form with default values or existing event data
  const form = useForm<z.infer<typeof eventFormSchema>>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      category: event?.category || "Concert",
      title: event?.title || "",
      start_: formatDateTimeForInput(event?.start_),
      end_: formatDateTimeForInput(event?.end_),
      doors_open: formatDateTimeForInput(event?.doors_open),
      state: event?.state || "Default",
      floors: event?.floors || "Default",
      responsible_id: event?.responsible_id?.toString() || "",
      light_id: event?.light_id?.toString() || "",
      sound_id: event?.sound_id?.toString() || "",
      artist_care_id: event?.artist_care_id?.toString() || "",
      admission: event?.admission?.toString() || "",
      break_even: event?.break_even?.toString() || "",
      presstext: event?.presstext || "",
      notes_internal: event?.notes_internal || "",
      technical_notes: event?.technical_notes || "",
      api_notes: event?.api_notes || "",
      selected_artists: selectedArtists,
    },
  })

  // Watch time fields for validation
  const watchedStart = form.watch("start_")
  const watchedEnd = form.watch("end_")
  const watchedDoorsOpen = form.watch("doors_open")

  useEffect(() => {
    if (watchedStart || watchedEnd || watchedDoorsOpen) {
      validateTimeLogic(watchedStart, watchedEnd, watchedDoorsOpen)
    }
  }, [watchedStart, watchedEnd, watchedDoorsOpen])

  // Update form when selectedArtists changes
  useEffect(() => {
    form.setValue("selected_artists", selectedArtists)
  }, [selectedArtists, form])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setUploadedImages((prev) => [...prev, ...files])
  }

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleArtistToggle = (artistId: string) => {
    setSelectedArtists((prev) => {
      const newSelection = prev.includes(artistId) ? prev.filter((id) => id !== artistId) : [...prev, artistId]

      // Update the form value immediately
      form.setValue("selected_artists", newSelection)
      return newSelection
    })
  }

  const clearField = (fieldName: string) => {
    form.setValue(fieldName, "")
  }

  const removeEventImage = async (imageId: number) => {
    if (!event?.id) return

    try {
      const response = await fetch(`/api/events/${event.id}/images?imageId=${imageId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete image")
      }

      // Remove image from the list
      setEventImages(eventImages.filter((img) => img.id !== imageId))
    } catch (error) {
      console.error("Error deleting image:", error)
      setSubmitError("Failed to delete image. Please try again.")
    }
  }

  const onSubmit = async (data: z.infer<typeof eventFormSchema>) => {
    try {
      setIsSubmitting(true)
      setSubmitError(null)
      setSubmitSuccess(null)

      // Helper function to convert datetime-local input to UTC timestamp
      const convertToUTC = (datetimeLocal: string): string => {
        // Create a date object treating the input as local time
        const localDate = new Date(datetimeLocal)
        // Return as ISO string (which is in UTC)
        return localDate.toISOString()
      }

      // Convert datetime-local inputs to UTC timestamps for database storage
      const eventData = {
        category: data.category || "Concert",
        title: data.title,
        start_: data.start_ ? convertToUTC(data.start_) : null,
        end_: data.end_ ? convertToUTC(data.end_) : null,
        doors_open: data.doors_open ? convertToUTC(data.doors_open) : null,
        state: data.state === "Default" ? null : data.state,
        floors: data.floors === "Default" ? null : data.floors,
        responsible_id:
          data.responsible_id && data.responsible_id !== "0" ? Number.parseInt(data.responsible_id) : null,
        light_id: data.light_id && data.light_id !== "0" ? Number.parseInt(data.light_id) : null,
        sound_id: data.sound_id && data.sound_id !== "0" ? Number.parseInt(data.sound_id) : null,
        artist_care_id:
          data.artist_care_id && data.artist_care_id !== "0" ? Number.parseInt(data.artist_care_id) : null,
        admission: data.admission ? Number.parseInt(data.admission) : null,
        break_even: data.break_even ? Number.parseInt(data.break_even) : null,
        presstext: data.presstext,
        notes_internal: data.notes_internal,
        technical_notes: data.technical_notes,
        api_notes: data.api_notes,
      }

      const url = isEditing ? `/api/events/${event?.id}` : "/api/events"
      const method = isEditing ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save event")
      }

      const savedEvent = await response.json()
      const eventId = savedEvent.id

      // Handle artist bookings - always send the request, even if no artists are selected
      await fetch(`/api/events/${eventId}/artists`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          artist_ids: selectedArtists.length > 0 ? selectedArtists.map((id) => Number.parseInt(id)) : [],
        }),
      })

      // Handle image uploads
      if (uploadedImages.length > 0) {
        for (const file of uploadedImages) {
          const formData = new FormData()
          formData.append("image", file)

          const uploadResponse = await fetch(`/api/events/${eventId}/images`, {
            method: "POST",
            body: formData,
          })

          if (!uploadResponse.ok) {
            console.error("Failed to upload image:", file.name)
          }
        }
      }

      setSubmitSuccess(isEditing ? "Event updated successfully!" : "Event created successfully!")

      // Redirect after a short delay to show success message
      setTimeout(() => {
        router.push("/events")
        router.refresh()
      }, 1500)
    } catch (error: any) {
      console.error("Error saving event:", error)
      setSubmitError(error.message || "Failed to save event. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {submitError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {submitError}</span>
          </div>
        )}

        {submitSuccess && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Success!</strong>
            <span className="block sm:inline"> {submitSuccess}</span>
          </div>
        )}

        {timeWarnings.length > 0 && (
          <div
            className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative"
            role="alert"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <strong className="font-bold">Time Validation Warnings:</strong>
            </div>
            <ul className="list-disc list-inside mt-2">
              {timeWarnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title *</FormLabel>
                <FormControl>
                  <Input placeholder="Event title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || "Concert"}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Concert">Concert</SelectItem>
                    <SelectItem value="Rave">Rave</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="start_"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start *</FormLabel>
                <FormControl>
                  <Input type="datetime-local" step="300" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="end_"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End</FormLabel>
                <FormControl>
                  <Input type="datetime-local" step="300" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="doors_open"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Doors open</FormLabel>
                <FormControl>
                  <Input type="datetime-local" step="300" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State</FormLabel>
                <div className="relative">
                  <Select onValueChange={field.onChange} value={field.value || "Default"}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a state" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Default">Default</SelectItem>
                      <SelectItem value="Confirmed" className="bg-green-100 text-green-800">
                        Confirmed
                      </SelectItem>
                      <SelectItem value="Option" className="bg-yellow-100 text-yellow-800">
                        Option
                      </SelectItem>
                      <SelectItem value="Idea" className="bg-purple-100 text-purple-800">
                        Idea
                      </SelectItem>
                      <SelectItem value="Cancelled" className="bg-red-100 text-red-800">
                        Cancelled
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {field.value && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-8 top-0 h-full"
                      onClick={() => clearField("state")}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="floors"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Floor</FormLabel>
                <div className="relative">
                  <Select onValueChange={field.onChange} value={field.value || "Default"}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a floor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Default">Default</SelectItem>
                      <SelectItem value="Eli">Eli</SelectItem>
                      <SelectItem value="Xxs">Xxs</SelectItem>
                      <SelectItem value="Garderobenfloor">Garderobenfloor</SelectItem>
                      <SelectItem value="Open Air">Open Air</SelectItem>
                    </SelectContent>
                  </Select>
                  {field.value && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-8 top-0 h-full"
                      onClick={() => clearField("floors")}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FormField
            control={form.control}
            name="responsible_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Responsible</FormLabel>
                <div className="relative">
                  <Select onValueChange={field.onChange} value={field.value || "0"}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0">Default</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {field.value && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-8 top-0 h-full"
                      onClick={() => clearField("responsible_id")}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="light_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Light</FormLabel>
                <div className="relative">
                  <Select onValueChange={field.onChange} value={field.value || "0"}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0">Default</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {field.value && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-8 top-0 h-full"
                      onClick={() => clearField("light_id")}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sound_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sound</FormLabel>
                <div className="relative">
                  <Select onValueChange={field.onChange} value={field.value || "0"}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0">Default</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {field.value && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-8 top-0 h-full"
                      onClick={() => clearField("sound_id")}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="artist_care_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Artist Care</FormLabel>
                <div className="relative">
                  <Select onValueChange={field.onChange} value={field.value || "0"}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0">Default</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {field.value && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-8 top-0 h-full"
                      onClick={() => clearField("artist_care_id")}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="admission"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Admission (%)</FormLabel>
                <FormControl>
                  <Input type="number" min="0" max="100" placeholder="0-100" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="break_even"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Break Even (%)</FormLabel>
                <FormControl>
                  <Input type="number" min="0" max="100" placeholder="0-100" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Artist Selection */}
        <div>
          <FormLabel>Artists</FormLabel>
          <div className="mt-2 max-h-48 overflow-y-auto border rounded-md p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {artists.map((artist) => (
                <div key={artist.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`artist-${artist.id}`}
                    checked={selectedArtists.includes(artist.id.toString())}
                    onCheckedChange={() => handleArtistToggle(artist.id.toString())}
                  />
                  <label
                    htmlFor={`artist-${artist.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {artist.name} ({artist.type})
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Display existing images */}
        {eventImages.length > 0 && (
          <div>
            <FormLabel>Current Images</FormLabel>
            <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4">
              {eventImages.map((image) => (
                <div key={image.id} className="relative">
                  <img
                    src={image.url || "/placeholder.svg"}
                    alt={image.filename}
                    className="w-full h-32 object-cover rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => removeEventImage(image.id)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    title="Remove image"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Image Upload */}
        <div>
          <FormLabel>Event Images</FormLabel>
          <div className="mt-2">
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="image-upload"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-4 text-gray-500" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> event images
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG or JPEG (MAX. 10MB)</p>
                </div>
                <input
                  id="image-upload"
                  type="file"
                  className="hidden"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </label>
            </div>

            {uploadedImages.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">New Images to Upload:</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {uploadedImages.map((file, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(file) || "/placeholder.svg"}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-20 object-cover rounded"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <FormField
          control={form.control}
          name="presstext"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Press Text</FormLabel>
              <FormControl>
                <Textarea placeholder="Press release text" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes_internal"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Internal Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="Internal notes" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="technical_notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Technical Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="Technical requirements and notes" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="api_notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>API Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="API-related notes" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4 justify-end">
          <Button type="button" variant="outline" onClick={() => router.push("/events")} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEditing ? "Update Event" : "Create Event"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
