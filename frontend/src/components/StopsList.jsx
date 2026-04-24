const COLORS = {
  pickup: 'bg-green-500',
  dropoff: 'bg-red-500',
  fuel: 'bg-amber-500',
  rest: 'bg-violet-500',
  break: 'bg-blue-500',
  restart: 'bg-violet-500',
}

export default function StopsList({ stops }) {
  if (!stops || stops.length === 0) return null

  return (
    <div className="animate-enter delay-2">
      <h3 className="text-[13px] font-medium text-neutral-500 mb-3">Stops</h3>
      <div className="space-y-1">
        {stops.map((stop, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-neutral-50 transition-colors group"
          >
            <span className={`w-2 h-2 rounded-full shrink-0 ${COLORS[stop.type] || 'bg-neutral-400'}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-medium text-neutral-800 capitalize">{stop.type}</span>
                <span className="text-[12px] text-neutral-400 truncate">{stop.location}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-[12px] text-neutral-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              {stop.time && (
                <span>{new Date(stop.time).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}</span>
              )}
              {stop.duration && (
                <span>{stop.duration >= 60 ? `${Math.floor(stop.duration / 60)}h ${stop.duration % 60}m` : `${stop.duration}m`}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
