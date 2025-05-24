"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import type { Artist } from "@/types/artist"

// Form schema with validation
const artistFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  type: z.enum(["DJ", "Live", "Drag Performance"] as const),
  label: z.string().optional(),
  members: z.string().optional(),
  agency: z.string().optional(),
  notes: z.string().max(500, { message: "Notes must be less than 500 characters" }).optional(),
  email: z.string().email({ message: "Please enter a valid email address" }).optional().or(z.literal("")),
  phone: z.string().optional(),
  web: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal("")),
})

type ArtistFormProps = {
  artist?: Artist
  isEditing?: boolean
}

export function ArtistForm({ artist, isEditing = false }: ArtistFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  // Initialize form with default values or existing artist data
  const form = useForm<z.infer<typeof artistFormSchema>>({
    resolver: zodResolver(artistFormSchema),
    defaultValues: {
      name: artist?.name || "",
      type: artist?.type || "DJ",
      label: artist?.label || "",
      members: artist?.members || "",
      agency: artist?.agency || "",
      notes: artist?.notes || "",
      email: artist?.email || "",
      phone: artist?.phone || "",
      web: artist?.web || "",
    },
  })

  const onSubmit = async (data: z.infer<typeof artistFormSchema>) => {
    try {
      setIsSubmitting(true)

      const url = isEditing ? `/api/artists/${artist?.id}` : "/api/artists"
      const method = isEditing ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save artist")
      }

      toast({
        title: isEditing ? "Artist updated" : "Artist created",
        description: isEditing
          ? `${data.name} has been updated successfully.`
          : `${data.name} has been added successfully.`,
      })

      // Redirect to artists list
      router.push("/artists")
      router.refresh()
    } catch (error: any) {
      console.error("Error saving artist:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save artist. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name *</FormLabel>
              <FormControl>
                <Input placeholder="Artist name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="DJ">DJ</SelectItem>
                  <SelectItem value="Live">Live</SelectItem>
                  <SelectItem value="Drag Performance">Drag Performance</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="label"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Label</FormLabel>
              <FormControl>
                <Input placeholder="Record label" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="members"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Members</FormLabel>
              <FormControl>
                <Textarea placeholder="Group members (for bands/collectives)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="agency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Agency</FormLabel>
              <FormControl>
                <Input placeholder="Booking agency" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="Additional notes" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Email address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input placeholder="Phone number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="web"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website</FormLabel>
                <FormControl>
                  <Input placeholder="Website URL" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-4 justify-end">
          <Button type="button" variant="outline" onClick={() => router.push("/artists")} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEditing ? "Update Artist" : "Create Artist"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
