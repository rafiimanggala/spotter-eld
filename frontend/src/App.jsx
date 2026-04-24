import Header from './components/Header'
import TripForm from './components/TripForm'
import RouteMap from './components/RouteMap'
import StopsList from './components/StopsList'
import LogSheetList from './components/LogSheetList'
import { useTripCalculation } from './hooks/useTripCalculation'

function App() {
  const { result, loading, error, calculate } = useTripCalculation()

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      <Header />

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-5">
            <TripForm onSubmit={calculate} loading={loading} />

            {error && (
              <div className="flex items-start gap-2.5 text-[13px] text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 animate-enter">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
                {error}
              </div>
            )}

            {result && <StopsList stops={result.stops} />}
          </div>

          {/* Main */}
          <div className="lg:col-span-8 space-y-5">
            {loading && <LoadingSkeleton />}

            {!loading && !result && <EmptyState />}

            {!loading && result && (
              <>
                <RouteMap route={result.route} stops={result.stops} locations={result.locations} />

                {result.summary && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-enter delay-1">
                    <StatCard label="Total Distance" value={result.route.total_distance_miles || '—'} unit="miles" accent />
                    <StatCard label="Total Duration" value={result.summary.total_duration_hours?.toFixed(1) || '—'} unit="hours" />
                    <StatCard label="Drive Time" value={result.route.total_drive_time_hours?.toFixed(1) || '—'} unit="hours" />
                    <StatCard label="Log Sheets" value={result.summary.num_days || 0} unit="days" />
                  </div>
                )}

                <LogSheetList dailyLogs={result.daily_logs || []} />
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function StatCard({ label, value, unit, accent }) {
  return (
    <div className={`card card-hover p-4 ${accent ? 'ring-1 ring-blue-100' : ''}`}>
      <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-stone-900 mt-1 tracking-tight tabular-nums">
        {value}
        <span className="text-[12px] font-normal text-stone-400 ml-1">{unit}</span>
      </p>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-5 animate-fade">
      <div className="skeleton h-[420px] rounded-xl" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-4">
            <div className="skeleton h-3 w-16 mb-2" />
            <div className="skeleton h-7 w-20" />
          </div>
        ))}
      </div>
      <div className="card p-4">
        <div className="skeleton h-4 w-24 mb-3" />
        <div className="skeleton h-[200px]" />
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 animate-enter">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25m-2.25 0h-2.25m0 0V5.625c0-.621-.504-1.125-1.125-1.125H4.875c-.621 0-1.125.504-1.125 1.125v12.5m7.5-14.25h4.875c.621 0 1.125.504 1.125 1.125v3.026" />
        </svg>
      </div>
      <h3 className="text-[15px] font-semibold text-stone-800 mb-1">Plan your trip</h3>
      <p className="text-[13px] text-stone-400">Enter trip details to calculate your HOS-compliant route</p>
    </div>
  )
}

export default App
