import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const STOP_STYLES = {
  pickup: { color: '#22c55e', label: 'P' },
  dropoff: { color: '#ef4444', label: 'D' },
  fuel: { color: '#f59e0b', label: 'F' },
  rest: { color: '#8b5cf6', label: 'R' },
  break: { color: '#3b82f6', label: 'B' },
  restart: { color: '#8b5cf6', label: '34' },
  start: { color: '#2563eb', label: 'S' },
  end: { color: '#2563eb', label: 'E' },
}

function createStopIcon(type) {
  const style = STOP_STYLES[type] || STOP_STYLES.break
  const size = type === 'start' || type === 'end' ? 32 : 28
  return L.divIcon({
    className: '',
    html: `<div style="
      background:${style.color};
      color:white;
      width:${size}px;height:${size}px;
      border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-size:${type === 'restart' ? 9 : 11}px;
      font-weight:700;
      font-family:'Plus Jakarta Sans',system-ui;
      border:2.5px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,.25);
    ">${style.label}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

function FitBounds({ coordinates }) {
  const map = useMap()
  useEffect(() => {
    if (coordinates?.length > 0) {
      map.fitBounds(L.latLngBounds(coordinates.map((c) => [c[0], c[1]])), { padding: [40, 40] })
    }
  }, [coordinates, map])
  return null
}

export default function RouteMap({ route, stops, locations }) {
  const coordinates = useMemo(() => {
    if (!route?.coordinates) return []
    return route.coordinates.map((c) => [c[0], c[1]])
  }, [route])

  if (!route) {
    return (
      <div className="card flex items-center justify-center" style={{ height: 420 }}>
        <div className="text-center">
          <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center mx-auto mb-2">
            <svg className="w-5 h-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
            </svg>
          </div>
          <p className="text-[13px] text-stone-400">Route map will appear here</p>
        </div>
      </div>
    )
  }

  const startLoc = locations?.current
  const endLoc = locations?.dropoff

  return (
    <div className="card overflow-hidden relative animate-enter" style={{ height: 420 }}>
      <MapContainer center={[39.8283, -98.5795]} zoom={4} className="w-full h-full" style={{ height: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <Polyline positions={coordinates} color="#2563EB" weight={3.5} opacity={0.8} />
        <FitBounds coordinates={coordinates} />

        {startLoc && (
          <Marker position={[startLoc.lat, startLoc.lng]} icon={createStopIcon('start')}>
            <Popup><div className="text-sm"><p className="font-semibold">Start</p><p className="text-stone-500">{startLoc.label}</p></div></Popup>
          </Marker>
        )}

        {stops?.map((stop, idx) => {
          const lat = stop.coords?.lat ?? stop.latitude
          const lng = stop.coords?.lng ?? stop.longitude
          if (!lat || !lng) return null
          return (
            <Marker key={`${stop.type}-${idx}`} position={[lat, lng]} icon={createStopIcon(stop.type)}>
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold capitalize">{stop.type}</p>
                  <p className="text-stone-500">{stop.location}</p>
                  {stop.time && <p className="text-stone-400 text-xs mt-1">{new Date(stop.time).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}</p>}
                  {stop.duration && <p className="text-stone-400 text-xs">{stop.duration >= 60 ? `${Math.floor(stop.duration / 60)}h ${stop.duration % 60}m` : `${stop.duration}m`}</p>}
                </div>
              </Popup>
            </Marker>
          )
        })}

        {endLoc && (
          <Marker position={[endLoc.lat, endLoc.lng]} icon={createStopIcon('end')}>
            <Popup><div className="text-sm"><p className="font-semibold">End</p><p className="text-stone-500">{endLoc.label}</p></div></Popup>
          </Marker>
        )}
      </MapContainer>

      <div className="absolute bottom-3 left-3 z-[1000] bg-white/90 backdrop-blur-md rounded-lg px-3 py-2 shadow-lg border border-white/50">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {['start', 'pickup', 'fuel', 'break', 'rest', 'restart', 'dropoff', 'end'].map((type) => (
            <div key={type} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ background: STOP_STYLES[type]?.color }} />
              <span className="text-[10px] text-stone-600 font-medium capitalize">{type === 'restart' ? '34h Reset' : type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
