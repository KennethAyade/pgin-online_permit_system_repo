/**
 * Map Loading Skeleton
 * Shown while the map component is loading (dynamic import)
 */

import { Loader2 } from 'lucide-react'
import { MAP_CONTAINER_STYLE } from '@/lib/geo/map-config'

export function MapSkeleton() {
  return (
    <div
      className="relative bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center"
      style={MAP_CONTAINER_STYLE}
    >
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="mt-2 text-sm text-muted-foreground">Loading map...</p>
      </div>
    </div>
  )
}
