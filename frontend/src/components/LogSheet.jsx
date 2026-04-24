import { useRef, useEffect, useCallback } from 'react'
import { drawLogSheet } from '../utils/logDrawer'

export default function LogSheet({ logData }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (canvasRef.current && logData) {
      drawLogSheet(canvasRef.current, logData)
    }
  }, [logData])

  const handleDownload = useCallback(() => {
    if (!canvasRef.current) return
    const link = document.createElement('a')
    link.download = `eld-log-${logData.date || 'sheet'}.png`
    link.href = canvasRef.current.toDataURL('image/png')
    link.click()
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
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full font-medium transition flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            PNG
          </button>
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
            FMCSA Compliant
          </span>
        </div>
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
