export type ArtistType = "DJ" | "Live" | "Drag Performance"

export interface Artist {
  id: number
  name: string
  type: ArtistType
  label?: string
  members?: string
  agency?: string
  notes?: string
  email?: string
  phone?: string
  web?: string
  event_count?: number
}

export interface ArtistFormData {
  name: string
  type: ArtistType
  label?: string
  members?: string
  agency?: string
  notes?: string
  email?: string
  phone?: string
  web?: string
}

export interface Tag {
  id: number
  name: string
}

export interface Event {
  id: number
  category: string
  title: string
  start_?: string // TIMESTAMP field
  end_?: string // TIMESTAMP field
  doors_open?: string // TIMESTAMP field
  state?: string
  floors?: string
}
