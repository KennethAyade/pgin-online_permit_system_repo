'use client'

/**
 * Coordinate Point Manager Component
 * Phase 2.1: Dynamic add/remove coordinate points (min 3, unlimited)
 * Updated: Support DMS (Degrees-Minutes-Seconds) coordinate format
 */

import { useState } from 'react'
import { Plus, Trash2, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { CoordinatePoint } from '@/lib/geo/coordinate-validation'
import { validateCoordinatePoint } from '@/lib/geo/coordinate-validation'
import { parseDMS, decimalToDMS, validateDMSCoordinate } from '@/lib/geo/dms-utils'

interface CoordinatePointManagerProps {
  coordinates: CoordinatePoint[]
  onChange: (coordinates: CoordinatePoint[]) => void
  isReadOnly?: boolean
  minPoints?: number
  maxPoints?: number
}

export function CoordinatePointManager({
  coordinates,
  onChange,
  isReadOnly = false,
  minPoints = 3,
  maxPoints = 100,
}: CoordinatePointManagerProps) {
  const [errors, setErrors] = useState<Record<number, string[]>>({})

  const handleAddPoint = () => {
    if (coordinates.length >= maxPoints) {
      return
    }

    // Add a new empty point
    const newCoordinates = [
      ...coordinates,
      { lat: 0, lng: 0 } as CoordinatePoint,
    ]
    onChange(newCoordinates)
  }

  const handleRemovePoint = (index: number) => {
    if (coordinates.length <= minPoints) {
      return
    }

    const newCoordinates = coordinates.filter((_, i) => i !== index)
    onChange(newCoordinates)

    // Clear errors for removed point
    const newErrors = { ...errors }
    delete newErrors[index]
    setErrors(newErrors)
  }

  const handlePointChange = (
    index: number,
    field: 'lat' | 'lng',
    value: string
  ) => {
    const newCoordinates = [...coordinates]
    
    // Try to parse DMS format first
    const dmsValue = parseDMS(value)
    let numValue: number
    
    if (dmsValue !== null) {
      // Valid DMS format
      numValue = dmsValue
    } else {
      // Fallback to decimal format for backward compatibility
      numValue = parseFloat(value)
      numValue = isNaN(numValue) ? 0 : numValue
    }

    newCoordinates[index] = {
      ...newCoordinates[index],
      [field]: numValue,
    }

    onChange(newCoordinates)

    // Validate DMS format if it looks like DMS
    const trimmed = value.trim()
    if (trimmed && /[°'""]/.test(trimmed)) {
      const validation = validateDMSCoordinate(trimmed, field === 'lat')
      if (!validation.isValid) {
        setErrors({
          ...errors,
          [index]: [validation.error || 'Invalid DMS format'],
        })
        return
      }
    }

    // Validate the point
    const pointErrors = validateCoordinatePoint(newCoordinates[index], index)
    if (pointErrors.length > 0) {
      setErrors({
        ...errors,
        [index]: pointErrors.map((e) => e.message),
      })
    } else {
      const newErrors = { ...errors }
      delete newErrors[index]
      setErrors(newErrors)
    }
  }

  const canRemove = coordinates.length > minPoints
  const canAdd = coordinates.length < maxPoints

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Project Coordinates</h3>
        {!isReadOnly && (
          <div className="text-sm text-muted-foreground">
            {coordinates.length} point{coordinates.length !== 1 ? 's' : ''} (min:{' '}
            {minPoints}, max: {maxPoints})
          </div>
        )}
      </div>

      <div className="space-y-4">
        {coordinates.map((point, index) => (
          <div
            key={index}
            className="relative border rounded-lg p-4 bg-card hover:bg-accent/5 transition-colors"
          >
            <div className="flex items-start gap-4">
              {/* Point Number Indicator */}
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-medium">
                  {index + 1}
                </div>
              </div>

              {/* Coordinate Inputs */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Latitude */}
                <div>
                  <Label htmlFor={`lat-${index}`} className="text-sm">
                    Latitude
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id={`lat-${index}`}
                      type="text"
                      value={point.lat && point.lat !== 0 ? decimalToDMS(point.lat, true) : ''}
                      onChange={(e) =>
                        handlePointChange(index, 'lat', e.target.value)
                      }
                      disabled={isReadOnly}
                      placeholder="e.g., 18°08'53.19&quot;"
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Format: DD°MM'SS.SS&quot;
                  </p>
                </div>

                {/* Longitude */}
                <div>
                  <Label htmlFor={`lng-${index}`} className="text-sm">
                    Longitude
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id={`lng-${index}`}
                      type="text"
                      value={point.lng && point.lng !== 0 ? decimalToDMS(point.lng, false) : ''}
                      onChange={(e) =>
                        handlePointChange(index, 'lng', e.target.value)
                      }
                      disabled={isReadOnly}
                      placeholder="e.g., 120°39'48.90&quot;"
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Format: DD°MM'SS.SS&quot;
                  </p>
                </div>
              </div>

              {/* Remove Button */}
              {!isReadOnly && canRemove && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemovePoint(index)}
                  className="flex-shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  title="Remove this point"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Error Messages */}
            {errors[index] && errors[index].length > 0 && (
              <div className="mt-3 ml-14 space-y-1">
                {errors[index].map((error, errorIndex) => (
                  <p
                    key={errorIndex}
                    className="text-sm text-destructive flex items-center gap-2"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                    {error}
                  </p>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Point Button */}
      {!isReadOnly && canAdd && (
        <Button
          type="button"
          variant="outline"
          onClick={handleAddPoint}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Coordinate Point
        </Button>
      )}

      {/* Minimum Points Warning */}
      {!isReadOnly && !canRemove && (
        <div className="text-sm text-muted-foreground text-center p-3 bg-muted/50 rounded-lg">
          Minimum {minPoints} points required to form a valid polygon
        </div>
      )}

      {/* Maximum Points Warning */}
      {!isReadOnly && !canAdd && (
        <div className="text-sm text-amber-600 text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
          Maximum {maxPoints} points reached
        </div>
      )}
    </div>
  )
}
