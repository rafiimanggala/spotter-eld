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
    <div className="card card-hover overflow-hidden">
      <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
          </div>
          <div>
            <span className="text-[13px] font-semibold text-stone-800 block">{logData.date || 'N/A'}</span>
            <div className="flex items-center gap-2 text-[11px] text-stone-400 mt-0.5">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Drive {totalDriving.toFixed(1)}h
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                On-Duty {totalOnDuty.toFixed(1)}h
              </span>
              <span>{logData.total_miles || logData.totalMiles || '—'} mi</span>
            </div>
          </div>
        </div>
        <button
          onClick={handleDownload}
          className="flex items-center gap-1.5 text-[12px] text-blue-600 hover:text-blue-700 font-medium transition-colors px-2.5 py-1.5 rounded-lg hover:bg-blue-50"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Download
        </button>
      </div>
      <div className="p-3 overflow-x-auto bg-stone-50/50">
        <canvas ref={canvasRef} className="max-w-full h-auto" style={{ imageRendering: 'auto' }} />
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
