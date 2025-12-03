'use client'

/**
 * Coordinate Map Component
 * Phase 2.2: Interactive map visualization using Leaflet
 *
 * NOTE: This is a client component that must be dynamically imported
 * with ssr: false to avoid "window is not defined" errors
 */

import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Polygon, Marker, Popup, useMap } from 'react-leaflet'
import type { LatLngExpression } from 'leaflet'
import L from 'leaflet'
import {
  PHILIPPINES_CENTER,
  DEFAULT_ZOOM,
  TILE_LAYER_URL,
  TILE_LAYER_ATTRIBUTION,
  POLYGON_STYLE,
  POLYGON_ERROR_STYLE,
  MAP_CONTAINER_STYLE,
} from '@/lib/geo/map-config'
import type { CoordinatePoint } from '@/lib/geo/coordinate-validation'
import { calculatePolygonCentroid } from '@/lib/geo/polygon-helpers'

// Fix Leaflet default marker icon issue with Next.js
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  })
}

interface CoordinateMapProps {
  coordinates: CoordinatePoint[]
  onCoordinatesChange?: (coordinates: CoordinatePoint[]) => void
  isReadOnly?: boolean
  showMarkers?: boolean
  hasErrors?: boolean
  className?: string
}

/**
 * Component to fit map bounds to polygon
 */
function FitBounds({ coordinates }: { coordinates: CoordinatePoint[] }) {
  const map = useMap()

  useEffect(() => {
    if (coordinates.length > 0) {
      const bounds = coordinates.map((coord) => [coord.lat, coord.lng] as LatLngExpression)
      map.fitBounds(bounds as any, { padding: [50, 50] })
    }
  }, [coordinates, map])

  return null
}

export function CoordinateMap({
  coordinates,
  onCoordinatesChange,
  isReadOnly = false,
  showMarkers = true,
  hasErrors = false,
  className = '',
}: CoordinateMapProps) {
  const [mapCenter, setMapCenter] = useState<LatLngExpression>(PHILIPPINES_CENTER)
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM)

  // Convert coordinates to Leaflet format
  const polygonPoints: LatLngExpression[] = coordinates
    .filter((coord) => coord.lat !== 0 || coord.lng !== 0) // Filter out empty points
    .map((coord) => [coord.lat, coord.lng] as LatLngExpression)

  // Calculate centroid for initial center if we have valid points
  useEffect(() => {
    if (coordinates.length >= 3) {
      const validCoords = coordinates.filter((coord) => coord.lat !== 0 || coord.lng !== 0)
      if (validCoords.length >= 3) {
        try {
          const centroid = calculatePolygonCentroid(validCoords)
          setMapCenter([centroid.lat, centroid.lng])
          setMapZoom(13)
        } catch (e) {
          // Keep default center
        }
      }
    }
  }, [coordinates])

  const polygonStyle = hasErrors ? POLYGON_ERROR_STYLE : POLYGON_STYLE

  return (
    <div className={`relative ${className}`} style={MAP_CONTAINER_STYLE}>
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        className="w-full h-full rounded-lg"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution={TILE_LAYER_ATTRIBUTION}
          url={TILE_LAYER_URL}
        />

        {/* Fit bounds to polygon if we have valid coordinates */}
        {polygonPoints.length >= 3 && <FitBounds coordinates={coordinates} />}

        {/* Draw polygon if we have at least 3 points */}
        {polygonPoints.length >= 3 && (
          <Polygon
            positions={polygonPoints}
            pathOptions={polygonStyle}
          >
            <Popup>
              <div className="text-sm">
                <strong>Project Area</strong>
                <br />
                {coordinates.length} boundary points
              </div>
            </Popup>
          </Polygon>
        )}

        {/* Show markers for each coordinate point */}
        {showMarkers &&
          coordinates.map((coord, index) => {
            // Skip empty points
            if (coord.lat === 0 && coord.lng === 0) return null

            return (
              <Marker
                key={index}
                position={[coord.lat, coord.lng]}
                draggable={!isReadOnly}
                eventHandlers={{
                  dragend: (e) => {
                    if (onCoordinatesChange && !isReadOnly) {
                      const marker = e.target
                      const position = marker.getLatLng()
                      const newCoordinates = [...coordinates]
                      newCoordinates[index] = {
                        lat: position.lat,
                        lng: position.lng,
                      }
                      onCoordinatesChange(newCoordinates)
                    }
                  },
                }}
              >
                <Popup>
                  <div className="text-sm">
                    <strong>Point {index + 1}</strong>
                    <br />
                    Lat: {coord.lat.toFixed(6)}
                    <br />
                    Lng: {coord.lng.toFixed(6)}
                    {!isReadOnly && (
                      <>
                        <br />
                        <span className="text-xs text-muted-foreground">
                          Drag to adjust position
                        </span>
                      </>
                    )}
                  </div>
                </Popup>
              </Marker>
            )
          })}
      </MapContainer>

      {/* Info overlay */}
      <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-lg text-xs z-[1000]">
        <div className="font-medium">
          {polygonPoints.length < 3
            ? `Add ${3 - polygonPoints.length} more point(s) to form polygon`
            : `${coordinates.length} boundary points`}
        </div>
        {!isReadOnly && (
          <div className="text-muted-foreground mt-1">
            Drag markers to adjust coordinates
          </div>
        )}
      </div>
    </div>
  )
}
