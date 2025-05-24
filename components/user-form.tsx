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
import { toast } from "@/components/ui/use-toast"
import type { User } from "@/types/user"

// Form schema with validation
const userFormSchema = z
  .object({
    role: z.enum(["Admin", "Booker", "Door", "Event Manager", "Other"] as const),
    name: z.string().min(2, { message: "Name must be at least 2 characters" }),
    email: z.string().email({ message: "Please enter a valid email address" }),
    phone: z.string().optional(),
    password: z.string().min(6, { message: "Password must be at least 6 characters" }).optional(),
    confirmPassword: z.string().optional(),
  })
  .refine(
    (data) => {
      // If password is provided, confirmPassword must match
      if (data.password && data.password !== data.confirmPassword) {
        return false
      }
      return true
    },
    {
      message: "Passwords don't match",
      path: ["confirmPassword"],
    },
  )

type UserFormProps = {
  user?: User
  isEditing?: boolean
}

export function UserForm({ user, isEditing = false }: UserFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  // Initialize form with default values or existing user data
  const form = useForm<z.infer<typeof userFormSchema>>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      role: user?.role || "Other",
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      password: "",
      confirmPassword: "",
    },
  })

  const onSubmit = async (data: z.infer<typeof userFormSchema>) => {
    try {
      setIsSubmitting(true)

      // Remove confirmPassword before sending to API
      const { confirmPassword, ...userData } = data

      // If editing and password is empty, remove it from the request
      if (isEditing && !userData.password) {
        delete userData.password
      }

      const url = isEditing ? `/api/users/${user?.id}` : "/api/users"
      const method = isEditing ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save user")
      }

      toast({
        title: isEditing ? "User updated" : "User created",
        description: isEditing
          ? `${data.name} has been updated successfully.`
          : `${data.name} has been added successfully.`,
      })

      // Redirect to users list
      router.push("/")
      router.refresh()
    } catch (error: any) {
      console.error("Error saving user:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save user. Please try again.",
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
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Booker">Booker</SelectItem>
                  <SelectItem value="Door">Door</SelectItem>
                  <SelectItem value="Event Manager">Event Manager</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Full name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
              <FormLabel>Phone (optional)</FormLabel>
              <FormControl>
                <Input placeholder="Phone number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{isEditing ? "New Password (leave blank to keep current)" : "Password"}</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Confirm password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4 justify-end">
          <Button type="button" variant="outline" onClick={() => router.push("/")} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEditing ? "Update User" : "Create User"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
