export type Category = '観光' | '食事' | 'ホテル' | '移動'

export interface TripSummary {
  title: string
  destination: string
  startDate: string
  endDate: string
  status: string
  progress: number
}

export interface ItineraryItem {
  id: string
  title: string
  dateTime: string
  location: string
  category: Category
  notes: string
  reminderMinutes: number
}

export interface PlannerData {
  trip: TripSummary
  itinerary: ItineraryItem[]
}

export interface MockReminder {
  id: string
  title: string
  detail: string
  timingLabel: string
  kind: 'due' | 'upcoming'
}

export interface MockAiPlan {
  headline: string
  hotelSuggestion: string
  sightseeingSuggestion: string
  foodSuggestion: string
  scheduleSuggestion: string
  note: string
}
