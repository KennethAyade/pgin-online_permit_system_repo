import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Add working days to a date (excludes weekends - Saturday and Sunday)
 * @param startDate - The starting date
 * @param workingDays - Number of working days to add
 * @returns Date with working days added
 */
export function addWorkingDays(startDate: Date, workingDays: number): Date {
  const result = new Date(startDate)
  let daysAdded = 0

  while (daysAdded < workingDays) {
    result.setDate(result.getDate() + 1)
    const dayOfWeek = result.getDay()
    // Skip Saturday (6) and Sunday (0)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      daysAdded++
    }
  }

  return result
}

/**
 * Count working days between two dates (excludes weekends)
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Number of working days between dates
 */
export function getWorkingDaysBetween(startDate: Date, endDate: Date): number {
  let count = 0
  const current = new Date(startDate)

  while (current < endDate) {
    current.setDate(current.getDate() + 1)
    const dayOfWeek = current.getDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++
    }
  }

  return count
}

/**
 * Check if a date is a working day (not Saturday or Sunday)
 * @param date - Date to check
 * @returns true if working day
 */
export function isWorkingDay(date: Date): boolean {
  const dayOfWeek = date.getDay()
  return dayOfWeek !== 0 && dayOfWeek !== 6
}
