"use client"

import type React from "react"

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
import { Plus, X, CornerDownLeft } from "lucide-react"
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
  const [memberInputs, setMemberInputs] = useState<string[]>([""])
  const [membersList, setMembersList] = useState<string[]>(
    artist?.members
      ? artist.members
          .split(",")
          .map((m) => m.trim())
          .filter(Boolean)
      : [],
  )
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

  const addMemberInput = () => {
    setMemberInputs([...memberInputs, ""])
  }

  const removeMemberInput = (index: number) => {
    setMemberInputs(memberInputs.filter((_, i) => i !== index))
  }

  const updateMemberInput = (index: number, value: string) => {
    const newInputs = [...memberInputs]
    newInputs[index] = value
    setMemberInputs(newInputs)
  }

  const addMemberToList = (index: number) => {
    const memberName = memberInputs[index].trim()
    if (memberName && !membersList.includes(memberName)) {
      const newMembersList = [...membersList, memberName]
      setMembersList(newMembersList)
      form.setValue("members", newMembersList.join(", "))

      // Clear the input
      const newInputs = [...memberInputs]
      newInputs[index] = ""
      setMemberInputs(newInputs)
    }
  }

  const removeMemberFromList = (memberToRemove: string) => {
    const newMembersList = membersList.filter((member) => member !== memberToRemove)
    setMembersList(newMembersList)
    form.setValue("members", newMembersList.join(", "))
  }

  const handleKeyPress = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addMemberToList(index)
    }
  }

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

        {/* Dynamic Members Section */}
        <div>
          <FormLabel>Members</FormLabel>

          {/* Display current members list */}
          {membersList.length > 0 && (
            <div className="mt-2 mb-4">
              <div className="text-sm text-gray-600 mb-2">Current members:</div>
              <div className="flex flex-wrap gap-2">
                {membersList.map((member, index) => (
                  <div
                    key={index}
                    className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm"
                  >
                    <span>{member}</span>
                    <button
                      type="button"
                      onClick={() => removeMemberFromList(member)}
                      className="hover:bg-blue-200 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dynamic input fields */}
          <div className="space-y-2">
            {memberInputs.map((input, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  placeholder="Enter member name"
                  value={input}
                  onChange={(e) => updateMemberInput(index, e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => addMemberToList(index)}
                  disabled={!input.trim()}
                  title="Add member (Enter)"
                >
                  <CornerDownLeft className="h-4 w-4" />
                </Button>
                {memberInputs.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeMemberInput(index)}
                    title="Remove input field"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Add new input button */}
          <Button type="button" variant="outline" size="sm" onClick={addMemberInput} className="mt-2 gap-2">
            <Plus className="h-4 w-4" />
            Add Member Input
          </Button>

          {/* Hidden field for form submission */}
          <FormField
            control={form.control}
            name="members"
            render={({ field }) => (
              <FormItem className="hidden">
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

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
