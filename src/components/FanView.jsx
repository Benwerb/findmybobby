import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { supabase } from '../lib/supabase'
import SpeedGauge from './SpeedGauge'

const DEFAULT_CENTER = [38.962, -119.940]
const DEFAULT_ZOOM = 12

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

function makeLabelIcon(emoji, label) {
  return L.divIcon({
    className: '',
    html: `<div style="display:flex;flex-direction:column;align-items:center;gap:2px">
      <div style="background:white;border:2px solid #333;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 2px 6px rgba(0,0,0,0.3)">${emoji}</div>
      <div style="background:white;border:1px solid #ccc;border-radius:4px;padding:1px 5px;font-size:11px;font-weight:700;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,0.2)">${label}</div>
    </div>`,
    iconSize: [60, 52],
    iconAnchor: [30, 52],
    popupAnchor: [0, -54],
  })
}

const startIcon  = makeLabelIcon('🟢', 'Start')
const finishIcon = makeLabelIcon('🏁', 'Finish')

function MapPanner({ position }) {
  const map = useMap()
  useEffect(() => {
    if (position) map.panTo(position)
  }, [position, map])
  return null
}

async function loadGpxRoute() {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}route.gpx`)
    if (!res.ok) return null
    const text = await res.text()
    const doc = new DOMParser().parseFromString(text, 'text/xml')
    const points = Array.from(doc.getElementsByTagName('trkpt'))
      .map((pt) => [parseFloat(pt.getAttribute('lat')), parseFloat(pt.getAttribute('lon'))])
      .filter(([lat, lon]) => !isNaN(lat) && !isNaN(lon))
    return points.length > 1 ? points : null
  } catch {
    return null
  }
}

export default function FanView({ onBack }) {
  const [bobbyPos, setBobbyPos]   = useState(null)
  const [speedMs, setSpeedMs]     = useState(null)
  const [routePoints, setRoutePoints] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const channelRef = useRef(null)

  useEffect(() => { loadGpxRoute().then(setRoutePoints) }, [])

  useEffect(() => {
    supabase
      .from('bobby_location')
      .select('latitude,longitude,speed,updated_at')
      .eq('id', 1)
      .single()
      .then(({ data }) => {
        if (data && data.latitude !== 0) {
          setBobbyPos([data.latitude, data.longitude])
          setSpeedMs(data.speed)
          setLastUpdated(data.updated_at)
        }
      })
  }, [])

  useEffect(() => {
    channelRef.current = supabase
      .channel('bobby_location_changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'bobby_location' },
        ({ new: row }) => {
          setBobbyPos([row.latitude, row.longitude])
          setSpeedMs(row.speed)
          setLastUpdated(row.updated_at)
        }
      )
      .subscribe()
    return () => supabase.removeChannel(channelRef.current)
  }, [])

  const startPoint  = routePoints?.[0]
  const finishPoint = routePoints?.[routePoints?.length - 1]
  const speedMph    = speedMs != null ? speedMs * 2.23694 : null

  return (
    <div className="fan-view">
      <div className="fan-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <div className="fan-status">
          {bobbyPos
            ? <span className="live-badge">● Live</span>
            : <span className="waiting-badge">Waiting for Bobby…</span>}
          {lastUpdated && (
            <span className="last-updated">
              Updated: {new Date(lastUpdated).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      <div className="map-wrapper">
        <MapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} className="map">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {routePoints && routePoints.length > 1 && (
            <Polyline positions={routePoints} color="#e65c00" weight={4} opacity={0.8} />
          )}

          {startPoint  && <Marker position={startPoint}  icon={startIcon}><Popup>Race start</Popup></Marker>}
          {finishPoint && <Marker position={finishPoint} icon={finishIcon}><Popup>Race finish</Popup></Marker>}

          {bobbyPos && (
            <Marker position={bobbyPos} icon={bobbyIcon}>
              <Popup>
                <strong>Bobby is here!</strong>
                {speedMph != null && <><br />{speedMph.toFixed(1)} mph</>}
                <br />{lastUpdated && new Date(lastUpdated).toLocaleTimeString()}
              </Popup>
            </Marker>
          )}

          {bobbyPos && <MapPanner position={bobbyPos} />}
        </MapContainer>

        {bobbyPos && (
          <div className="gauge-overlay">
            <SpeedGauge speedMph={speedMph} />
          </div>
        )}
      </div>

      {!routePoints && (
        <p className="route-notice">
          No route loaded — drop a <code>route.gpx</code> in the <code>public/</code> folder.
        </p>
      )}
    </div>
  )
}
