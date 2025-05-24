"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
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
import { Edit, Trash2, Calendar, RefreshCw } from "lucide-react"
import type { Artist } from "@/types/artist"
import { toast } from "@/components/ui/use-toast"

interface ArtistWithEventCount extends Artist {
  event_count: number
}

export function ArtistList() {
  const [artists, setArtists] = useState<ArtistWithEventCount[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [artistToDelete, setArtistToDelete] = useState<ArtistWithEventCount | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchArtists()
  }, [])

  const fetchArtists = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      const response = await fetch("/api/artists")

      if (!response.ok) {
        throw new Error("Failed to fetch artists")
      }

      const data = await response.json()
      setArtists(data)
      setError(null)
    } catch (err) {
      setError("Error loading artists. Please try again.")
      console.error("Error fetching artists:", err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const refreshArtists = () => {
    fetchArtists(true)
  }

  const handleDeleteClick = (artist: ArtistWithEventCount) => {
    setArtistToDelete(artist)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!artistToDelete) return

    try {
      const response = await fetch(`/api/artists/${artistToDelete.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete artist")
      }

      // Remove artist from the list
      setArtists(artists.filter((artist) => artist.id !== artistToDelete.id))
      toast({
        title: "Artist deleted",
        description: `${artistToDelete.name} has been deleted successfully.`,
      })
    } catch (err) {
      console.error("Error deleting artist:", err)
      toast({
        title: "Error",
        description: "Failed to delete artist. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setArtistToDelete(null)
    }
  }

  if (loading) {
    return <div className="text-center py-10">Loading artists...</div>
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => fetchArtists()}>Try Again</Button>
      </div>
    )
  }

  if (artists.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="mb-4">No artists found. Add your first artist to get started.</p>
        <Link href="/artists/new">
          <Button>Add New Artist</Button>
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Artists ({artists.length})</h2>
        <Button variant="outline" size="sm" onClick={refreshArtists} disabled={refreshing} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Label</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Agency</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {artists.map((artist) => (
              <TableRow key={artist.id}>
                <TableCell className="font-medium">{artist.name}</TableCell>
                <TableCell>{artist.type}</TableCell>
                <TableCell>{artist.label || "-"}</TableCell>
                <TableCell>{artist.email || "-"}</TableCell>
                <TableCell>{artist.agency || "-"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={`/artists/${artist.id}/events`}>
                      <Button variant="outline" size="icon" title="View Events">
                        <Calendar className="h-4 w-4" />
                        <span className="sr-only">Events</span>
                      </Button>
                    </Link>
                    <Link href={`/artists/edit/${artist.id}`}>
                      <Button variant="outline" size="icon" title="Edit Artist">
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDeleteClick(artist)}
                      title="Delete Artist"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {artistToDelete?.name}. This action cannot be undone.
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
    </>
  )
}
