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
  start: { color: '#171717', label: 'S' },
  end: { color: '#171717', label: 'E' },
}

function createStopIcon(type) {
  const style = STOP_STYLES[type] || STOP_STYLES.break
  const size = type === 'start' || type === 'end' ? 30 : 26
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
      border:2px solid white;
      box-shadow:0 1px 4px rgba(0,0,0,.2);
    ">${style.label}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

function FitBounds({ coordinates }) {
  const map = useMap()
  useEffect(() => {
    if (coordinates?.length > 0) {
      map.fitBounds(L.latLngBounds(coordinates.map((c) => [c[0], c[1]])), { padding: [30, 30] })
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
      <div className="bg-neutral-50 border border-neutral-200 rounded-lg h-[400px] flex items-center justify-center">
        <p className="text-[13px] text-neutral-400">Route map will appear here</p>
      </div>
    )
  }

  const startLoc = locations?.current
  const endLoc = locations?.dropoff

  return (
    <div className="rounded-lg overflow-hidden border border-neutral-200 relative animate-enter" style={{ height: 400 }}>
      <MapContainer center={[39.8283, -98.5795]} zoom={4} className="w-full h-full" style={{ height: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polyline positions={coordinates} color="#171717" weight={3} opacity={0.7} />
        <FitBounds coordinates={coordinates} />

        {startLoc && (
          <Marker position={[startLoc.lat, startLoc.lng]} icon={createStopIcon('start')}>
            <Popup><div className="text-sm"><p className="font-semibold">Start</p><p className="text-neutral-500">{startLoc.label}</p></div></Popup>
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
                  <p className="text-neutral-500">{stop.location}</p>
                  {stop.time && <p className="text-neutral-400 text-xs mt-1">{new Date(stop.time).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}</p>}
                  {stop.duration && <p className="text-neutral-400 text-xs">{stop.duration >= 60 ? `${Math.floor(stop.duration / 60)}h ${stop.duration % 60}m` : `${stop.duration}m`}</p>}
                </div>
              </Popup>
            </Marker>
          )
        })}

        {endLoc && (
          <Marker position={[endLoc.lat, endLoc.lng]} icon={createStopIcon('end')}>
            <Popup><div className="text-sm"><p className="font-semibold">End</p><p className="text-neutral-500">{endLoc.label}</p></div></Popup>
          </Marker>
        )}
      </MapContainer>

      <div className="absolute bottom-2.5 left-2.5 z-[1000] bg-white/90 backdrop-blur-sm rounded-md px-2.5 py-1.5 shadow-sm border border-neutral-100">
        <div className="flex flex-wrap gap-x-2.5 gap-y-1">
          {['start', 'pickup', 'fuel', 'break', 'rest', 'restart', 'dropoff', 'end'].map((type) => (
            <div key={type} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ background: STOP_STYLES[type]?.color }} />
              <span className="text-[10px] text-neutral-500 capitalize">{type === 'restart' ? '34h' : type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
