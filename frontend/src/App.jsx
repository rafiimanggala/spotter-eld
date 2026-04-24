import Header from './components/Header'
import TripForm from './components/TripForm'
import RouteMap from './components/RouteMap'
import StopsList from './components/StopsList'
import LogSheetList from './components/LogSheetList'
import { useTripCalculation } from './hooks/useTripCalculation'

const SUMMARY_ICONS = {
  distance: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
    </svg>
  ),
  duration: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  ),
  driving: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25m-2.25 0h-2.25m0 0V5.625c0-.621-.504-1.125-1.125-1.125H4.875c-.621 0-1.125.504-1.125 1.125v12.5m7.5-14.25h4.875c.621 0 1.125.504 1.125 1.125v3.026" />
    </svg>
  ),
  logs: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  ),
}

function App() {
  const { result, loading, error, calculate } = useTripCalculation()

  const handleSubmit = (formData) => {
    calculate(formData)
  }

  return (
    <div className="min-h-screen bg-surface">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-4">
            <TripForm onSubmit={handleSubmit} loading={loading} />

            {error && (
              <div className="bg-red-50 border border-red-200/60 rounded-2xl p-4 animate-fade-in-up">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-red-800">Calculation Error</p>
                    <p className="text-[12px] text-red-600 mt-0.5">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {result && <StopsList stops={result.stops} />}
          </div>

          <div className="lg:col-span-8 space-y-6">
            {loading && (
              <div className="flex items-center justify-center py-24 animate-fade-in">
                <div className="text-center">
                  <div className="relative w-14 h-14 mx-auto mb-4">
                    <div className="absolute inset-0 rounded-full border-2 border-brand-100" />
                    <div className="absolute inset-0 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
                  </div>
                  <p className="text-sm font-semibold text-slate-500">Calculating route</p>
                  <p className="text-xs text-slate-400 mt-1">Generating ELD logs & HOS compliance...</p>
                </div>
              </div>
            )}

            {!loading && !result && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-16 text-center animate-fade-in">
                <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100/50 flex items-center justify-center">
                  <svg className="w-10 h-10 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-700 mb-2">
                  Plan Your Trip
                </h3>
                <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Enter your locations and cycle hours to see the optimized route, required stops, and FMCSA-compliant daily log sheets
                </p>
              </div>
            )}

            {!loading && result && (
              <>
                <RouteMap route={result.route} stops={result.stops} locations={result.locations} />

                {result.summary && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-in-up stagger-3">
                    <SummaryCard
                      icon={SUMMARY_ICONS.distance}
                      label="Total Distance"
                      value={`${result.route.total_distance_miles || '—'}`}
                      unit="mi"
                      gradient="from-brand-500 to-brand-600"
                    />
                    <SummaryCard
                      icon={SUMMARY_ICONS.duration}
                      label="Total Duration"
                      value={`${result.summary.total_duration_hours?.toFixed(1) || '—'}`}
                      unit="hrs"
                      gradient="from-violet-500 to-violet-600"
                    />
                    <SummaryCard
                      icon={SUMMARY_ICONS.driving}
                      label="Driving Time"
                      value={`${result.route.total_drive_time_hours?.toFixed(1) || '—'}`}
                      unit="hrs"
                      gradient="from-emerald-500 to-emerald-600"
                    />
                    <SummaryCard
                      icon={SUMMARY_ICONS.logs}
                      label="Log Sheets"
                      value={result.summary.num_days || 0}
                      unit="days"
                      gradient="from-amber-500 to-amber-600"
                    />
                  </div>
                )}

                <LogSheetList dailyLogs={result.daily_logs || []} />
              </>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200/60 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-slate-400 font-medium">
            Spotter ELD Trip Planner — FMCSA HOS Compliant
          </p>
          <div className="flex items-center gap-4">
            <span className="text-[11px] text-slate-300">70-hour / 8-day cycle</span>
            <span className="text-[11px] text-slate-300">DOT Form 395.1</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

function SummaryCard({ icon, label, value, unit, gradient }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-4 group hover:shadow-md transition-shadow">
      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white mb-3 shadow-lg shadow-slate-300/30`}>
        {icon}
      </div>
      <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">{label}</p>
      <div className="flex items-baseline gap-1 mt-1">
        <p className="text-xl font-extrabold text-slate-800 tracking-tight">{value}</p>
        {unit && <span className="text-[11px] text-slate-400 font-semibold">{unit}</span>}
      </div>
    </div>
  )
}

export default App
