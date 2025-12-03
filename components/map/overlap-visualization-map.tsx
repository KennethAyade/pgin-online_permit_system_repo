'use client'

/**
 * Overlap Visualization Map Component
 * Phase 2.4: Show overlapping coordinates on map with visual indicators
 *
 * NOTE: This is a client component that must be dynamically imported
 * with ssr: false to avoid "window is not defined" errors
 */

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Polygon, Popup, useMap } from 'react-leaflet'
import type { LatLngExpression } from 'leaflet'
import {
  PHILIPPINES_CENTER,
  DEFAULT_ZOOM,
  TILE_LAYER_URL,
  TILE_LAYER_ATTRIBUTION,
  POLYGON_STYLE,
  OVERLAP_STYLE,
  MAP_CONTAINER_STYLE,
} from '@/lib/geo/map-config'
import type { CoordinatePoint } from '@/lib/geo/coordinate-validation'
import { calculatePolygonCentroid } from '@/lib/geo/polygon-helpers'

interface OverlappingProject {
  applicationId: string
  applicationNo: string
  coordinates: CoordinatePoint[]
  overlapPercentage: number
  overlapArea?: number
  overlapGeoJSON?: any
}

interface OverlapVisualizationMapProps {
  userCoordinates: CoordinatePoint[]
  overlappingProjects: OverlappingProject[]
  className?: string
  showIntersections?: boolean
}

/**
 * Component to fit map bounds to show all polygons
 */
function FitBounds({
  userCoordinates,
  overlappingProjects,
}: {
  userCoordinates: CoordinatePoint[]
  overlappingProjects: OverlappingProject[]
}) {
  const map = useMap()

  useEffect(() => {
    const allCoordinates: LatLngExpression[] = [
      ...userCoordinates.map((coord) => [coord.lat, coord.lng] as LatLngExpression),
    ]

    // Add all overlapping project coordinates
    overlappingProjects.forEach((project) => {
      project.coordinates.forEach((coord) => {
        allCoordinates.push([coord.lat, coord.lng] as LatLngExpression)
      })
    })

    if (allCoordinates.length > 0) {
      map.fitBounds(allCoordinates as any, { padding: [50, 50] })
    }
  }, [userCoordinates, overlappingProjects, map])

  return null
}

