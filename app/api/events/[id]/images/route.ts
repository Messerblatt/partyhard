import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { writeFile } from "fs/promises"
import { join } from "path"
import { mkdir } from "fs/promises"
import { v4 as uuidv4 } from "uuid"

// GET endpoint to retrieve images for an event
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const eventId = params.id
    const result = await query("SELECT * FROM event_images WHERE event_id = $1", [eventId])

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Error fetching event images:", error)
    return NextResponse.json({ error: "Failed to fetch event images" }, { status: 500 })
  }
}

// POST endpoint to upload a new image for an event
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const eventId = params.id

    // Check if the event exists
    const eventCheck = await query("SELECT id FROM events WHERE id = $1", [eventId])
    if (eventCheck.rows.length === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Parse the multipart form data
    const formData = await request.formData()
    const file = formData.get("image") as File

    if (!file) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 })
    }

    // Create a unique filename
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Ensure the uploads directory exists
    const uploadDir = join(process.cwd(), "public", "uploads", "events", eventId)
    await mkdir(uploadDir, { recursive: true })

    // Generate a unique filename
    const uniqueFilename = `${uuidv4()}-${file.name.replace(/\s+/g, "-").toLowerCase()}`
    const filePath = join(uploadDir, uniqueFilename)

    // Write the file to disk
    await writeFile(filePath, buffer)

    // Create the public URL for the image
    const fileUrl = `/uploads/events/${eventId}/${uniqueFilename}`

    // Save the image information to the database
    const result = await query("INSERT INTO event_images (event_id, filename, url) VALUES ($1, $2, $3) RETURNING *", [
      eventId,
      uniqueFilename,
      fileUrl,
    ])

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error("Error uploading event image:", error)
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 })
  }
}

// DELETE endpoint to remove an image
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const eventId = params.id
    const { searchParams } = new URL(request.url)
    const imageId = searchParams.get("imageId")

    if (!imageId) {
      return NextResponse.json({ error: "Image ID is required" }, { status: 400 })
    }

    // Delete the image record from the database
    const result = await query("DELETE FROM event_images WHERE id = $1 AND event_id = $2 RETURNING *", [
      imageId,
      eventId,
    ])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 })
    }

    // Note: In a production app, you would also delete the physical file here

    return NextResponse.json({ message: "Image deleted successfully" })
  } catch (error) {
    console.error("Error deleting event image:", error)
    return NextResponse.json({ error: "Failed to delete image" }, { status: 500 })
  }
}
