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
  pickup: { color: '#10b981', label: 'P' },
  dropoff: { color: '#ef4444', label: 'D' },
  fuel: { color: '#f59e0b', label: 'F' },
  rest: { color: '#8b5cf6', label: 'R' },
  break: { color: '#3b82f6', label: 'B' },
  restart: { color: '#8b5cf6', label: '34' },
  start: { color: '#059669', label: 'S' },
  end: { color: '#dc2626', label: 'E' },
}

function createStopIcon(type) {
  const style = STOP_STYLES[type] || STOP_STYLES.break
  const size = type === 'start' || type === 'end' ? 34 : 28
  return L.divIcon({
    className: '',
    html: `<div style="
      background: ${style.color};
      color: white;
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: ${type === 'start' || type === 'end' ? '12' : '10'}px;
      font-weight: 800;
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.05);
      letter-spacing: -0.5px;
    ">${style.label}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

function FitBounds({ coordinates }) {
  const map = useMap()
  useEffect(() => {
    if (coordinates && coordinates.length > 0) {
      const bounds = L.latLngBounds(coordinates.map((c) => [c[0], c[1]]))
      map.fitBounds(bounds, { padding: [40, 40] })
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
      <div className="bg-slate-50 border border-slate-200/60 rounded-2xl h-[450px] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-slate-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-slate-400">Route map will appear here</p>
          <p className="text-xs text-slate-300 mt-1">Enter trip details and calculate</p>
        </div>
      </div>
    )
  }

  const startLoc = locations?.current
  const endLoc = locations?.dropoff

  const LEGEND_ITEMS = [
    { type: 'start', label: 'Start' },
    { type: 'pickup', label: 'Pickup' },
    { type: 'fuel', label: 'Fuel' },
    { type: 'break', label: 'Break' },
    { type: 'rest', label: 'Rest' },
    { type: 'restart', label: '34h Restart' },
    { type: 'dropoff', label: 'Dropoff' },
    { type: 'end', label: 'End' },
  ]

  return (
    <div className="rounded-2xl overflow-hidden shadow-sm border border-slate-200/60 relative animate-fade-in-up" style={{ height: 450 }}>
      <MapContainer
        center={[39.8283, -98.5795]}
        zoom={4}
        className="w-full h-full"
        style={{ height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polyline positions={coordinates} color="#4f46e5" weight={4} opacity={0.85} />
        <FitBounds coordinates={coordinates} />

        {startLoc && (
          <Marker position={[startLoc.lat, startLoc.lng]} icon={createStopIcon('start')}>
            <Popup>
              <div className="text-sm font-sans">
                <p className="font-bold">Start (Current Location)</p>
                <p className="text-slate-600">{startLoc.label}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {stops?.map((stop, idx) => {
          const lat = stop.coords?.lat ?? stop.latitude
          const lng = stop.coords?.lng ?? stop.longitude
          if (!lat || !lng) return null
          return (
            <Marker
              key={`${stop.type}-${idx}`}
              position={[lat, lng]}
              icon={createStopIcon(stop.type)}
            >
              <Popup>
                <div className="text-sm font-sans">
                  <p className="font-bold capitalize">{stop.type}</p>
                  <p className="text-slate-600">{stop.location}</p>
                  {stop.time && <p className="text-slate-400 text-xs mt-1">{new Date(stop.time).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}</p>}
                  {stop.duration && <p className="text-slate-400 text-xs">Duration: {stop.duration >= 60 ? `${Math.floor(stop.duration / 60)}h ${stop.duration % 60}m` : `${stop.duration}m`}</p>}
                </div>
              </Popup>
            </Marker>
          )
        })}

        {endLoc && (
          <Marker position={[endLoc.lat, endLoc.lng]} icon={createStopIcon('end')}>
            <Popup>
              <div className="text-sm font-sans">
                <p className="font-bold">End (Dropoff)</p>
                <p className="text-slate-600">{endLoc.label}</p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
      <div className="absolute bottom-3 left-3 z-[1000] glass-card rounded-xl px-3.5 py-2.5 shadow-lg">
        <div className="flex flex-wrap gap-x-3 gap-y-1.5">
          {LEGEND_ITEMS.map(({ type, label }) => (
            <div key={type} className="flex items-center gap-1.5">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full shadow-sm"
                style={{ background: STOP_STYLES[type]?.color }}
              />
              <span className="text-[10px] text-slate-600 font-semibold">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
