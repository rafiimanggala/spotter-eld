const COLORS = {
  pickup: { bg: 'bg-emerald-500', ring: 'ring-emerald-100' },
  dropoff: { bg: 'bg-red-500', ring: 'ring-red-100' },
  fuel: { bg: 'bg-amber-500', ring: 'ring-amber-100' },
  rest: { bg: 'bg-violet-500', ring: 'ring-violet-100' },
  break: { bg: 'bg-blue-500', ring: 'ring-blue-100' },
  restart: { bg: 'bg-violet-500', ring: 'ring-violet-100' },
}

export default function StopsList({ stops }) {
  if (!stops || stops.length === 0) return null

  return (
    <div className="card p-4 animate-enter delay-2">
      <h3 className="text-[12px] font-medium text-stone-400 uppercase tracking-wider mb-3">
        Stops <span className="text-stone-300">({stops.length})</span>
      </h3>
      <div className="relative">
        <div className="absolute left-[11px] top-3 bottom-3 w-px bg-stone-100" />

        <div className="space-y-0.5">
          {stops.map((stop, idx) => {
            const c = COLORS[stop.type] || { bg: 'bg-stone-400', ring: 'ring-stone-100' }
            return (
              <div
                key={`${stop.type}-${stop.time || idx}`}
                className="relative flex items-start gap-3 px-2 py-2 rounded-lg hover:bg-stone-50/80 transition-colors duration-150"
              >
                <div className={`relative z-10 w-[22px] h-[22px] rounded-full ${c.bg} ring-4 ${c.ring} flex items-center justify-center shrink-0 mt-0.5`}>
                  <span className="text-[9px] font-bold text-white uppercase">
                    {stop.type === 'restart' ? '34' : stop.type?.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-stone-800 capitalize">{stop.type}</span>
                  </div>
                  <p className="text-[12px] text-stone-400 truncate">{stop.location}</p>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-stone-400">
                    {stop.time && (
                      <span>{new Date(stop.time).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                    )}
                    {stop.time && stop.duration && <span className="text-stone-200">&middot;</span>}
                    {stop.duration && (
                      <span>{stop.duration >= 60 ? `${Math.floor(stop.duration / 60)}h ${stop.duration % 60}m` : `${stop.duration}m`}</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
