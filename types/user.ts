export type UserRole = "Admin" | "Booker" | "Door" | "Event Manager" | "Other"

export interface User {
  id: number
  role: UserRole
  name: string
  email: string
  phone: string | null
  password: string
}

export interface UserFormData {
  role: UserRole
  name: string
  email: string
  phone?: string
  password: string
  confirmPassword?: string
}
