import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { ArrowUpRight, Crosshair, MapPin } from 'lucide-react'

const DEFAULT_ZOOM = 14

const getCategoryAccent = (category = '') => {
  const normalized = category.toLowerCase()
  if (normalized.includes('issue') || normalized.includes('emergency')) return 'coral'
  if (normalized.includes('lost') || normalized.includes('found')) return 'blue'
  if (normalized.includes('internship') || normalized.includes('scholarship')) return 'violet'
  return 'amber'
}

const createPinIcon = (accent = 'amber') => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `<div class="leaflet-pin leaflet-pin--${accent}">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      </svg>
    </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  })
}

const createUserLocationIcon = () => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `<div class="leaflet-pin leaflet-pin--user">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="5"/>
        <path d="M12 2v3m0 14v3m10-10h-3M5 12H2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  })
}

function MapController({ bounds, userCoords }) {
  const map = useMap()

  useEffect(() => {
    // Invalidate size on mount to ensure full container rendering
    const timer1 = setTimeout(() => map.invalidateSize(), 150)
    const timer2 = setTimeout(() => map.invalidateSize(), 400)
    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [map])

  useEffect(() => {
    if (userCoords) {
      map.flyTo(userCoords, 15, { animate: true })
    } else if (bounds && bounds.length > 0) {
      if (bounds.length === 1) {
        map.setView(bounds[0], 15, { animate: true })
      } else {
        map.fitBounds(bounds, { padding: [35, 35], maxZoom: 16, animate: true })
      }
    }
  }, [bounds, userCoords, map])

  return null
}

export default function MapPreview({ posts = [], onSelect = () => {}, detail = false }) {
  const [userLocation, setUserLocation] = useState(null)
  const [locating, setLocating] = useState(false)
  const [locationStatus, setLocationStatus] = useState(null)

  // Filter for valid posts with real numerical coordinates only
  const validPosts = (posts || []).filter((post) => {
    if (post == null || post.latitude == null || post.longitude == null) return false
    const lat = Number(post.latitude)
    const lng = Number(post.longitude)
    return (
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    )
  })

  const bounds = validPosts.map((p) => [Number(p.latitude), Number(p.longitude)])
  const initialCenter = userLocation || bounds[0] || null

  const handleCenterOnUser = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your browser.')
      return
    }
    setLocating(true)
    setLocationStatus(null)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false)
        setUserLocation([pos.coords.latitude, pos.coords.longitude])
      },
      (err) => {
        setLocating(false)
        let message = 'Unable to get location.'
        if (err.code === 1) message = 'Location permission denied.'
        else if (err.code === 2) message = 'Location unavailable.'
        else if (err.code === 3) message = 'Location request timed out.'
        setLocationStatus(message)
        setTimeout(() => setLocationStatus(null), 4000)
      },
      { timeout: 8000, enableHighAccuracy: true }
    )
  }

  return (
    <aside className={`map-panel ${detail ? 'map-panel--detail' : ''}`}>
      <div className="map-panel__head">
        <div>
          <div className="eyebrow eyebrow--dark">
            <MapPin size={13} /> Location context
          </div>
          <h3>Signals on the ground</h3>
        </div>
        <button
          className="map-control"
          type="button"
          aria-label="Center on my location"
          title="Center on my location"
          onClick={handleCenterOnUser}
          disabled={locating}
        >
          <Crosshair size={17} className={locating ? 'spin' : ''} />
        </button>
      </div>

      <div
        className="map-surface"
        role="region"
        aria-label="Interactive Leaflet map with community signals"
      >
        {initialCenter ? (
          <MapContainer
            center={initialCenter}
            zoom={DEFAULT_ZOOM}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
          >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapController bounds={bounds} userCoords={userLocation} />

          {validPosts.map((post) => {
            const lat = Number(post.latitude)
            const lng = Number(post.longitude)
            const accent = post.accent || getCategoryAccent(post.category)
            const isAnonymous = Boolean(post.is_anonymous || post.anonymous)
            const authorText = isAnonymous ? 'Posted anonymously' : (post.author || 'Community member')
            const urgencyLevel = (post.urgency || 'Medium').toLowerCase()

            return (
              <Marker
                key={post.id}
                position={[lat, lng]}
                icon={createPinIcon(accent)}
              >
                <Popup className="techtonix-popup">
                  <div className="map-popup-content">
                    <span className={`category-label category-label--${accent}`}>
                      {post.category || 'Local Signal'}
                    </span>
                    <h4 style={{ margin: '6px 0 4px', fontSize: '13px', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.3 }}>
                      {post.title}
                    </h4>
                    {post.location && (
                      <p style={{ margin: '0 0 6px', fontSize: '11px', color: 'var(--ink-soft)', lineHeight: 1.4 }}>
                        {post.location}
                      </p>
                    )}
                    <div style={{ fontSize: '10px', color: 'var(--muted)', marginBottom: '8px' }}>
                      Urgency: <strong className={`urgency urgency--${urgencyLevel}`}><span />{post.urgency || 'Medium'}</strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', borderTop: '1px solid var(--line)', paddingTop: '6px' }}>
                      <span style={{ fontSize: '10px', color: 'var(--muted)', fontStyle: 'italic' }}>
                        {authorText}
                      </span>
                      <button
                        type="button"
                        className="map-popup-btn"
                        onClick={() => onSelect(post)}
                      >
                        View <ArrowUpRight size={12} />
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            )
          })}

          {userLocation && (
            <Marker position={userLocation} icon={createUserLocationIcon()}>
              <Popup className="techtonix-popup">
                <div style={{ fontSize: '12px', fontWeight: 700, padding: '4px' }}>📍 Your Current Location</div>
              </Popup>
            </Marker>
          )}
          </MapContainer>
        ) : (
          <div
            className="map-empty"
            role="status"
            style={{ display: 'grid', height: '100%', placeItems: 'center', padding: '24px', color: 'var(--ink-soft)', fontSize: '13px', lineHeight: 1.5, textAlign: 'center' }}
          >
            No posts have mappable locations yet. Use your current location to view the map.
          </div>
        )}

        {validPosts.length === 0 && userLocation && (
          <div
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(255, 255, 255, 0.94)',
              backdropFilter: 'blur(4px)',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--ink-soft)',
              boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
              border: '1px solid var(--line)',
              zIndex: 1000,
              pointerEvents: 'none',
            }}
          >
            No location-based posts yet
          </div>
        )}

        {locationStatus && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(20, 38, 47, 0.9)',
              color: '#ffffff',
              padding: '5px 12px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 600,
              zIndex: 1000,
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            }}
          >
            {locationStatus}
          </div>
        )}
      </div>

      <div className="map-panel__footer">
        <span><span className="legend-dot legend-dot--coral" /> Issues</span>
        <span><span className="legend-dot legend-dot--blue" /> Lost &amp; Found</span>
        <span><span className="legend-dot legend-dot--violet" /> Opportunities</span>
        <span><span className="legend-dot legend-dot--amber" /> Events</span>
      </div>
    </aside>
  )
}
