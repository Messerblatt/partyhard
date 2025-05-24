import { notFound } from "next/navigation"
import Link from "next/link"
import { UserForm } from "@/components/user-form"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import { query } from "@/lib/db"
import type { User } from "@/types/user"

async function getUser(id: string): Promise<User | null> {
  try {
    const result = await query("SELECT id, role, name, email, phone FROM users WHERE id = $1", [id])

    if (result.rows.length === 0) {
      return null
    }

    return result.rows[0] as User
  } catch (error) {
    console.error("Error fetching user:", error)
    throw new Error("Failed to fetch user")
  }
}

export default async function EditUserPage({ params }: { params: { id: string } }) {
  const user = await getUser(params.id)

  if (!user) {
    notFound()
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            Back to Users
          </Button>
        </Link>
      </div>

      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Edit User: {user.name}</h1>
        <UserForm user={user} isEditing={true} />
      </div>
    </div>
  )
}
