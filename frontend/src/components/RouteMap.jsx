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
  pickup: { color: '#16a34a', label: 'P', bg: 'bg-green-600' },
  dropoff: { color: '#dc2626', label: 'D', bg: 'bg-red-600' },
  fuel: { color: '#d97706', label: 'F', bg: 'bg-amber-600' },
  rest: { color: '#7c3aed', label: 'R', bg: 'bg-purple-600' },
  break: { color: '#2563eb', label: 'B', bg: 'bg-blue-600' },
  restart: { color: '#7c3aed', label: '34', bg: 'bg-purple-600' },
  start: { color: '#059669', label: 'S', bg: 'bg-emerald-600' },
  end: { color: '#dc2626', label: 'E', bg: 'bg-red-700' },
}

function createStopIcon(type) {
  const style = STOP_STYLES[type] || STOP_STYLES.break
  const size = type === 'start' || type === 'end' ? 32 : 28
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
      font-size: ${type === 'start' || type === 'end' ? '13' : '11'}px;
      font-weight: 700;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.35);
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
      map.fitBounds(bounds, { padding: [30, 30] })
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
      <div className="bg-gray-100 rounded-xl h-[450px] flex items-center justify-center text-gray-400">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <p>Map will appear here</p>
        </div>
      </div>
    )
  }

  const startLoc = locations?.current
  const endLoc = locations?.dropoff

  return (
    <div className="rounded-xl overflow-hidden shadow-md" style={{ height: 450 }}>
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
        <Polyline positions={coordinates} color="#2563eb" weight={4} opacity={0.8} />
        <FitBounds coordinates={coordinates} />

        {startLoc && (
          <Marker position={[startLoc.lat, startLoc.lng]} icon={createStopIcon('start')}>
            <Popup>
              <div className="text-sm">
                <p className="font-bold">Start (Current Location)</p>
                <p>{startLoc.label}</p>
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
                <div className="text-sm">
                  <p className="font-bold capitalize">{stop.type}</p>
                  <p>{stop.location}</p>
                  {stop.time && <p className="text-gray-600">{new Date(stop.time).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}</p>}
                  {stop.duration && <p className="text-gray-600">Duration: {stop.duration >= 60 ? `${Math.floor(stop.duration/60)}h ${stop.duration%60}m` : `${stop.duration}m`}</p>}
                </div>
              </Popup>
            </Marker>
          )
        })}

        {endLoc && (
          <Marker position={[endLoc.lat, endLoc.lng]} icon={createStopIcon('end')}>
            <Popup>
              <div className="text-sm">
                <p className="font-bold">End (Dropoff)</p>
                <p>{endLoc.label}</p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  )
}
