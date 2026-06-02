import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const BOBBY_PASSWORD = import.meta.env.VITE_BOBBY_PASSWORD

export default function BobbyView({ onBack }) {
  const [authenticated, setAuthenticated] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [tracking, setTracking] = useState(false)
  const [status, setStatus] = useState(null)
  const [error, setError] = useState(null)
  const watchIdRef = useRef(null)

  function handlePasswordSubmit(e) {
    e.preventDefault()
    if (passwordInput === BOBBY_PASSWORD) {
      setAuthenticated(true)
      setPasswordError('')
    } else {
      setPasswordError('Wrong password. Try again.')
    }
  }

  function startTracking() {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.')
      return
    }
    setError(null)
    setTracking(true)
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => upsertLocation(pos.coords),
      (err) => setError(err.message),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    )
  }

  function stopTracking() {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    setTracking(false)
    setStatus(null)
  }

  async function upsertLocation({ latitude, longitude, accuracy }) {
    const updated_at = new Date().toISOString()
    const { error: dbError } = await supabase
      .from('bobby_location')
      .upsert({ id: 1, latitude, longitude, accuracy, updated_at })
    if (dbError) {
      setError(dbError.message)
    } else {
      setStatus({ latitude, longitude, accuracy, updated_at })
      setError(null)
    }
  }

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  if (!authenticated) {
    return (
      <div className="view">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <div className="auth-card">
          <h2>Bobby&apos;s Login</h2>
          <form onSubmit={handlePasswordSubmit}>
            <input
              type="password"
              className="password-input"
              placeholder="Enter password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              autoFocus
            />
            {passwordError && <p className="error">{passwordError}</p>}
            <button type="submit" className="btn btn-bobby">Unlock</button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="view">
      <button className="back-btn" onClick={() => { stopTracking(); onBack() }}>← Back</button>
      <div className="bobby-card">
        <h2>Bobby&apos;s Tracker</h2>
        {!tracking ? (
          <button className="btn btn-start" onClick={startTracking}>
            Start Tracking
          </button>
        ) : (
          <button className="btn btn-stop" onClick={stopTracking}>
            Stop Tracking
          </button>
        )}
        {tracking && !error && !status && (
          <p className="status-msg">Acquiring GPS signal…</p>
        )}
        {error && <p className="error">{error}</p>}
        {status && (
          <div className="status-card">
            <p className="status-active">📡 Tracking active</p>
            <p>Lat: {status.latitude.toFixed(6)}</p>
            <p>Lon: {status.longitude.toFixed(6)}</p>
            <p>Accuracy: {status.accuracy ? `±${Math.round(status.accuracy)}m` : 'unknown'}</p>
            <p>Updated: {new Date(status.updated_at).toLocaleTimeString()}</p>
          </div>
        )}
      </div>
    </div>
  )
}
