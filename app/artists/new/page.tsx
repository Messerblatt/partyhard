import Link from "next/link"
import { ArtistForm } from "@/components/artist-form"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"

export default function NewArtistPage() {
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
        <h1 className="text-3xl font-bold mb-8">Add New Artist</h1>
        <ArtistForm />
      </div>
    </div>
  )
}
