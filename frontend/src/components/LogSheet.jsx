import { useRef, useEffect } from 'react'
import { drawLogSheet } from '../utils/logDrawer'

export default function LogSheet({ logData }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (canvasRef.current && logData) {
      drawLogSheet(canvasRef.current, logData)
    }
  }, [logData])

  if (!logData) return null

  const totalDriving = (logData.entries || [])
    .filter((e) => e.status === 'driving')
    .reduce((sum, e) => {
      const start = parseTime(e.start_time ?? e.start)
      const end = parseTime(e.end_time ?? e.end)
      return sum + (end - start)
    }, 0)

  const totalOnDuty = (logData.entries || [])
    .filter((e) => e.status === 'driving' || e.status === 'on_duty')
    .reduce((sum, e) => {
      const start = parseTime(e.start_time ?? e.start)
      const end = parseTime(e.end_time ?? e.end)
      return sum + (end - start)
    }, 0)

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-800">
            Daily Log — {logData.date || 'N/A'}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Driving: {totalDriving.toFixed(1)}h | On-Duty: {totalOnDuty.toFixed(1)}h |
            Miles: {logData.total_miles || logData.totalMiles || '—'}
          </p>
        </div>
        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
          FMCSA Compliant
        </span>
      </div>
      <div className="p-3 overflow-x-auto">
        <canvas
          ref={canvasRef}
          className="max-w-full h-auto"
          style={{ imageRendering: 'auto' }}
        />
      </div>
    </div>
  )
}

function parseTime(val) {
  if (typeof val === 'number') return val
  if (!val) return 0
  const parts = val.split(':')
  return (parseInt(parts[0], 10) || 0) + (parseInt(parts[1], 10) || 0) / 60
}