export function OverlapVisualizationMap({
  userCoordinates,
  overlappingProjects,
  className = '',
  showIntersections = true,
}: OverlapVisualizationMapProps) {
  const [mapCenter, setMapCenter] = useState<LatLngExpression>(PHILIPPINES_CENTER)
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM)

  // Convert user coordinates to Leaflet format
  const userPolygonPoints: LatLngExpression[] = userCoordinates
    .filter((coord) => coord.lat !== 0 || coord.lng !== 0)
    .map((coord) => [coord.lat, coord.lng] as LatLngExpression)

  // Calculate initial center
  useEffect(() => {
    if (userCoordinates.length >= 3) {
      const validCoords = userCoordinates.filter((coord) => coord.lat !== 0 || coord.lng !== 0)
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
  }, [userCoordinates])

  // Color palette for different overlapping projects
  const overlapColors = [
    '#f59e0b', // amber-500
    '#ef4444', // red-500
    '#ec4899', // pink-500
    '#a855f7', // purple-500
    '#6366f1', // indigo-500
  ]

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

        {/* Fit bounds to show all polygons */}
        <FitBounds
          userCoordinates={userCoordinates}
          overlappingProjects={overlappingProjects}
        />

        {/* Draw user's polygon (your project area) */}
        {userPolygonPoints.length >= 3 && (
          <Polygon
            positions={userPolygonPoints}
            pathOptions={{
              ...POLYGON_STYLE,
              fillOpacity: 0.3,
            }}
          >
            <Popup>
              <div className="text-sm">
                <strong>Your Project Area</strong>
                <br />
                {userCoordinates.length} boundary points
              </div>
            </Popup>
          </Polygon>
        )}

        {/* Draw overlapping projects */}
        {overlappingProjects.map((project, index) => {
          const color = overlapColors[index % overlapColors.length]
          const projectPolygonPoints: LatLngExpression[] = project.coordinates
            .filter((coord) => coord.lat !== 0 || coord.lng !== 0)
            .map((coord) => [coord.lat, coord.lng] as LatLngExpression)

          if (projectPolygonPoints.length < 3) return null

          return (
            <Polygon
              key={project.applicationId}
              positions={projectPolygonPoints}
              pathOptions={{
                color: color,
                weight: 2,
                opacity: 0.8,
                fillColor: color,
                fillOpacity: 0.2,
              }}
            >
              <Popup>
                <div className="text-sm space-y-1">
                  <strong className="text-amber-600">Overlapping Project</strong>
                  <br />
                  <span className="font-medium">App No:</span> {project.applicationNo}
                  <br />
                  <span className="font-medium">Overlap:</span> {project.overlapPercentage.toFixed(2)}%
                  {project.overlapArea && (
                    <>
                      <br />
                      <span className="font-medium">Area:</span>{' '}
                      {project.overlapArea.toFixed(2)} m²
                    </>
                  )}
                </div>
              </Popup>
            </Polygon>
          )
        })}

        {/* Draw intersection areas (if available and enabled) */}
        {showIntersections &&
          overlappingProjects.map((project, index) => {
            if (!project.overlapGeoJSON) return null

            const color = overlapColors[index % overlapColors.length]
            const intersectionCoords = project.overlapGeoJSON.geometry.coordinates[0]

            // Convert GeoJSON coordinates [lng, lat] to Leaflet format [lat, lng]
            const intersectionPoints: LatLngExpression[] = intersectionCoords.map(
              (coord: number[]) => [coord[1], coord[0]] as LatLngExpression
            )

            return (
              <Polygon
                key={`intersection-${project.applicationId}`}
                positions={intersectionPoints}
                pathOptions={{
                  color: color,
                  weight: 3,
                  opacity: 1,
                  fillColor: color,
                  fillOpacity: 0.5,
                  dashArray: '10, 5',
                }}
              >
                <Popup>
                  <div className="text-sm space-y-1">
                    <strong className="text-red-600">Overlap Zone</strong>
                    <br />
                    <span className="font-medium">App No:</span> {project.applicationNo}
                    <br />
                    <span className="font-medium">Overlap:</span> {project.overlapPercentage.toFixed(2)}%
                    {project.overlapArea && (
                      <>
                        <br />
                        <span className="font-medium">Area:</span>{' '}
                        {project.overlapArea.toFixed(2)} m²
                      </>
                    )}
                    <br />
                    <span className="text-xs text-muted-foreground italic">
                      Consent may be required
                    </span>
                  </div>
                </Popup>
              </Polygon>
            )
          })}
      </MapContainer>

      {/* Legend */}
      <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 px-4 py-3 rounded-lg shadow-lg text-xs z-[1000] space-y-2">
        <div className="font-semibold text-sm mb-2">Map Legend</div>
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded"
            style={{ backgroundColor: POLYGON_STYLE.fillColor, opacity: 0.3 }}
          />
          <span>Your Project Area</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded"
            style={{ backgroundColor: '#f59e0b', opacity: 0.3 }}
          />
          <span>Overlapping Projects</span>
        </div>
        {showIntersections && (
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded border-2 border-dashed"
              style={{ borderColor: '#f59e0b', backgroundColor: '#f59e0b', opacity: 0.5 }}
            />
            <span>Overlap Zones</span>
          </div>
        )}
      </div>

      {/* Info overlay */}
      <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-lg text-xs z-[1000]">
        <div className="font-medium text-amber-600">
          {overlappingProjects.length === 0
            ? 'No overlaps detected'
            : `${overlappingProjects.length} overlap${overlappingProjects.length > 1 ? 's' : ''} detected`}
        </div>
        {overlappingProjects.length > 0 && (
          <div className="text-muted-foreground mt-1">
            Consent may be required from affected parties
          </div>
        )}
      </div>
    </div>
  )
}
