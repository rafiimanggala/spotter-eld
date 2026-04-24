const TYPE_CONFIG = {
  pickup: { badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10', icon: '↑' },
  dropoff: { badge: 'bg-red-50 text-red-700 ring-red-600/10', icon: '↓' },
  fuel: { badge: 'bg-amber-50 text-amber-700 ring-amber-600/10', icon: '⛽' },
  rest: { badge: 'bg-violet-50 text-violet-700 ring-violet-600/10', icon: '🛏' },
  break: { badge: 'bg-sky-50 text-sky-700 ring-sky-600/10', icon: '☕' },
  restart: { badge: 'bg-violet-50 text-violet-700 ring-violet-600/10', icon: '🔄' },
}

export default function StopsList({ stops }) {
  if (!stops || stops.length === 0) return null

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden animate-fade-in-up stagger-2">
      <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-slate-800 tracking-tight">Trip Stops</h2>
          <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
            {stops.length} stop{stops.length > 1 ? 's' : ''}
          </span>
        </div>
      </div>
      <div className="divide-y divide-slate-50">
        {stops.map((stop, idx) => {
          const cfg = TYPE_CONFIG[stop.type] || { badge: 'bg-slate-50 text-slate-700 ring-slate-600/10', icon: '•' }
          return (
            <div key={idx} className="px-6 py-3.5 flex items-center gap-4 hover:bg-slate-25 transition-colors group">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="text-xs text-slate-300 font-mono w-5 text-right shrink-0">{idx + 1}</span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize ring-1 ring-inset ${cfg.badge}`}>
                  <span className="text-[10px]">{cfg.icon}</span>
                  {stop.type}
                </span>
                <span className="text-sm text-slate-700 truncate font-medium">{stop.location}</span>
              </div>
              <div className="flex items-center gap-4 shrink-0 text-[12px] text-slate-400">
                {stop.time && (
                  <span>{new Date(stop.time).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                )}
                {stop.duration && (
                  <span className="font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md">
                    {stop.duration >= 60 ? `${Math.floor(stop.duration / 60)}h ${stop.duration % 60}m` : `${stop.duration}m`}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
