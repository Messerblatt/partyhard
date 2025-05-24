export type EventCategory = "Concert" | "Rave"
export type EventState = "Confirmed" | "Option" | "Idea" | "Cancelled"
export type EventFloor = "Eli" | "Xxs" | "Garderobenfloor" | "Open Air"

export interface Event {
  id: number
  category: EventCategory
  title: string
  start_?: string // TIMESTAMP field
  end_?: string // TIMESTAMP field
  doors_open?: string // TIMESTAMP field
  state?: EventState
  floors?: EventFloor
  responsible_id?: number
  light_id?: number
  sound_id?: number
  artist_care_id?: number
  with_options?: Record<string, any>
  admission?: number
  break_even?: number
  presstext?: string
  notes_internal?: string
  technical_notes?: string
  api_notes?: string
}

export interface EventFormData {
  category: EventCategory
  title: string
  start_?: string
  end_?: string
  doors_open?: string
  state?: EventState
  floors?: EventFloor
  responsible_id?: number
  light_id?: number
  sound_id?: number
  artist_care_id?: number
  admission?: number
  break_even?: number
  presstext?: string
  notes_internal?: string
  technical_notes?: string
  api_notes?: string
}

export interface EventWithUsers extends Event {
  responsible_name?: string
  light_name?: string
  sound_name?: string
  artist_care_name?: string
}

export interface EventImage {
  id: number
  event_id: number
  filename: string
  url: string
  uploaded_at: string
}
