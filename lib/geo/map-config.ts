/**
 * Map Configuration
 * Phase 2.2: Leaflet map settings and defaults
 */

import type { LatLngExpression } from 'leaflet'

// Philippines center point
export const PHILIPPINES_CENTER: LatLngExpression = [12.8797, 121.774]

// Default zoom levels
export const DEFAULT_ZOOM = 6
export const DETAIL_ZOOM = 13
export const MAX_ZOOM = 19
export const MIN_ZOOM = 5

// OpenStreetMap tile layer
export const TILE_LAYER_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
export const TILE_LAYER_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

// Polygon style options
export const POLYGON_STYLE = {
  color: '#3b82f6', // blue-500
  weight: 2,
  opacity: 0.8,
  fillColor: '#3b82f6',
  fillOpacity: 0.2,
}

export const POLYGON_HOVER_STYLE = {
  color: '#2563eb', // blue-600
  weight: 3,
  opacity: 1,
  fillOpacity: 0.3,
}

export const POLYGON_ERROR_STYLE = {
  color: '#ef4444', // red-500
  weight: 2,
  opacity: 0.8,
  fillColor: '#ef4444',
  fillOpacity: 0.2,
}

export const OVERLAP_STYLE = {
  color: '#f59e0b', // amber-500
  weight: 2,
  opacity: 0.8,
  fillColor: '#f59e0b',
  fillOpacity: 0.3,
}

// Marker style options
export const MARKER_ICON_CONFIG = {
  iconSize: [25, 41] as [number, number],
  iconAnchor: [12, 41] as [number, number],
  popupAnchor: [1, -34] as [number, number],
  shadowSize: [41, 41] as [number, number],
}

// Map container style
export const MAP_CONTAINER_STYLE = {
  width: '100%',
  height: '500px',
  borderRadius: '0.5rem',
}
