import Header from './components/Header'
import TripForm from './components/TripForm'
import RouteMap from './components/RouteMap'
import StopsList from './components/StopsList'
import LogSheetList from './components/LogSheetList'
import { useTripCalculation } from './hooks/useTripCalculation'

function App() {
  const { result, loading, error, calculate } = useTripCalculation()

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Header />

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <TripForm onSubmit={calculate} loading={loading} />

            {error && (
              <div className="text-[13px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3 animate-enter">
                {error}
              </div>
            )}

            {result && <StopsList stops={result.stops} />}
          </div>

          {/* Main */}
          <div className="lg:col-span-8 space-y-6">
            {loading && (
              <div className="flex items-center justify-center py-32">
                <div className="flex items-center gap-3 text-neutral-400">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span className="text-[13px]">Calculating route...</span>
                </div>
              </div>
            )}

            {!loading && !result && (
              <div className="flex items-center justify-center py-32">
                <p className="text-[13px] text-neutral-400">Enter trip details to get started</p>
              </div>
            )}

            {!loading && result && (
              <>
                <RouteMap route={result.route} stops={result.stops} locations={result.locations} />

                {result.summary && (
                  <div className="grid grid-cols-4 gap-px bg-neutral-200 rounded-lg overflow-hidden animate-enter delay-1">
                    <Stat label="Distance" value={`${result.route.total_distance_miles || '—'}`} unit="mi" />
                    <Stat label="Duration" value={`${result.summary.total_duration_hours?.toFixed(1) || '—'}`} unit="hrs" />
                    <Stat label="Driving" value={`${result.route.total_drive_time_hours?.toFixed(1) || '—'}`} unit="hrs" />
                    <Stat label="Log Sheets" value={result.summary.num_days || 0} unit="days" />
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

function Stat({ label, value, unit }) {
  return (
    <div className="bg-white px-4 py-3.5 text-center">
      <p className="text-[11px] text-neutral-400 uppercase tracking-wider font-medium">{label}</p>
      <p className="text-lg font-semibold text-neutral-900 mt-0.5 tracking-tight">
        {value} <span className="text-[12px] font-normal text-neutral-400">{unit}</span>
      </p>
    </div>
  )
}

export default App
