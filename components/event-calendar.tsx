"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import Link from "next/link"
import type { EventWithUsers } from "@/types/event"

type CalendarView = "month" | "week" | "year"

interface EventCalendarProps {
  events: EventWithUsers[]
  onEventClick?: (event: EventWithUsers) => void
}

// Get color class for state
const getStateColorClass = (state?: string) => {
  switch (state) {
    case "Confirmed":
      return "bg-green-100 text-green-800 border-green-300"
    case "Option":
      return "bg-yellow-100 text-yellow-800 border-yellow-300"
    case "Idea":
      return "bg-purple-100 text-purple-800 border-purple-300"
    case "Cancelled":
      return "bg-red-100 text-red-800 border-red-300"
    default:
      return "bg-gray-100 text-gray-800 border-gray-300"
  }
}

// Get color class for event category
const getCategoryColorClass = (category?: string, state?: string) => {
  // If we have a state, prioritize state color
  if (state) {
    return getStateColorClass(state)
  }

  // Otherwise use category color
  switch (category) {
    case "Concert":
      return "bg-blue-100 text-blue-800 hover:bg-blue-200"
    case "Rave":
      return "bg-purple-100 text-purple-800 hover:bg-purple-200"
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-200"
  }
}

export function EventCalendar({ events, onEventClick }: EventCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<CalendarView>("month")

  // Format date to YYYY-MM-DD for comparison (in local timezone)
  const formatDate = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  // Get events for a specific date (comparing in local timezone)
  const getEventsForDate = (date: Date): EventWithUsers[] => {
    const dateStr = formatDate(date)
    return events.filter((event) => {
      if (!event.start_) return false

      // Convert event.start_ to local date for comparison
      const eventDate = new Date(event.start_)
      const eventDateStr = formatDate(eventDate)

      return eventDateStr === dateStr
    })
  }

  // Navigate between time periods
  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate)

    switch (view) {
      case "month":
        newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1))
        break
      case "week":
        newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7))
        break
      case "year":
        newDate.setFullYear(newDate.getFullYear() + (direction === "next" ? 1 : -1))
        break
    }

    setCurrentDate(newDate)
  }

  // Get title for current view
  const getDateTitle = (): string => {
    switch (view) {
      case "month":
        return currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })
      case "week":
        const weekStart = new Date(currentDate)
        weekStart.setDate(currentDate.getDate() - currentDate.getDay())
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        return `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
      case "year":
        return currentDate.getFullYear().toString()
    }
  }

  // Render month view
  const renderMonthView = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    // Get first day of the month
    const firstDay = new Date(year, month, 1)

    // Get the day of the week for the first day (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfWeek = firstDay.getDay()

    // Get the last day of the month
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()

    // Create a date object for the first day to display (may be from previous month)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDayOfWeek)

    // Weekday headers
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

    // Generate calendar cells
    const days = []
    const currentDateObj = new Date(startDate)

    // We'll display 6 weeks (42 days) to ensure we have enough rows
    for (let i = 0; i < 42; i++) {
      const dateStr = formatDate(currentDateObj)
      const dayEvents = getEventsForDate(currentDateObj)
      const isCurrentMonth = currentDateObj.getMonth() === month
      const isToday = formatDate(new Date()) === dateStr

      days.push(
        <div
          key={dateStr}
          className={`min-h-[100px] p-2 border border-gray-200 ${
            isCurrentMonth ? "bg-white" : "bg-gray-50"
          } ${isToday ? "bg-blue-50" : ""}`}
        >
          <div className={`text-sm font-medium mb-1 ${isCurrentMonth ? "text-gray-900" : "text-gray-400"}`}>
            {currentDateObj.getDate()}
          </div>
          <div className="space-y-1">
            {dayEvents.slice(0, 3).map((event) => (
              <div
                key={event.id}
                onClick={() => onEventClick?.(event)}
                className={`text-xs p-1 rounded cursor-pointer truncate ${getCategoryColorClass(event.category, event.state)}`}
                title={event.title}
              >
                {event.title}
              </div>
            ))}
            {dayEvents.length > 3 && <div className="text-xs text-gray-500">+{dayEvents.length - 3} more</div>}
          </div>
        </div>,
      )

      // Move to next day
      currentDateObj.setDate(currentDateObj.getDate() + 1)
    }

    return (
      <div className="grid grid-cols-7 gap-0 border border-gray-200">
        {weekdays.map((day) => (
          <div key={day} className="p-3 bg-gray-100 text-center font-medium text-sm border-b border-gray-200">
            {day}
          </div>
        ))}
        {days}
      </div>
    )
  }

  // Render week view
  const renderWeekView = () => {
    // Get the first day of the week (Sunday)
    const weekStart = new Date(currentDate)
    weekStart.setDate(currentDate.getDate() - currentDate.getDay())

    const days = []
    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(weekStart)
      currentDay.setDate(weekStart.getDate() + i)
      const dayEvents = getEventsForDate(currentDay)
      const isToday = formatDate(new Date()) === formatDate(currentDay)

      days.push(
        <div
          key={formatDate(currentDay)}
          className={`min-h-[200px] p-3 border border-gray-200 ${isToday ? "bg-blue-50" : "bg-white"}`}
        >
          <div className="font-medium mb-2">
            <div className="text-sm text-gray-600">{currentDay.toLocaleDateString("en-US", { weekday: "short" })}</div>
            <div className={`text-lg ${isToday ? "text-blue-600" : ""}`}>{currentDay.getDate()}</div>
          </div>
          <div className="space-y-2">
            {dayEvents.map((event) => (
              <div
                key={event.id}
                onClick={() => onEventClick?.(event)}
                className={`text-sm p-2 rounded cursor-pointer ${getCategoryColorClass(event.category, event.state)}`}
              >
                <div className="font-medium truncate">{event.title}</div>
                {event.state && <div className="text-xs opacity-75">{event.state}</div>}
              </div>
            ))}
          </div>
        </div>,
      )
    }

    return <div className="grid grid-cols-7 gap-0 border border-gray-200">{days}</div>
  }

  // Render year view
  const renderYearView = () => {
    const year = currentDate.getFullYear()
    const months = []

    for (let month = 0; month < 12; month++) {
      // Create a date for the first day of the month
      const monthDate = new Date(year, month, 1)

      // Filter events for this month
      const monthEvents = events.filter((event) => {
        if (!event.start_) return false
        const eventDate = new Date(event.start_)
        return eventDate.getFullYear() === year && eventDate.getMonth() === month
      })

      months.push(
        <Card key={month} className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{monthDate.toLocaleDateString("en-US", { month: "long" })}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600 mb-2">{monthEvents.length}</div>
            <div className="text-sm text-gray-500">{monthEvents.length === 1 ? "event" : "events"}</div>
            <div className="mt-2 space-y-1">
              {monthEvents.slice(0, 3).map((event) => (
                <div
                  key={event.id}
                  className={`text-xs p-1 rounded truncate cursor-pointer ${getCategoryColorClass(event.category, event.state)}`}
                  title={event.title}
                  onClick={() => onEventClick?.(event)}
                >
                  {event.title}
                </div>
              ))}
              {monthEvents.length > 3 && <div className="text-xs text-gray-500">+{monthEvents.length - 3} more</div>}
            </div>
          </CardContent>
        </Card>,
      )
    }

    return <div className="grid grid-cols-3 md:grid-cols-4 gap-4">{months}</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigateDate("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-semibold min-w-[200px] text-center">{getDateTitle()}</h2>
            <Button variant="outline" size="icon" onClick={() => navigateDate("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Select value={view} onValueChange={(value: CalendarView) => setView(value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="year">Year</SelectItem>
            </SelectContent>
          </Select>
          <Link href="/events/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Event
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg">
        {view === "month" && renderMonthView()}
        {view === "week" && renderWeekView()}
        {view === "year" && renderYearView()}
      </div>
    </div>
  )
}
