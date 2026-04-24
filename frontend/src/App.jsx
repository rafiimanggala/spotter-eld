import Header from './components/Header'
import TripForm from './components/TripForm'
import RouteMap from './components/RouteMap'
import StopsList from './components/StopsList'
import LogSheetList from './components/LogSheetList'
import { useTripCalculation } from './hooks/useTripCalculation'

function App() {
  const { result, loading, error, calculate } = useTripCalculation()

  const handleSubmit = (formData) => {
    calculate(formData)
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-1 space-y-4">
            <TripForm onSubmit={handleSubmit} loading={loading} />

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-start gap-2">
                  <svg
                    className="w-5 h-5 text-red-500 mt-0.5 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            {result && <StopsList stops={result.stops} />}
          </div>

          {/* Right column */}
          <div className="lg:col-span-2 space-y-6">
            {loading && (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <svg
                    className="animate-spin h-10 w-10 text-blue-600 mx-auto mb-3"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  <p className="text-gray-500 text-sm">
                    Calculating route & generating ELD logs...
                  </p>
                </div>
              </div>
            )}

            {!loading && !result && (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <svg
                  className="w-20 h-20 mx-auto mb-4 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
                <h3 className="text-lg font-medium text-gray-600 mb-1">
                  Enter trip details to see the route and ELD logs
                </h3>
                <p className="text-sm text-gray-400">
                  The map, stops, and FMCSA-compliant daily log sheets will
                  appear here
                </p>
              </div>
            )}

            {!loading && result && (
              <>
                <RouteMap route={result.route} stops={result.stops} locations={result.locations} />

                {result.summary && (
                  <div className="bg-white rounded-xl shadow-md p-5">
                    <h2 className="text-lg font-semibold text-gray-800 mb-3">
                      Trip Summary
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <SummaryCard
                        label="Total Distance"
                        value={`${result.route.total_distance_miles || '—'} mi`}
                      />
                      <SummaryCard
                        label="Total Duration"
                        value={`${result.summary.total_duration_hours?.toFixed(1) || '—'} hrs`}
                      />
                      <SummaryCard
                        label="Driving Time"
                        value={`${result.route.total_drive_time_hours?.toFixed(1) || '—'} hrs`}
                      />
                      <SummaryCard
                        label="Log Sheets"
                        value={result.summary.num_days || 0}
                      />
                    </div>
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

function SummaryCard({ label, value }) {
  return (
    <div className="bg-blue-50 rounded-lg p-3 text-center">
      <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">
        {label}
      </p>
      <p className="text-lg font-bold text-blue-900 mt-1">{value}</p>
    </div>
  )
}

export default App
