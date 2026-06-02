import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { supabase } from '../lib/supabase'
import GpxParser from 'gpxparser'

const DEFAULT_CENTER = [38.962, -119.940]
const DEFAULT_ZOOM = 12

// Fix default Leaflet marker icon paths broken by Vite's asset hashing
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const bobbyIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

// Helper: pan map to position when it changes
function MapPanner({ position }) {
  const map = useMap()
  useEffect(() => {
    if (position) map.panTo(position)
  }, [position, map])
  return null
}

async function loadGpxRoute() {
  try {
    const res = await fetch('/route.gpx')
    if (!res.ok) return null
    const text = await res.text()
    const gpx = new GpxParser()
    gpx.parse(text)
    if (!gpx.tracks.length) return null
    return gpx.tracks[0].points.map((p) => [p.lat, p.lon])
  } catch {
    return null
  }
}

export default function FanView({ onBack }) {
  const [bobbyPos, setBobbyPos] = useState(null)
  const [routePoints, setRoutePoints] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const channelRef = useRef(null)

  // Load GPX route on mount
  useEffect(() => {
    loadGpxRoute().then(setRoutePoints)
  }, [])

  // Fetch Bobby's last known position on mount
  useEffect(() => {
    supabase
      .from('bobby_location')
      .select('latitude,longitude,updated_at')
      .eq('id', 1)
      .single()
      .then(({ data }) => {
        if (data && data.latitude !== 0) {
          setBobbyPos([data.latitude, data.longitude])
          setLastUpdated(data.updated_at)
        }
      })
  }, [])

  // Real-time subscription for live updates
  useEffect(() => {
    channelRef.current = supabase
      .channel('bobby_location_changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'bobby_location' },
        (payload) => {
          const { latitude, longitude, updated_at } = payload.new
          setBobbyPos([latitude, longitude])
          setLastUpdated(updated_at)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channelRef.current)
    }
  }, [])

  return (
    <div className="fan-view">
      <div className="fan-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <div className="fan-status">
          {bobbyPos ? (
            <span className="live-badge">● Live</span>
          ) : (
            <span className="waiting-badge">Waiting for Bobby…</span>
          )}
          {lastUpdated && (
            <span className="last-updated">
              Last update: {new Date(lastUpdated).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      <MapContainer
        center={bobbyPos || DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        className="map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {routePoints && routePoints.length > 1 && (
          <Polyline positions={routePoints} color="#e65c00" weight={4} opacity={0.8} />
        )}

        {bobbyPos && (
          <Marker position={bobbyPos} icon={bobbyIcon}>
            <Popup>
              <strong>Bobby is here!</strong>
              <br />
              {lastUpdated && new Date(lastUpdated).toLocaleTimeString()}
            </Popup>
          </Marker>
        )}

        {bobbyPos && <MapPanner position={bobbyPos} />}
      </MapContainer>

      {!routePoints && (
        <p className="route-notice">
          No route loaded — drop a <code>route.gpx</code> in the <code>public/</code> folder to show the race route.
        </p>
      )}
    </div>
  )
}
