import { createDemoPlannerData } from './mockData'
import type { PlannerData } from './types'

export const STORAGE_KEY = 'couple-trip-planner-ui-demo'

const isPlannerData = (value: unknown): value is PlannerData => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<PlannerData>

  return Boolean(
    candidate.trip &&
      typeof candidate.trip.title === 'string' &&
      typeof candidate.trip.destination === 'string' &&
      typeof candidate.trip.startDate === 'string' &&
      typeof candidate.trip.endDate === 'string' &&
      typeof candidate.trip.status === 'string' &&
      typeof candidate.trip.progress === 'number' &&
      Array.isArray(candidate.itinerary),
  )
}

export const sortItinerary = (itinerary: PlannerData['itinerary']) =>
  [...itinerary].sort((left, right) => left.dateTime.localeCompare(right.dateTime))

export const loadPlannerData = (): PlannerData => {
  if (typeof window === 'undefined') {
    return createDemoPlannerData()
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)

  if (!raw) {
    return createDemoPlannerData()
  }

  let parsed: unknown

  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('Unable to parse planner data from localStorage')
  }

  if (!isPlannerData(parsed)) {
    throw new Error('Invalid planner data in localStorage')
  }

  return {
    ...parsed,
    itinerary: sortItinerary(parsed.itinerary),
  }
}

export const savePlannerData = (data: PlannerData) => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ...data,
      itinerary: sortItinerary(data.itinerary),
    }),
  )
}

export const resetPlannerData = () => {
  if (typeof window === 'undefined') {
    return createDemoPlannerData()
  }

  window.localStorage.removeItem(STORAGE_KEY)
  return createDemoPlannerData()
}
