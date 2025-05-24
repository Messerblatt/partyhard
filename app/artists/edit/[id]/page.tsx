import { notFound } from "next/navigation"
import Link from "next/link"
import { ArtistForm } from "@/components/artist-form"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import { query } from "@/lib/db"
import type { Artist } from "@/types/artist"

async function getArtist(id: string): Promise<Artist | null> {
  try {
    const result = await query("SELECT * FROM artists WHERE id = $1", [id])

    if (result.rows.length === 0) {
      return null
    }

    return result.rows[0] as Artist
  } catch (error) {
    console.error("Error fetching artist:", error)
    throw new Error("Failed to fetch artist")
  }
}

export default async function EditArtistPage({ params }: { params: { id: string } }) {
  const artist = await getArtist(params.id)

  if (!artist) {
    notFound()
  }

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

      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Edit Artist: {artist.name}</h1>
        <ArtistForm artist={artist} isEditing={true} />
      </div>
    </div>
  )
}
